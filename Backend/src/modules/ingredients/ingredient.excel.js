const ExcelJS = require("exceljs");
const COLUMNS = [
  { key: "sku", headerEn: "SKU", headerAr: "الرمز", required: true, type: "string", width: 14 },
  { key: "nameAr", headerEn: "Arabic Name", headerAr: "الاسم بالعربي", required: true, type: "string", width: 22 },
  { key: "nameEn", headerEn: "English Name", headerAr: "الاسم بالإنجليزي", required: true, type: "string", width: 22 },
  { key: "storageUnit", headerEn: "Storage Unit", headerAr: "وحدة التخزين", required: true, type: "string", width: 12 },
  { key: "usageUnit", headerEn: "Usage Unit", headerAr: "وحدة الاستخدام", required: true, type: "string", width: 12 },
  { key: "conversionFactor", headerEn: "Conversion Factor", headerAr: "معامل التحويل", required: true, type: "decimal4", width: 16 },
  { key: "costPerStorageUnit", headerEn: "Cost per Storage Unit", headerAr: "تكلفة وحدة التخزين", required: true, type: "decimal4", width: 22 },
  { key: "calories", headerEn: "Calories", headerAr: "سعرات", required: false, type: "decimal2", width: 10 },
  { key: "protein", headerEn: "Protein", headerAr: "بروتين", required: false, type: "decimal2", width: 10 },
  { key: "fat", headerEn: "Fat", headerAr: "دهون", required: false, type: "decimal2", width: 10 },
  { key: "carbs", headerEn: "Carbs", headerAr: "كربوهيدرات", required: false, type: "decimal2", width: 10 },
];

function numFmtFor(type) {
  if (type === "decimal4") return "0.0000";
  if (type === "decimal2") return "0.00";
  return null;
}

// ---------- Export: build workbook from DB rows ----------

async function buildIngredientsWorkbook(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ChefLab";
  wb.created = new Date();
  const sheet = wb.addWorksheet("Ingredients");
  sheet.columns = COLUMNS.map((c) => ({ width: c.width }));
  const firstRow = sheet.getRow(1);
  COLUMNS.forEach((c, idx) => {
    const cell = firstRow.getCell(idx + 1);
    cell.value = c.headerEn;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });
  firstRow.commit();

  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  for (const row of rows) {
    const dataRow = sheet.getRow(2 + sheet.rowCount - 1);
    COLUMNS.forEach((c, idx) => {
      const cell = dataRow.getCell(idx + 1);
      const value = row[c.key];
      if (value === null || value === undefined) {
        cell.value = "";
      } else if (c.type === "decimal4" || c.type === "decimal2") {
        const n = typeof value === "object" && value !== null && typeof value.toNumber === "function"
          ? value.toNumber()
          : Number(value);
        cell.value = n;
        cell.numFmt = numFmtFor(c.type);
      } else {
        cell.value = String(value);
      }
    });
    dataRow.commit();
  }

  // const notes = wb.addWorksheet("Notes");
  // notes.columns = [{ width: 80 }];
  // const required = COLUMNS.filter((c) => c.required).map((c) => c.headerEn).join(", ");
  // const instructions = [
  //   "Required columns: " + required,
  //   "Use '.' as the decimal separator (do not use commas).",
  //   "Leave nutrition columns empty to skip the field.",
  //   "Brand column will be added in a future release.",
  // ];
  // instructions.forEach((line, i) => {
  //   const cell = notes.getCell(i + 1, 1);
  //   cell.value = line;
  //   cell.alignment = { wrapText: true };
  // });

  return wb;
}

// ---------- Import: parse workbook into structured rows ----------

async function parseIngredientsWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const sheet = wb.getWorksheet("Ingredients");
  if (!sheet) {
    return { headerOk: false, missingColumns: [], empty: true, rows: [] };
  }

  const enHeader = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    enHeader.push(cell.value);
  });

  const expectedHeaders = COLUMNS.map((c) => c.headerEn);
  const missingColumns = expectedHeaders.filter((h) => !enHeader.includes(h));

  if (missingColumns.length > 0) {
    return { headerOk: false, missingColumns, empty: false, rows: [] };
  }

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 2) return;
    const data = {};
    let hasAny = false;
    COLUMNS.forEach((c, idx) => {
      const cellValue = row.getCell(idx + 1).value;
      const value = cellToString(cellValue);
      data[c.key] = value;
      if (value !== "" && value !== null && value !== undefined) hasAny = true;
    });
    if (!hasAny) return; // skip fully empty rows
    rows.push({ rowNumber, data });
  });

  return { headerOk: true, missingColumns: [], empty: false, rows };
}

// Coerce an ExcelJS cell value to a flat string. Numbers → "12.5000",
// rich text → concatenated text, formulas → cached value, nulls → "".
function cellToString(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    // richText array of { text }
    return v.map((p) => (typeof p === "string" ? p : p.text || "")).join("");
  }
  if (typeof v === "object") {
    if (v.formula) return cellToString(v.result);
    if (v.text) return v.text;
    if (v.result !== undefined) return cellToString(v.result);
  }
  return String(v);
}

module.exports = {
  COLUMNS,
  buildIngredientsWorkbook,
  parseIngredientsWorkbook,
};
