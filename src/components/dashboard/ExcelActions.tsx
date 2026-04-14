import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Dataset {
  sheetName: string;
  data: any[];
}

interface ExcelActionsProps {
  tableName: 'customers' | 'nps_new_responses' | 'nps_after_year_responses' | 'combined';
  data?: any[];
  multiDataset?: Dataset[];
  onUploadComplete?: () => void;
  filename?: string;
}

// EXACT headers matching the platform UI labels
const COLUMN_NAMES: Record<string, string> = {
  project: "المشروع",
  count: "العدد",
  nps: "NPS",
  
  // Dashboard NPS NEW
  satisfaction_score: "مامدى رضاك بشركة الرمز والخدمات المقدمة ",
  sales_score: "ما مدى رضاك عن العملية البيعية وعن ممثل المبيعات ؟",
  delivery_commitment_score: "في رحلة التسليم, ما مدى الالتزام في موعد التسليم ؟",
  finishing_notes_score: "في رحلة التسليم، مامدى رضاك عن اغلاق الملاحظات التشطيبية إن وجدت؟",
  
  // Dashboard NPS YEAR
  finishing_quality_score: "مامدى رضاك عن جودة المواد التشطبية؟",
  maintenance_speed_score: "كيف تقيم سرعة تجاوب فريق الصيانة مع طلباتك؟",
  communication_score: "كيف تقيم سهولة التواصل مع فريق خدمة العملاء بعد التسليم؟",
  transparency_score: "ما مدى رضاك عن وضوح وشفافية الشركة في التعامل معك بعد الشراء؟",
  community_score: "ما مدى رضاك عن بيئة المجتمع السكني من حيث النظافة والأمان؟",
  
  // NPS Tables (Headers from NpsNewPage COLUMNS)
  customer_name: "اسم العميل (مطابقة)",
  match_status: "حالة المطابقة",
  building_number: "رقم العمارة / البلوك",
  unit_number: "رقم الوحدة / الفلة",
  
  // Common
  name: "اسم العميل",
  phone: "رقم الجوال",
  project_name: "المشروع",
  delivery_date: "تاريخ التسليم",
  is_delivered: "حالة التسليم",
  documents_received: "في رحلة التسليم، هل تم تسليمك المستندات كاملة ؟ ( المخططات، الضمانات)",
  engineer_score: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟",
  maintenance_score: "في حال سبق ان طلبت طلب صيانة، ما مدى رضاك عن طلب الصيانة ؟ ",
  open_feedback: "كيف نستطيع ان نجعل تجربتك اكثر راحة ؟",
  timestamp: "التاريخ",
  nps_score: "مامدى ان توصي صديق بشراء وحدة سكنية من شركة الرمز ؟",
};

const NPS_YEAR_MAP: Record<string, string> = {
  delivery_commitment_score: "في رحلة التسليم، ما مدى الالتزام في موعد التسليم ؟",
  documents_received: "في رحلة التسليم، هل تم تسليمك المستندات كاملة ؟ ( المخططات، الضمانات)",
  finishing_quality_score: "مامدى رضاك عن جودة المواد التشطبية؟",
  engineer_score: "ما مدى رضاك عن المهندس الذي قام بتسليم الوحدة لك ؟",
  maintenance_score: "في حال سبق ان طلبت طلب صيانة، ما مدى رضاك عن طلب الصيانة ؟ ",
};

export default function ExcelActions({ tableName, data, multiDataset, onUploadComplete, filename = 'لوحة التحكم' }: ExcelActionsProps) {
  
  const translateData = (raw: any[], sheetName?: string) => {
    return raw.map(item => {
      const newItem: any = {};
      const isYearSheet = sheetName?.includes("سنة");

      const processEntries = (obj: any) => {
        Object.entries(obj).forEach(([key, val]) => {
          if (['id', 'created_at', 'token', 'user_id'].includes(key)) return;
          
          if (key === 'csatScores' && val && typeof val === 'object') {
            processEntries(val);
            return;
          }

          let label = COLUMN_NAMES[key] || key;
          if (isYearSheet && NPS_YEAR_MAP[key]) label = NPS_YEAR_MAP[key];

          if (typeof val === 'number' && key !== 'count' && key !== 'nps_score' && label !== 'NPS') {
             newItem[label] = `${val}%`;
          } else {
             newItem[label] = val;
          }
        });
      };

      processEntries(item);
      return newItem;
    });
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      if (multiDataset) {
        multiDataset.forEach(ds => {
          const translated = translateData(ds.data, ds.sheetName);
          const ws = XLSX.utils.json_to_sheet(translated);
          ws['!cols'] = Array(25).fill({ wch: 40 });
          XLSX.utils.book_append_sheet(wb, ws, ds.sheetName);
        });
      } else if (data) {
        const translated = translateData(data);
        const ws = XLSX.utils.json_to_sheet(translated);
        ws['!cols'] = Array(25).fill({ wch: 30 });
        XLSX.utils.book_append_sheet(wb, ws, "البيانات");
      }
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("تم التصدير بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error("خطأ أثناء التصدير");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) return;

        toast.info("جاري المعالجة...");
        if (tableName === 'customers') {
          await importCustomers(rawData);
        } else {
          const mappedData = rawData.map((row: any) => {
            const newRow: any = {};
            Object.entries(COLUMN_NAMES).forEach(([key, label]) => {
              if (row[label] !== undefined) {
                 let val = row[label];
                 if (typeof val === 'string' && val.endsWith('%')) val = parseFloat(val);
                 newRow[key] = val;
              }
            });
            return newRow;
          });
          const { error } = await supabase.from(tableName).upsert(mappedData);
          if (error) throw error;
        }
        toast.success("تم الاستيراد بنجاح");
        if (onUploadComplete) onUploadComplete();
      } catch (error: any) {
        toast.error(`خطأ: ${error.message}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const importCustomers = async (rawData: any[]) => {
    const customersMap = new Map();
    rawData.forEach((row: any) => {
      // Robust key lookup (handling spaces and various labels)
      const findVal = (labels: string[]) => {
        for(const l of labels) { if (row[l] !== undefined) return row[l]; }
        return null;
      };

      const phoneRaw = findVal(["رقم الجوال", "phone", "رقم الهاتف"]);
      if (!phoneRaw) return;

      let phone = String(phoneRaw).replace(/[\s\-\(\)]/g, "");
      if (phone.startsWith("05")) phone = "+966" + phone.slice(1);
      else if (phone.startsWith("5") && phone.length === 9) phone = "+966" + phone;
      else if (phone.startsWith("966") && !phone.startsWith("+")) phone = "+" + phone;

      if (!customersMap.has(phone)) {
        customersMap.set(phone, {
          name: findVal(["اسم العميل", "name", "Customer Name"]) || "عميل",
          phone: phone,
          projectUnits: []
        });
      }

      const c = customersMap.get(phone);
      const proj = String(findVal(["المشروع", "project_name", "المشروع "]) || "").trim();
      const bld = String(findVal(["رقم العمارة", "building_number", "رقم العمارة / البلوك", "العمارة"]) || "").trim();
      const unit = String(findVal(["رقم الوحدة", "unit_number", "رقم الوحدة / الفلة", "الوحدة"]) || "").trim();
      
      if (proj && unit) {
        // signature PROJECT|BUILDING|UNIT to avoid missing units
        const sig = `${proj}|${bld}|${unit}`;
        if (!c.projectUnits.includes(sig)) c.projectUnits.push(sig);
      }
    });

    const finalData = Array.from(customersMap.values()).map(c => ({
      name: c.name,
      phone: c.phone,
      project_name: Array.from(new Set(c.projectUnits.map((u:any) => u.split("|")[0]))).join(" + "),
      building_number: Array.from(new Set(c.projectUnits.map((u:any) => u.split("|")[1]))).join(", "),
      unit_number: c.projectUnits.map((u:any) => u.split("|")[2]).join(", "),
      token: Math.random().toString(36).substring(2, 15)
    }));

    const { error } = await supabase.from('customers').upsert(finalData, { onConflict: 'phone' });
    if (error) throw error;
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} className="flex gap-2 items-center rounded-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm transition-all">
        <Download className="w-4 h-4 text-emerald-600" />
        <span className="font-bold whitespace-nowrap">تصدير إكسيل</span>
      </Button>
      {tableName !== 'combined' && (
        <div className="relative">
          <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 font-bold whitespace-nowrap">استيراد</Button>
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      )}
    </div>
  );
}
