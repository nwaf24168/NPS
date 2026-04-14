const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ntpmqosofxenmjhjsexz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cG1xb3NvZnhlbm1qaGpzZXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODMxMDksImV4cCI6MjA5MTU1OTEwOX0.Gh03tRlJQ0dN5KzYDL_corVLp0hLxB_wAhVX2lpBHwA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filename = "بيانات كل العملاء سواء من nps وملف استلامات المشاريع (1).xlsx";

function normalizePhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("00966")) cleaned = "+" + cleaned.slice(2);
  if (cleaned.startsWith("966")) cleaned = "+" + cleaned;
  if (cleaned.startsWith("05")) cleaned = "+966" + cleaned.slice(1);
  if (cleaned.startsWith("5") && cleaned.length === 9) cleaned = "+966" + cleaned;
  return cleaned;
}

function fixUnitNumber(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (s.startsWith("1900-01-")) {
    const dayMatch = s.match(/1900-01-(\d{1,2})/);
    if (dayMatch) return dayMatch[1];
  }
  return s;
}

async function sync() {
  const workbook = XLSX.readFile(filename);
  const sheet = workbook.Sheets["جميع بيانات العملاء"];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Processing ${rows.length} rows...`);

  const customersMap = new Map();

  for (const row of rows) {
    const phone = normalizePhone(row["رقم الجوال"]);
    if (!phone || phone.length < 10) continue;

    if (!customersMap.has(phone)) {
      customersMap.set(phone, {
        name: row["اسم العميل"] || "عميل غير مسمى",
        phone: phone,
        projectUnits: []
      });
    }

    const c = customersMap.get(phone);
    const proj = (row["المشروع"] || "").trim();
    const unit = fixUnitNumber(row["رقم الوحدة / الفلة"]);
    const bld = fixUnitNumber(row["رقم العمارة / البلوك"]);
    
    // Check if THIS EXACT unit/proj combo is already added for this person
    const sig = `${proj}|${bld}|${unit}`;
    if (!c.projectUnits.includes(sig)) {
        c.projectUnits.push(sig);
    }
  }

  let totalAggrUnits = 0;
  const importData = Array.from(customersMap.values()).map(c => {
    const units = c.projectUnits.map(u => u.split("|")[2]);
    totalAggrUnits += units.length;
    return {
      name: c.name,
      phone: c.phone,
      unit_number: units.join(", "),
      project_name: Array.from(new Set(c.projectUnits.map(u => u.split("|")[0]))).join(" + ")
    };
  });

  console.log(`Aggregated total units to sync: ${totalAggrUnits}`);
  console.log(`Total rows in Excel (minus missing phones): ${rows.length - 8}`);
}

sync().catch(console.error);
