import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExcelActions from "@/components/dashboard/ExcelActions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type NpsRow = {
  id: string;
  timestamp: string | null;
  project_name: string | null;
  building_number: string | null;
  unit_number: string | null;
  customer_name: string | null;
  phone: string | null;
  match_status: string | null;
  nps_score: number | null;
  delivery_commitment_score: number | null;
  documents_received: string | null;
  finishing_quality_score: number | null;
  engineer_score: number | null;
  maintenance_score: number | null;
  maintenance_speed_score: number | null;
  communication_score: number | null;
  transparency_score: number | null;
  community_score: number | null;
  open_feedback: string | null;
};

const COLUMNS = [
  { key: "index", label: "#" },
  { key: "timestamp", label: "Timestamp" },
  { key: "project_name", label: "المشروع" },
  { key: "building_number", label: "رقم العمارة أو الفله " },
  { key: "unit_number", label: "رقم الوحدة " },
  { key: "customer_name", label: "اسم العميل" },
  { key: "phone", label: "رقم الجوال" },
  { key: "nps_score", label: "  بعد مرور سنة على استلام وحدتك السكنية ما مدى احتمالية أن توصي صديق أو قريب بشراء وحدة سكنية من الرمز؟  " },
  { key: "delivery_commitment_score", label: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟" },
  { key: "documents_received", label: "في رحلة التسليم, هل تم تسليمك المستندات كاملة ؟ ( المخططات, الضمانات)" },
  { key: "finishing_quality_score", label: "مامدى رضاك عن جودة المواد التشطبية؟" },
  { key: "engineer_score", label: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟" },
  { key: "maintenance_score", label: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ " },
  { key: "maintenance_speed_score", label: "  كيف تقيم سرعة تجاوب فريق الصيانة مع طلباتك؟  " },
  { key: "communication_score", label: "  كيف تقيم سهولة التواصل مع فريق خدمة العملاء بعد التسليم؟  " },
  { key: "transparency_score", label: "  ما مدى رضاك عن وضوح وشفافية الشركة في التعامل معك بعد الشراء؟  " },
  { key: "community_score", label: "  ما مدى رضاك عن بيئة المجتمع السكني من حيث النظافة والأمان؟  " },
  { key: "open_feedback", label: "ما هي أبرز الأمور التي ترغب أن نحسّنها لتكون تجربتك أكثر راحة؟ " },
];

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

export default function NpsYearPage() {
  const [rows, setRows] = useState<NpsRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nps_after_year_responses")
        .select("*")
        .order("timestamp", { ascending: false });
      if (data) setRows(data as NpsRow[]);
    })();
  }, []);

  return (
    <DashboardLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">NPS بعد سنة ({rows.length} استجابة)</h1>
          <ExcelActions 
            tableName="nps_after_year_responses" 
            data={rows} 
            onUploadComplete={() => window.location.reload()} 
            filename="NPS بعد سنة"
          />
        </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-secondary/50">
                   {COLUMNS.map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap text-center font-bold min-w-[100px] text-foreground">
                       {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-medium">{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap text-center">{r.timestamp ? new Date(r.timestamp).toLocaleDateString("ar-SA") : "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-center">{r.project_name || "-"}</TableCell>
                    <TableCell className="text-center">{r.building_number || "-"}</TableCell>
                    <TableCell className="text-center">{r.unit_number || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-center">{r.customer_name || "-"}</TableCell>
                    <TableCell dir="ltr" className="text-center">{r.phone || "-"}</TableCell>
                    <TableCell className={`text-center ${npsColor(r.nps_score)}`}>{r.nps_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.delivery_commitment_score)}`}>{r.delivery_commitment_score ?? "-"}</TableCell>
                    <TableCell className="text-center">{r.documents_received || "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.finishing_quality_score)}`}>{r.finishing_quality_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.engineer_score)}`}>{r.engineer_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.maintenance_score)}`}>{r.maintenance_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.maintenance_speed_score)}`}>{r.maintenance_speed_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.communication_score)}`}>{r.communication_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.transparency_score)}`}>{r.transparency_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.community_score)}`}>{r.community_score ?? "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-center" title={r.open_feedback || ""}>{r.open_feedback || "-"}</TableCell>
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
