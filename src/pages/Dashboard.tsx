import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExcelActions from "@/components/dashboard/ExcelActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, MessageSquare } from "lucide-react";

type NpsResponse = {
  timestamp: string | null;
  project_name: string | null;
  nps_score: number | null;
  [key: string]: any;
};

function calcNps(scores: number[]): number {
  const valid = scores.filter((s) => s >= 0 && s <= 10);
  if (valid.length === 0) return 0;
  const promoters = valid.filter((s) => s >= 9).length;
  const detractors = valid.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / valid.length) * 100);
}

function calcCsat(scores: number[]): number {
  const valid = scores.filter((s) => s >= 1);
  if (valid.length === 0) return 0;
  const satisfied = valid.filter((s) => s >= 4).length;
  return Math.round((satisfied / valid.length) * 100);
}

const NPS_NEW_CSAT_FIELDS = [
  { key: "satisfaction_score", label: "مامدى رضاك بشركة الرمز والخدمات المقدمة " },
  { key: "sales_score", label: "ما مدى رضاك عن العملية البيعية وعن ممثل المبيعات ؟" },
  { key: "delivery_commitment_score", label: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟" },
  { key: "finishing_notes_score", label: "في رحلة التسليم, مامدى رضاك عن اغلاق الملاحظات التشطبية إن وجدت؟" },
  { key: "engineer_score", label: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟" },
  { key: "maintenance_score", label: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ " },
];

const NPS_YEAR_CSAT_FIELDS = [
  { key: "delivery_commitment_score", label: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟" },
  { key: "finishing_quality_score", label: "مامدى رضاك عن جودة المواد التشطبية؟" },
  { key: "engineer_score", label: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟" },
  { key: "maintenance_score", label: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ " },
  { key: "maintenance_speed_score", label: "  كيف تقيم سرعة تجاوب فريق الصيانة مع طلباتك؟  " },
  { key: "communication_score", label: "  كيف تقيم سهولة التواصل مع فريق خدمة العملاء بعد التسليم؟  " },
  { key: "transparency_score", label: "  ما مدى رضاك عن وضوح وشفافية الشركة في التعامل معك بعد الشراء؟  " },
  { key: "community_score", label: "  ما مدى رضاك عن بيئة المجتمع السكني من حيث النظافة والأمان؟  " },
];

export default function Dashboard() {
  const [npsNew, setNpsNew] = useState<NpsResponse[]>([]);
  const [npsYear, setNpsYear] = useState<NpsResponse[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalResponded, setTotalResponded] = useState(0);
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: d1 } = await supabase.from("nps_new_responses").select("*");
      const { data: d2 } = await supabase.from("nps_after_year_responses").select("*");
      if (d1) setNpsNew(d1 as NpsResponse[]);
      if (d2) setNpsYear(d2 as NpsResponse[]);

      setTotalResponded((d1?.length || 0) + (d2?.length || 0));

      const { data: custData } = await supabase.from("customers").select("unit_number");
      if (custData) {
        let totalUnits = 0;
        custData.forEach(c => {
          const units = (c.unit_number || "").split(",").filter((u: string) => u.trim().length > 0).length || 1;
          totalUnits += units;
        });
        setTotalCustomers(totalUnits + 8);
      }
    })();
  }, []);

  const allResponses = useMemo(() => [...npsNew, ...npsYear], [npsNew, npsYear]);

  const years = useMemo(() => {
    const s = new Set<string>();
    allResponses.forEach((r) => {
      if (r.timestamp) s.add(new Date(r.timestamp).getFullYear().toString());
    });
    return Array.from(s).sort();
  }, [allResponses]);

  const projects = useMemo(() => {
    const s = new Set<string>();
    allResponses.forEach((r) => { if (r.project_name) s.add(r.project_name); });
    return Array.from(s).sort();
  }, [allResponses]);

  const filterFn = (r: NpsResponse) => {
    if (yearFilter !== "all" && r.timestamp && new Date(r.timestamp).getFullYear().toString() !== yearFilter) return false;
    if (monthFilter !== "all" && r.timestamp && (new Date(r.timestamp).getMonth() + 1).toString() !== monthFilter) return false;
    if (projectFilter !== "all" && r.project_name !== projectFilter) return false;
    return true;
  };

  const filteredNew = useMemo(() => npsNew.filter(filterFn), [npsNew, yearFilter, monthFilter, projectFilter]);
  const filteredYear = useMemo(() => npsYear.filter(filterFn), [npsYear, yearFilter, monthFilter, projectFilter]);
  const filteredAll = useMemo(() => [...filteredNew, ...filteredYear], [filteredNew, filteredYear]);

  const npsNewScore = calcNps(filteredNew.map((r) => r.nps_score).filter((s): s is number => s !== null));
  const npsYearScore = calcNps(filteredYear.map((r) => r.nps_score).filter((s): s is number => s !== null));
  const npsAllScore = calcNps(filteredAll.map((r) => r.nps_score).filter((s): s is number => s !== null));

  const buildProjectTable = (data: NpsResponse[], csatFields: { key: string; label: string }[]) => {
    const projectMap: Record<string, NpsResponse[]> = {};
    data.forEach((r) => {
      const p = r.project_name || "غير محدد";
      if (!projectMap[p]) projectMap[p] = [];
      projectMap[p].push(r);
    });

    return Object.entries(projectMap).map(([project, rows]) => {
      const nps = calcNps(rows.map((r) => r.nps_score).filter((s): s is number => s !== null));
      const csatScores: Record<string, number> = {};
      csatFields.forEach((f) => {
        const scores = rows.map((r) => r[f.key]).filter((s): s is number => typeof s === "number" && s >= 1);
        csatScores[f.key] = calcCsat(scores);
      });
      return { project, count: rows.length, nps, csatScores };
    });
  };

  const newProjectData = useMemo(() => buildProjectTable(filteredNew, NPS_NEW_CSAT_FIELDS), [filteredNew]);
  const yearProjectData = useMemo(() => buildProjectTable(filteredYear, NPS_YEAR_CSAT_FIELDS), [filteredYear]);

  const npsColor = (score: number) => score >= 50 ? "text-green-600" : score >= 0 ? "text-yellow-600" : "text-red-600";
  const scoreColor = (score: number) => score >= 90 ? "text-green-600" : score >= 70 ? "text-yellow-600" : "text-red-600";

  return (
    <DashboardLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">إحصائيات المنصة</h1>
        <div className="flex gap-2">
           <ExcelActions 
             tableName="combined" 
             multiDataset={[
               { sheetName: "NPS جديد", data: newProjectData },
               { sheetName: "NPS بعد سنة", data: yearProjectData }
             ]}
             filename="لوحة التحكم"
           />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">السنة</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="السنة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">الشهر</label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="الشهر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأشهر</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleString("ar-SA", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">المشروع</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="المشروع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">إجمالي العملاء</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">عدد المستجيبين</CardTitle>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalResponded}</div>
          </CardContent>
        </Card>
        {[
          { title: "NPS الجديد", score: npsNewScore, count: filteredNew.length },
          { title: "NPS بعد سنة", score: npsYearScore, count: filteredYear.length },
          { title: "NPS الكل", score: npsAllScore, count: filteredAll.length },
        ].map((c) => (
          <Card key={c.title} className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">{c.title}</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${npsColor(c.score)}`}>{c.score}%</div>
              <p className="text-xs text-muted-foreground mt-1">{c.count} استجابة</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NPS New Project Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/5">
          <CardTitle className="text-lg font-bold">NPS جديد - حسب المشروع</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="whitespace-nowrap font-bold text-center sticky right-0 bg-secondary z-10">المشروع</TableHead>
                  <TableHead className="whitespace-nowrap text-center font-bold">العدد</TableHead>
                  <TableHead className="whitespace-nowrap text-center font-bold">NPS</TableHead>
                  {NPS_NEW_CSAT_FIELDS.map((f) => (
                    <TableHead key={f.key} className="whitespace-nowrap text-center font-bold min-w-[120px]">{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {newProjectData.map((row) => (
                  <TableRow key={row.project} className="hover:bg-muted/30">
                    <TableCell className="font-medium whitespace-nowrap text-center sticky right-0 bg-background z-10 border-l">{row.project}</TableCell>
                    <TableCell className="text-center">{row.count}</TableCell>
                    <TableCell className={`text-center font-bold ${npsColor(row.nps)}`}>{row.nps}%</TableCell>
                    {NPS_NEW_CSAT_FIELDS.map((f) => (
                      <TableCell key={f.key} className={`text-center font-medium ${scoreColor(row.csatScores[f.key])}`}>{row.csatScores[f.key]}%</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* NPS Year Project Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/5">
          <CardTitle className="text-lg font-bold">NPS بعد سنة - حسب المشروع</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="whitespace-nowrap font-bold text-center sticky right-0 bg-secondary z-10">المشروع</TableHead>
                  <TableHead className="whitespace-nowrap text-center font-bold">العدد</TableHead>
                  <TableHead className="whitespace-nowrap text-center font-bold">NPS</TableHead>
                  {NPS_YEAR_CSAT_FIELDS.map((f) => (
                    <TableHead key={f.key} className="whitespace-nowrap text-center font-bold min-w-[120px]">{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearProjectData.map((row) => (
                  <TableRow key={row.project} className="hover:bg-muted/30">
                    <TableCell className="font-medium whitespace-nowrap text-center sticky right-0 bg-background z-10 border-l">{row.project}</TableCell>
                    <TableCell className="text-center">{row.count}</TableCell>
                    <TableCell className={`text-center font-bold ${npsColor(row.nps)}`}>{row.nps}%</TableCell>
                    {NPS_YEAR_CSAT_FIELDS.map((f) => (
                      <TableCell key={f.key} className={`text-center font-medium ${scoreColor(row.csatScores[f.key])}`}>{row.csatScores[f.key]}%</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
