import ExcelJS from 'exceljs';
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(String.raw`F:\gaston-workspace\Doc Gaston\CM-RE-1010 Matriz Consolidada v2.xlsx`);
const ws = wb.getWorksheet('CM-RE-0601');
console.log('rowCount=', ws.rowCount, 'actualRowCount=', ws.actualRowCount, 'columnCount=', ws.columnCount, 'actualColCount=', ws.actualColumnCount);
console.log('lastRow.number=', ws.lastRow?.number);
let withData = 0;
ws.eachRow({ includeEmpty: false }, () => withData++);
console.log('eachRow includeEmpty:false counted=', withData);
let allRows = 0;
ws.eachRow({ includeEmpty: true }, () => allRows++);
console.log('eachRow includeEmpty:true counted=', allRows);
// Sample some specific rows
for (const r of [1,2,3,30,100,500,800,981]) {
  const row = ws.getRow(r);
  let n=0; row.eachCell({includeEmpty:false},()=>n++);
  console.log(`row ${r}: cells=${n} hasValues=${row.hasValues}`);
}
