import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/supabase-helpers";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

type ImportRow = {
  name: string;
  phone: string;
  unit_number: string;
  building_number: string;
  project_name: string;
  is_delivered: boolean;
  delivery_date: string | null;
};

const HEADER_PATTERNS: Record<string, RegExp> = {
  name: /اسم.*عميل|اسم.*مالك|الاسم|owner.*name|client.*name/i,
  phone: /رقم.*جوال|رقم.*هاتف|الجوال|الهاتف|mobile|phone/i,
  unit: /رقم.*وحد|الوحدة|unit/i,
  building: /بلوك|رقم.*عمار|المبنى|building|block/i,
  delivery_date: /تاريخ.*تسليم|تاريخ.*استلام|delivery.*date/i,
  delivery_status: /محضر.*استلام|تسليم.*مفتاح|حالة.*تسليم|استلام/i,
};

function detectHeaderRow(sheet: XLSX.WorkSheet): { headerRow: number; colMap: Record<string, number> } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
    const colMap: Record<string, number> = {};
    let matchCount = 0;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const val = String(cell.v || "").trim();
      if (HEADER_PATTERNS.name.test(val)) { colMap.name = c; matchCount++; }
      if (HEADER_PATTERNS.phone.test(val)) { colMap.phone = c; matchCount++; }
      if (HEADER_PATTERNS.unit.test(val)) { colMap.unit = c; matchCount++; }
      if (HEADER_PATTERNS.building.test(val)) { colMap.building = c; matchCount++; }
      if (HEADER_PATTERNS.delivery_date.test(val)) { colMap.delivery_date = c; matchCount++; }
      if (HEADER_PATTERNS.delivery_status.test(val)) { colMap.delivery_status = c; matchCount++; }
    }
    if (matchCount >= 2 && colMap.name !== undefined && colMap.phone !== undefined) {
      return { headerRow: r, colMap };
    }
  }
  return null;
}

function extractRows(sheet: XLSX.WorkSheet, sheetName: string): ImportRow[] {
  const detected = detectHeaderRow(sheet);
  if (!detected) return [];
  const { headerRow, colMap } = detected;
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const rows: ImportRow[] = [];

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const getVal = (col?: number) => {
      if (col === undefined) return "";
      const cell = sheet[XLSX.utils.encode_cell({ r, c: col })];
      return cell ? String(cell.v || "").trim() : "";
    };

    const name = getVal(colMap.name);
    const phone = getVal(colMap.phone);
    if (!name || !phone) continue;

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 10) continue;

    const deliveryDateStr = getVal(colMap.delivery_date);
    const deliveryStatus = getVal(colMap.delivery_status);
    const isDelivered = !!(deliveryDateStr || /محضر|استلام|تسليم.*مفتاح/i.test(deliveryStatus));

    let deliveryDate: string | null = null;
    if (deliveryDateStr) {
      const d = new Date(deliveryDateStr);
      if (!isNaN(d.getTime())) deliveryDate = d.toISOString().split("T")[0];
    }

    rows.push({
      name,
      phone: normalizedPhone,
      unit_number: getVal(colMap.unit),
      building_number: getVal(colMap.building),
      project_name: sheetName,
      is_delivered: isDelivered,
      delivery_date: deliveryDate,
    });
  }
  return rows;
}

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    setProgress(0);

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);

    let allRows: ImportRow[] = [];
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      allRows = allRows.concat(extractRows(sheet, name));
    }

    let inserted = 0, updated = 0, errors = 0;

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      try {
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", row.phone)
          .maybeSingle();

        if (existing) {
          await supabase.from("customers").update({
            name: row.name,
            project_name: row.project_name,
            unit_number: row.unit_number,
            building_number: row.building_number,
            is_delivered: row.is_delivered,
            delivery_date: row.delivery_date,
          }).eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("customers").insert({
            name: row.name,
            phone: row.phone,
            project_name: row.project_name,
            unit_number: row.unit_number,
            building_number: row.building_number,
            is_delivered: row.is_delivered,
            delivery_date: row.delivery_date,
          });
          inserted++;
        }
      } catch {
        errors++;
      }
      setProgress(Math.round(((i + 1) / allRows.length) * 100));
    }

    setResult({ inserted, updated, errors });
    setImporting(false);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">استيراد بيانات العملاء</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>رفع ملف Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            يدعم النظام ملفات Excel متعددة الأوراق. كل ورقة تمثل مشروعاً. يتم اكتشاف الأعمدة تلقائياً.
          </p>

          <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-muted-foreground">اضغط لاختيار ملف Excel</span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={importing} />
          </label>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">جاري الاستيراد... {progress}%</p>
            </div>
          )}

          {result && (
            <div className="space-y-2 p-4 bg-secondary rounded-xl">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">تم الاستيراد بنجاح</span>
              </div>
              <p className="text-sm">تم إضافة {result.inserted} عميل جديد</p>
              <p className="text-sm">تم تحديث {result.updated} عميل</p>
              {result.errors > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {result.errors} خطأ
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
