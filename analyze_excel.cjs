const XLSX = require("xlsx");
const fs = require("fs");

const filename = "بيانات كل العملاء سواء من nps وملف استلامات المشاريع (1).xlsx";

if (!fs.existsSync(filename)) {
  console.log("File not found: " + filename);
  process.exit(1);
}

const workbook = XLSX.readFile(filename);

// 1. Check Customer Count
const customerSheet = workbook.Sheets["جميع بيانات العملاء"];
const customerData = XLSX.utils.sheet_to_json(customerSheet);
console.log("Total Customers in 'جميع بيانات العملاء':", customerData.length);

// 2. Check Sadeem Villas projects for delivery dates
const SadeemVillas = customerData.filter(c => 
  (c["المشروع"] && c["المشروع"].includes("سديم")) || 
  (c["Project"] && c["Project"].includes("Sadeem"))
);

console.log("\n--- Project Analysis: Sadeem/سديم ---");
console.log("Total Sadeem rows found:", SadeemVillas.length);
const withDates = SadeemVillas.filter(c => c["تاريخ التسليم"] || c["Delivery Date"]);
console.log("Sadeem rows with delivery dates:", withDates.length);
if (withDates.length > 0) {
    console.log("Sample Sadeem delivery date:", withDates[0]["تاريخ التسليم"] || withDates[0]["Delivery Date"]);
}

// 3. Project Summary
const projectMap = {};
customerData.forEach(c => {
    const p = c["المشروع"] || "N/A";
    if (!projectMap[p]) projectMap[p] = { total: 0, withDate: 0 };
    projectMap[p].total++;
    if (c["تاريخ التسليم"]) projectMap[p].withDate++;
});

console.log("\n--- Projects Summary ---");
Object.entries(projectMap).forEach(([p, stats]) => {
    console.log(`${p}: ${stats.total} customers, ${stats.withDate} with dates`);
});
