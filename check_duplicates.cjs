const XLSX = require('xlsx');
const wb = XLSX.readFile('بيانات كل العملاء سواء من nps وملف استلامات المشاريع (1).xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['جميع بيانات العملاء']);
const seen = new Set();
let exactDupes = 0;
data.forEach(d => {
    const key = `${d['رقم الجوال']}|${d['المشروع']}|${d['رقم العمارة / البلوك']}|${d['رقم الوحدة / الفلة']}`;
    if (seen.has(key)) exactDupes++;
    else seen.add(key);
});
console.log('Total Rows:', data.length);
console.log('Unique Phone/Proj/Unit combos:', seen.size);
console.log('Exact Duplicates:', exactDupes);
