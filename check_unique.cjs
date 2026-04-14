const XLSX = require('xlsx');
const wb = XLSX.readFile('بيانات كل العملاء سواء من nps وملف استلامات المشاريع (1).xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['جميع بيانات العملاء']);
const seen = new Set();
data.forEach(d => {
    const key = `${d['اسم العميل']}|${d['رقم الجوال']}|${d['المشروع']}|${d['رقم العمارة / البلوك']}|${d['رقم الوحدة / الفلة']}`;
    seen.add(key);
});
console.log('Unique Units in Excel:', seen.size);
