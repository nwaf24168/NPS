import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExcelActions from "@/components/dashboard/ExcelActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MousePointer2, PlayCircle, CheckCircle2, ListFilter, Activity, Trash2, Search, FileDown, UserCheck, UserPlus, LogOut, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';

type QuestionResult = {
  question_text: string;
  question_type: string;
  answers: string[];
};

type TrackingEvent = {
  id: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  event_type: 'visit' | 'start' | 'complete' | 'left';
  timestamp: string;
};

export default function AnalyticsPage() {
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [rawTracking, setRawTracking] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importedTarget, setImportedTarget] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_tracking' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: trackData } = await supabase
      .from("survey_tracking" as any)
      .select("*")
      .order("timestamp", { ascending: false });
    
    if (trackData) setRawTracking(trackData as any as TrackingEvent[]);

    const { data: questions } = await supabase.from("questions").select("id, question_text, question_type").order("order_index");
    if (questions) {
      const qResults: QuestionResult[] = [];
      for (const q of questions) {
        const { data: answers } = await supabase.from("answers").select("answer_value").eq("question_id", q.id);
        qResults.push({ question_text: q.question_text, question_type: q.question_type, answers: (answers || []).map((a) => a.answer_value) });
      }
      setResults(qResults);
    }
    setLoading(false);
  };

  const handleDelete = async (t: TrackingEvent) => {
    const toastId = toast.loading(`جاري الحذف...`);
    const { error } = await supabase.from("survey_tracking" as any).delete().or(`customer_name.eq."${t.customer_name}",customer_id.eq."${t.customer_id}"`);
    if (error) { toast.error("فشل الحذف", { id: toastId }); }
    else { toast.success("تم الحذف بنجاح", { id: toastId }); fetchData(); }
  };

  const unifiedTracking = useMemo(() => {
    const map = new Map<string, TrackingEvent>();

    // فرز البيانات حسب الوقت أولاً (الأقدم للأحدث لكي يغطي الأحدث الأقدم)
    const sortedRaw = [...rawTracking].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedRaw.forEach(t => {
      const key = t.customer_id || t.customer_name;
      
      // منطق التحديث:
      // 1. إذا لم يكن موجوداً، أضفه.
      // 2. إذا وجدنا حالة "مكتمل"، نثبتها ولا نغيرها حتى لو فتح الرابط بعدها.
      // 3. عدا ذلك، الأولوية لآخر توقيت زمني.
      if (!map.has(key)) {
        map.set(key, t);
      } else {
        const existing = map.get(key)!;
        if (existing.event_type !== 'complete') {
          map.set(key, t);
        }
      }
    });

    return Array.from(map.values()).filter(t => {
      const matchesSearch = (t.customer_name?.toLowerCase().includes(search.toLowerCase())) || (t.project_name?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || t.event_type === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rawTracking, search, statusFilter]);

  const stats = {
    visits: unifiedTracking.filter(t => t.event_type === 'visit').length,
    starts: unifiedTracking.filter(t => t.event_type === 'start').length,
    completes: unifiedTracking.filter(t => t.event_type === 'complete').length,
    left: unifiedTracking.filter(t => t.event_type === 'left').length,
  };

  const funnelData = [
    { name: 'دخل الرابط', count: stats.visits, fill: '#3b82f6' },
    { name: 'بدأ الإجابة', count: stats.starts, fill: '#f59e0b' },
    { name: 'خرج ولم يكمل', count: stats.left, fill: '#ef4444' }, // إضافة حالة الخروج للرسم البياني
    { name: 'مكتمل', count: stats.completes, fill: '#10b981' },
  ];

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'visit': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 uppercase text-[10px] font-bold">دخل الرابط</Badge>;
      case 'start': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase text-[10px] font-bold">بدأ الإجابة</Badge>;
      case 'complete': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 uppercase text-[10px] font-bold">مكتمل</Badge>;
      case 'left': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-100 uppercase text-[10px] font-bold">خرج ولم يكمل</Badge>;
      default: return null;
    }
  };

  const comparisonList = useMemo(() => {
    if (importedTarget.length === 0) return [];
    return importedTarget.map(target => {
      const name = target["اسم العميل"] || target["name"] || "";
      const trackEntry = Array.from(unifiedTracking).find(t => t.customer_name === name);
      let status: any = 'not_opened';
      if (trackEntry) {
        status = trackEntry.event_type === 'complete' ? 'completed' : trackEntry.event_type === 'start' ? 'started' : trackEntry.event_type === 'left' ? 'left' : 'visited';
      }
      return { name, phone: String(target["رقم الجوال"] || target["phone"] || "").replace(/[\s\-]/g, ""), project: target["المشروع"] || "-", status };
    });
  }, [importedTarget, unifiedTracking]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold font-primary mb-2 flex items-center gap-2">
              <RefreshCw className={`h-6 w-6 text-primary ${loading ? 'animate-spin' : ''}`} />
              متابعة النشاط اللحظي
            </h1>
            <p className="text-muted-foreground font-medium">تتبع مسار التحويل وحالات العملاء الفعلية بدقة</p>
          </div>
          <div className="flex gap-2">
            <ExcelActions tableName={"survey_tracking" as any} data={unifiedTracking} filename="سجل تتبع الروابط" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           <StatCard title="دخل الرابط" value={stats.visits} icon={MousePointer2} color="blue" />
           <StatCard title="بدأ الإجابة" value={stats.starts} icon={PlayCircle} color="amber" />
           <StatCard title="خرج ولم يكمل" value={stats.left} icon={LogOut} color="red" />
           <StatCard title="مكتمل" value={stats.completes} icon={CheckCircle2} color="emerald" />
           <StatCard title="إجمالي التفاعل" value={unifiedTracking.length} icon={UserPlus} color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-none shadow-xl rounded-[2rem]">
             <CardHeader className="bg-muted/5 border-b py-6"><CardTitle className="text-lg">مسار التحويل (Conversion)</CardTitle></CardHeader>
             <CardContent className="pt-10">
               <ResponsiveContainer width="100%" height={280}>
                 <BarChart data={funnelData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                   <YAxis hide />
                   <Tooltip />
                   <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                     {funnelData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-xl rounded-[2rem] overflow-hidden">
             <CardHeader className="bg-muted/5 border-b py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2"><ListFilter className="w-5 h-5 text-primary" /> سجل التتبع التفصيلي</CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                   <div className="relative flex-1 md:w-64">
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث بالاسم أو المشروع..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-10 rounded-full" />
                   </div>
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px] rounded-full h-10">
                         <SelectValue placeholder="تصفية الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all">الكل</SelectItem>
                         <SelectItem value="visit">دخل الرابط</SelectItem>
                         <SelectItem value="start">بدأ الإجابة</SelectItem>
                         <SelectItem value="complete">مكتمل</SelectItem>
                         <SelectItem value="left">خرج ولم يكمل</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto text-right" dir="rtl">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/20"><TableHead className="text-right font-black">العميل</TableHead><TableHead className="text-right font-black">المشروع</TableHead><TableHead className="text-center font-black">الحالة الفعلية</TableHead><TableHead className="text-center font-black">آخر إجراء</TableHead><TableHead className="text-center font-black">إجراء</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {unifiedTracking.map((t) => (
                          <TableRow key={t.id} className="group hover:bg-muted/5">
                            <TableCell className="font-bold py-4">{t.customer_name}</TableCell>
                            <TableCell className="text-muted-foreground">{t.project_name}</TableCell>
                            <TableCell className="text-center">{getEventBadge(t.event_type)}</TableCell>
                            <TableCell className="text-center text-[10px] text-muted-foreground font-mono">{new Date(t.timestamp).toLocaleString("ar-SA")}</TableCell>
                            <TableCell className="text-center">
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="mt-10 bg-primary/5 p-8 rounded-[3rem] border border-primary/10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="space-y-1 text-right">
                <h2 className="text-2xl font-bold flex items-center gap-2 justify-end"><UserCheck className="text-primary h-6 w-6" /> المقارنة مع القائمة المستهدفة</h2>
                <p className="text-sm text-muted-foreground">تحديد حالة كل عميل في القائمة المرفوعة بناءً على نشاطه الحالي</p>
              </div>
              <div className="relative">
                <Button className="rounded-full px-8 flex gap-2"><FileDown className="w-4 h-4" /> استيراد قائمة للمقارنة</Button>
                <input type="file" accept=".xlsx,.xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onload = (evt) => {
                       const bstr = evt.target?.result;
                       const wb = XLSX.read(bstr, { type: 'binary' });
                       const ws = wb.Sheets[wb.SheetNames[0]];
                       const data = XLSX.utils.sheet_to_json(ws);
                       setImportedTarget(data);
                       toast.success(`تم تحميل ${data.length} عميل للمقارنة`);
                     };
                     reader.readAsBinaryString(file);
                   }
                }} />
              </div>
           </div>

           {comparisonList.length > 0 && (
              <div className="bg-background rounded-[2rem] shadow-2xl border border-primary/10 overflow-hidden">
                 <Table dir="rtl">
                    <TableHeader><TableRow className="bg-muted/10"><TableHead className="text-right">العميل</TableHead><TableHead className="text-right">المشروع</TableHead><TableHead className="text-center">حالة التفاعل</TableHead></TableRow></TableHeader>
                    <TableBody>
                       {comparisonList.map((row, i) => (
                         <TableRow key={i}>
                           <TableCell className="font-bold">{row.name}</TableCell>
                           <TableCell>{row.project}</TableCell>
                           <TableCell className="text-center">
                              {row.status === 'completed' && <Badge className="bg-emerald-500 text-white border-none">تمت الإجابة ✅</Badge>}
                              {(row.status === 'started' || row.status === 'visited') && <Badge className="bg-amber-500 text-white border-none">تفاعل ولم يرسل ⏳</Badge>}
                              {row.status === 'left' && <Badge className="bg-red-500 text-white border-none">خرج ولم يكمل 🚪</Badge>}
                              {row.status === 'not_opened' && <Badge className="bg-red-500 text-white border-none">لم يفتح ❌</Badge>}
                           </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600"
  };
  return (
    <Card className={`rounded-[2rem] border-none shadow-xl ${colors[color]} p-6 relative overflow-hidden`}>
      <p className="text-sm font-bold opacity-70 mb-1">{title}</p>
      <div className="flex justify-between items-end">
         <h3 className="text-2xl md:text-4xl font-black">{value}</h3>
         <Icon className="w-10 h-10 opacity-20" />
      </div>
    </Card>
  );
}
