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

function parseDate(d) {
  if (!d) return null;
  if (typeof d === "number") {
    const dc = XLSX.SSF.parse_date_code(d);
    return `${dc.y}-${String(dc.m).padStart(2, '0')}-${String(dc.d).padStart(2, '0')}`;
  }
  const s = String(d).trim();
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    let day = match[1].padStart(2, '0');
    let month = match[2].padStart(2, '0');
    let year = match[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }
  const dd = new Date(s);
  if (!isNaN(dd.getTime())) return dd.toISOString().split("T")[0];
  return null;
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

  console.log(`Processing ${rows.length} rows with precise aggregation & date fix...`);

  const customersMap = new Map();

  for (const row of rows) {
    const phone = normalizePhone(row["رقم الجوال"]);
    if (!phone || phone.length < 10) continue;

    if (!customersMap.has(phone)) {
      customersMap.set(phone, {
        name: row["اسم العميل"] || "عميل غير مسمى",
        phone: phone,
        projectUnits: new Array(), // Use array to allow all entries
        delivery_dates: []
      });
    }

    const c = customersMap.get(phone);
    const proj = (row["المشروع"] || "").trim();
    const unit = fixUnitNumber(row["رقم الوحدة / الفلة"]);
    const bld = fixUnitNumber(row["رقم العمارة / البلوك"]);
    
    // Check if exactly this unit is already added for this person to avoid row duplication errors, but keep multi-project units
    const sig = `${proj}|${bld}|${unit}`;
    if (!c.projectUnits.includes(sig)) {
        c.projectUnits.push(sig);
    }

    const d = parseDate(row["تاريخ التسليم"]);
    if (d) c.delivery_dates.push(d);
  }

  const importData = Array.from(customersMap.values()).map(c => {
    const units = c.projectUnits.map(u => u.split("|")[2]);
    const projects = Array.from(new Set(c.projectUnits.map(u => u.split("|")[0])));
    const buildings = Array.from(new Set(c.projectUnits.map(u => u.split("|")[1])));
    
    const latestDate = c.delivery_dates.sort().reverse()[0] || null;

    return {
      name: c.name,
      phone: c.phone,
      project_name: projects.join(" + "),
      building_number: buildings.join(", "),
      unit_number: units.join(", "),
      delivery_date: latestDate,
      is_delivered: !!latestDate,
      token: Math.random().toString(36).substring(2, 15)
    };
  });

  console.log(`Aggregated into ${importData.length} unique customers.`);

  const CHUNK_SIZE = 50;
  for (let i = 0; i < importData.length; i += CHUNK_SIZE) {
    const chunk = importData.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("customers").upsert(chunk, { onConflict: 'phone' });
    if (error) console.error(`Error upserting chunk ${i}:`, error.message);
    else console.log(`Upserted ${i + chunk.length} / ${importData.length}`);
  }

  console.log("Sync complete!");
}

sync().catch(console.error);
