import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import ExcelActions from "@/components/dashboard/ExcelActions";

type Customer = {
  id: string;
  name: string;
  phone: string;
  project_name: string | null;
  unit_number: string | null;
  building_number: string | null;
  delivery_date: string | null;
  is_delivered: boolean;
  has_responded: boolean;
  token: string;
  created_at: string;
};

type NpsResponse = {
  id: string;
  timestamp: string | null;
  project_name: string | null;
  nps_score: number | null;
  open_feedback: string | null;
  [key: string]: any;
};

const NPS_NEW_LABELS: Record<string, string> = {
  nps_score: "مامدى ان توصي صديق بشراء وحدة سكنية من شركة الرمز ؟",
  satisfaction_score: "مامدى رضاك بشركة الرمز والخدمات المقدمة ",
  sales_score: "ما مدى رضاك عن العملية البيعية وعن ممثل المبيعات ؟",
  delivery_commitment_score: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟",
  documents_received: "في رحلة التسليم, هل تم تسليمك المستندات كاملة ؟ ( المخططات, الضمانات)",
  finishing_notes_score: "في رحلة التسليم, مامدى رضاك عن اغلاق الملاحظات التشطبية إن وجدت؟",
  engineer_score: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟",
  maintenance_score: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ ",
  open_feedback: "كيف نستطيع ان نجعل تجربتك اكثر راحة ؟",
};

const NPS_YEAR_LABELS: Record<string, string> = {
  nps_score: "  بعد مرور سنة على استلام وحدتك السكنية ما مدى احتمالية أن توصي صديق أو قريب بشراء وحدة سكنية من الرمز؟  ",
  delivery_commitment_score: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟",
  documents_received: "في رحلة التسليم, هل تم تسليمك المستندات كاملة ؟ ( المخططات, الضمانات)",
  finishing_quality_score: "مامدى رضاك عن جودة المواد التشطبية؟",
  engineer_score: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟",
  maintenance_score: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ ",
  maintenance_speed_score: "  كيف تقيم سرعة تجاوب فريق الصيانة مع طلباتك؟  ",
  communication_score: "  كيف تقيم سهولة التواصل مع فريق خدمة العملاء بعد التسليم؟  ",
  transparency_score: "  ما مدى رضاك عن وضوح وشفافية الشركة في التعامل معك بعد الشراء؟  ",
  community_score: "  ما مدى رضاك عن بيئة المجتمع السكني من حيث النظافة والأمان؟  ",
  open_feedback: "ما هي أبرز الأمور التي ترغب أن نحسّنها لتكون تجربتك أكثر راحة؟ ",
};

const npsColor = (score: number | null) => {
  if (score === null) return "";
  if (score >= 9) return "text-green-600 font-bold";
  if (score >= 7) return "text-yellow-600 font-bold";
  return "text-red-600 font-bold";
};

const scoreColor = (score: number | null) => {
  if (score === null) return "";
  if (score >= 4) return "text-green-600 font-medium";
  if (score >= 3) return "text-yellow-600 font-medium";
  return "text-red-600 font-medium";
};

const isCsatField = (key: string) => {
  return key.includes("score") || key === "nps_score";
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [npsNewData, setNpsNewData] = useState<NpsResponse[]>([]);
  const [npsYearData, setNpsYearData] = useState<NpsResponse[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearCompletionFilter, setYearCompletionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerUnits, setCustomerUnits] = useState<Customer[]>([]);
  const [customerNpsNew, setCustomerNpsNew] = useState<NpsResponse[]>([]);
  const [customerNpsYear, setCustomerNpsYear] = useState<NpsResponse[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: custData }, { data: nNew }, { data: nYear }] = await Promise.all([
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("nps_new_responses").select("*"),
        supabase.from("nps_after_year_responses").select("*"),
      ]);
      if (custData) setCustomers(custData as Customer[]);
      if (nNew) setNpsNewData(nNew as NpsResponse[]);
      if (nYear) setNpsYearData(nYear as NpsResponse[]);
    })();
  }, []);

  const projects = useMemo(() => {
    const s = new Set<string>();
    customers.forEach((c) => {
      if (c.project_name) {
        c.project_name.split(" + ").forEach((p) => s.add(p.trim()));
      }
    });
    return Array.from(s).sort();
  }, [customers]);

  const years = useMemo(() => {
    const s = new Set<string>();
    customers.forEach((c) => {
      if (c.delivery_date) s.add(new Date(c.delivery_date).getFullYear().toString());
    });
    return Array.from(s).sort();
  }, [customers]);

  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      const units = (c.unit_number || "").split(",").filter((u) => u.trim().length > 0).length || 1;
      counts[c.phone] = (counts[c.phone] || 0) + units;
    });
    return counts;
  }, [customers]);

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      if (search && !c.name.includes(search) && !c.phone.includes(search)) return false;
      if (projectFilter !== "all" && !(c.project_name || "").includes(projectFilter)) return false;
      if (responseFilter === "responded" && !c.has_responded) return false;
      if (responseFilter === "not_responded" && c.has_responded) return false;
      if (deliveryFilter === "delivered" && !c.delivery_date) return false;
      if (deliveryFilter === "not_delivered" && c.delivery_date) return false;
      if (yearFilter !== "all" && c.delivery_date && new Date(c.delivery_date).getFullYear().toString() !== yearFilter) return false;
      if (monthFilter !== "all" && c.delivery_date && (new Date(c.delivery_date).getMonth() + 1).toString() !== monthFilter) return false;
      if (yearCompletionFilter === "completed_year" && c.delivery_date) {
        const diff = (new Date().getTime() - new Date(c.delivery_date).getTime()) / (1000 * 60 * 60 * 24);
        if (diff < 365) return false;
      }
      if (yearCompletionFilter === "completed_year" && !c.delivery_date) return false;
      return true;
    });

    if (sortBy === "most_units") {
      result.sort((a, b) => (unitCounts[b.phone] || 0) - (unitCounts[a.phone] || 0));
    }

    return result;
  }, [customers, search, projectFilter, responseFilter, deliveryFilter, yearFilter, monthFilter, yearCompletionFilter, sortBy, unitCounts]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    const units = customers.filter((c) => c.phone === customer.phone);
    setCustomerUnits(units);

    const phone = customer.phone;
    const normalizedPhone = phone.replace(/\+/g, "");
    const matchNew = npsNewData.filter((r) => r.phone && (r.phone === phone || r.phone.replace(/\+/g, "") === normalizedPhone || r.phone.replace(/[\s\-]/g, "").includes(normalizedPhone.slice(-9))));
    const matchYear = npsYearData.filter((r) => r.phone && (r.phone === phone || r.phone.replace(/\+/g, "") === normalizedPhone || r.phone.replace(/[\s\-]/g, "").includes(normalizedPhone.slice(-9))));
    setCustomerNpsNew(matchNew);
    setCustomerNpsYear(matchYear);
  };

  const baseUrl = window.location.origin;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">العملاء</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">بحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث بالاسم أو رقم الجوال..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">المشروع</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger><SelectValue placeholder="جميع المشاريع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">حالة الرد</label>
              <Select value={responseFilter} onValueChange={setResponseFilter}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="responded">استجاب</SelectItem>
                  <SelectItem value="not_responded">لم يستجب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">حالة التسليم</label>
              <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="delivered">مستلم</SelectItem>
                  <SelectItem value="not_delivered">لم يستلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">سنة التسليم</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger><SelectValue placeholder="جميع السنوات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السنوات</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">شهر التسليم</label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger><SelectValue placeholder="جميع الأشهر" /></SelectTrigger>
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
              <label className="text-xs font-medium text-muted-foreground">اكتمال السنة</label>
              <Select value={yearCompletionFilter} onValueChange={setYearCompletionFilter}>
                <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="completed_year">أكمل سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">الترتيب</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder="الافتراضي" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">الافتراضي</SelectItem>
                  <SelectItem value="most_units">الأكثر شراءً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50 mb-0 bg-muted/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-bold">قائمة العملاء ({filtered.length})</CardTitle>
            <ExcelActions 
              tableName="customers" 
              data={filtered} 
              onUploadComplete={() => window.location.reload()} 
              filename="قائمة العملاء"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">اسم العميل</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">رقم الجوال</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">المشروع</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">رقم العمارة / البلوك</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">رقم الوحدة / الفلة</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">تاريخ التسليم</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">التسليم</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">الرد</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">عدد المشاريع</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-center text-foreground">رابط الاستبيان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      <button className="font-medium text-primary hover:underline cursor-pointer whitespace-nowrap" onClick={() => handleCustomerClick(c)}>
                        {c.name}
                      </button>
                    </TableCell>
                    <TableCell dir="ltr" className="text-center">{c.phone}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{c.project_name || "-"}</TableCell>
                    <TableCell className="text-center">{c.building_number || "-"}</TableCell>
                    <TableCell className="text-center">{c.unit_number || "-"}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{c.delivery_date || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.delivery_date ? "default" : "secondary"} className="text-[10px]">
                        {c.delivery_date ? "مستلم" : "لم يستلم"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {c.has_responded ? <span className="text-green-600 font-bold">✔</span> : <span className="text-muted-foreground">✖</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">{unitCounts[c.phone] || 1}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <button className="text-[10px] text-primary underline" onClick={() => navigator.clipboard.writeText(`${baseUrl}/survey?token=${c.token}`)}>
                        نسخ الرابط
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl overflow-hidden">
          {selectedCustomer && (
            <div className="flex flex-col h-full bg-background">
              {/* Profile Header */}
              <div className="bg-primary/5 p-8 border-b border-primary/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-primary mb-1">{selectedCustomer.name}</h2>
                    <p className="text-muted-foreground font-medium dir-ltr inline-block bg-primary/10 px-3 py-1 rounded-full text-sm">
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  <Badge variant={selectedCustomer.delivery_date ? "default" : "secondary"} className="text-sm px-4 py-1.5 rounded-full shadow-sm">
                    {selectedCustomer.delivery_date ? "✅ تم الاستلام" : "⏳ لم يتم الاستلام بعد"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-background/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">إجمالي الوحدات</p>
                    <p className="text-xl font-bold">{unitCounts[selectedCustomer.phone] || 1}</p>
                  </div>
                  <div className="bg-background/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">المشاريع</p>
                    <p className="text-sm font-bold truncate">{selectedCustomer.project_name || "-"}</p>
                  </div>
                  <div className="bg-background/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">حالة الرد</p>
                    <p className={`text-sm font-bold ${selectedCustomer.has_responded ? "text-green-600" : "text-amber-600"}`}>
                      {selectedCustomer.has_responded ? "تم الرد" : "لم يرد بعد"}
                    </p>
                  </div>
                  <div className="bg-background/60 p-3 rounded-xl border border-primary/5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">آخر تاريخ تسليم</p>
                    <p className="text-sm font-bold">{selectedCustomer.delivery_date || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Individual Project Detail Boxes */}
                {(() => {
                  const projectsList = (selectedCustomer.project_name || "").split(" + ");
                  return projectsList.map((p, idx) => {
                    const projectNpsNew = customerNpsNew.filter(r => r.project_name === p);
                    const projectNpsYear = customerNpsYear.filter(r => r.project_name === p);
                    
                    return (
                      <section key={idx} className="p-6 rounded-3xl border border-primary/10 bg-primary/[0.02] space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-md">
                            مشروع: {p}
                          </Badge>
                          {selectedCustomer.delivery_date && (selectedCustomer.project_name || "").includes(p) && (
                             <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50">تم الاستلام</Badge>
                          )}
                        </div>

                        {/* NPS New Responses for this Project */}
                        {projectNpsNew.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-green-600 flex items-center gap-2">
                              <span className="h-2 w-2 bg-green-600 rounded-full" />
                              تقييمات الاستلام الجديد
                            </h4>
                            {projectNpsNew.map(r => (
                              <div key={r.id} className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-muted-foreground mb-4">التاريخ: {r.timestamp ? new Date(r.timestamp).toLocaleDateString("ar-SA") : "-"}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(NPS_NEW_LABELS).map(([key, label]) => {
                                    if (key === 'open_feedback') return null;
                                    const isScore = isCsatField(key);
                                    const val = r[key];
                                    return (
                                      <div key={key} className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground w-2/3">{label}</span>
                                        <span className={`font-bold ${isScore ? (key === 'nps_score' ? npsColor(val) : scoreColor(val)) : ""}`}>
                                          {val ?? "-"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {r.open_feedback && (
                                  <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-100 italic text-xs text-amber-900">
                                    " {r.open_feedback} "
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* NPS Year Responses for this Project */}
                        {projectNpsYear.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                              <span className="h-2 w-2 bg-blue-600 rounded-full" />
                              تقييمات ما بعد السنة
                            </h4>
                            {projectNpsYear.map(r => (
                              <div key={r.id} className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-muted-foreground mb-4">التاريخ: {r.timestamp ? new Date(r.timestamp).toLocaleDateString("ar-SA") : "-"}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(NPS_YEAR_LABELS).map(([key, label]) => {
                                    if (key === 'open_feedback') return null;
                                    const isScore = isCsatField(key);
                                    const val = r[key];
                                    return (
                                      <div key={key} className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground w-2/3">{label}</span>
                                        <span className={`font-bold ${isScore ? (key === 'nps_score' ? npsColor(val) : scoreColor(val)) : ""}`}>
                                          {val ?? "-"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {r.open_feedback && (
                                  <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 italic text-xs text-blue-900">
                                    " {r.open_feedback} "
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {projectNpsNew.length === 0 && projectNpsYear.length === 0 && (
                           <div className="bg-background/50 rounded-2xl p-4 text-center text-xs text-muted-foreground border border-dashed">
                             لم يتم تسجيل أي استجابة لهذا المشروع بعد
                           </div>
                        )}
                      </section>
                    );
                  });
                })()}

                {customerNpsNew.length === 0 && customerNpsYear.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-muted-foreground font-medium">لا توجد استجابات مسجلة لهذا العميل حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
