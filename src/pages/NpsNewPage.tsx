import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExcelActions from "@/components/dashboard/ExcelActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  satisfaction_score: number | null;
  sales_score: number | null;
  delivery_commitment_score: number | null;
  documents_received: string | null;
  finishing_notes_score: number | null;
  engineer_score: number | null;
  maintenance_score: number | null;
  open_feedback: string | null;
};

const COLUMNS = [
  { key: "index", label: "#" },
  { key: "timestamp", label: "Timestamp" },
  { key: "project_name", label: "المشروع " },
  { key: "building_number", label: "رقم العمارة " },
  { key: "unit_number", label: "رقم الشقة / الفلة" },
  { key: "customer_name", label: "اسم العميل" },
  { key: "phone", label: "رقم الجوال" },
  { key: "nps_score", label: "مامدى ان توصي صديق بشراء وحدة سكنية من شركة الرمز ؟" },
  { key: "satisfaction_score", label: "مامدى رضاك بشركة الرمز والخدمات المقدمة " },
  { key: "sales_score", label: "ما مدى رضاك عن العملية البيعية وعن ممثل المبيعات ؟" },
  { key: "delivery_commitment_score", label: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟" },
  { key: "documents_received", label: "في رحلة التسليم, هل تم تسليمك المستندات كاملة ؟ ( المخططات, الضمانات)" },
  { key: "finishing_notes_score", label: "في رحلة التسليم, مامدى رضاك عن اغلاق الملاحظات التشطبية إن وجدت؟" },
  { key: "engineer_score", label: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟" },
  { key: "maintenance_score", label: "في حال سبق ان طلبت طلب صيانة, ما مدى رضاك عن طلب الصيانة ؟ " },
  { key: "open_feedback", label: "كيف نستطيع ان نجعل تجربتك اكثر راحة ؟" },
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

export default function NpsNewPage() {
  const [rows, setRows] = useState<NpsRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nps_new_responses")
        .select("*")
        .order("timestamp", { ascending: false });
      if (data) setRows(data as NpsRow[]);
    })();
  }, []);

  return (
    <DashboardLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">NPS جديد ({rows.length} استجابة)</h1>
          <ExcelActions 
            tableName="nps_new_responses" 
            data={rows} 
            onUploadComplete={() => window.location.reload()} 
            filename="NPS جديد"
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
                    <TableCell className={`text-center ${scoreColor(r.satisfaction_score)}`}>{r.satisfaction_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.sales_score)}`}>{r.sales_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.delivery_commitment_score)}`}>{r.delivery_commitment_score ?? "-"}</TableCell>
                    <TableCell className="text-center">{r.documents_received || "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.finishing_notes_score)}`}>{r.finishing_notes_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.engineer_score)}`}>{r.engineer_score ?? "-"}</TableCell>
                    <TableCell className={`text-center ${scoreColor(r.maintenance_score)}`}>{r.maintenance_score ?? "-"}</TableCell>
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
