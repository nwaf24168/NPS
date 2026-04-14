const XLSX = require('xlsx');
const wb = XLSX.readFile('بيانات كل العملاء سواء من nps وملف استلامات المشاريع (1).xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['جميع بيانات العملاء']);

function normalizePhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("00966")) cleaned = "+" + cleaned.slice(2);
  if (cleaned.startsWith("966")) cleaned = "+" + cleaned;
  if (cleaned.startsWith("05")) cleaned = "+966" + cleaned.slice(1);
  if (cleaned.startsWith("5") && cleaned.length === 9) cleaned = "+966" + cleaned;
  return cleaned;
}

const seen = new Set();
data.forEach(d => {
    const p = normalizePhone(d['رقم الجوال']);
    if (p && p.length >= 10) {
        const key = `${p}|${d['المشروع']}|${d['رقم العمارة / البلوك']}|${d['رقم الوحدة / الفلة']}`;
        seen.add(key);
    }
});
console.log('Unique NormalizedPhone/Proj/Unit combos:', seen.size);
