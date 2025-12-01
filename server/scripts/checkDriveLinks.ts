import { getGoogleSheetsClient } from "../googleSheets";

const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
const SHEET_NAME = 'Renta/Long Term';

async function checkDriveLinks() {
  const sheets = await getGoogleSheetsClient();
  
  // First get the headers to see all columns
  const headersResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!1:1`,
  });
  
  const headers = headersResponse.data.values?.[0] || [];
  console.log("=== COLUMN HEADERS ===");
  headers.forEach((h: string, i: number) => {
    const col = String.fromCharCode(65 + (i % 26));
    const prefix = i >= 26 ? String.fromCharCode(65 + Math.floor(i / 26) - 1) : '';
    console.log(`${prefix}${col}: ${h}`);
  });
  
  // Look for columns that might contain Drive links
  const driveColumns: number[] = [];
  headers.forEach((h: string, i: number) => {
    const lower = h?.toLowerCase() || '';
    if (lower.includes('foto') || lower.includes('photo') || lower.includes('drive') || 
        lower.includes('imagen') || lower.includes('image') || lower.includes('link') ||
        lower.includes('galeria') || lower.includes('gallery')) {
      driveColumns.push(i);
      console.log(`\n** Potential photo column: ${h} (column ${i})`);
    }
  });
  
  // Get some sample data from those columns
  if (driveColumns.length > 0) {
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A2:AZ20`,
    });
    
    const rows = dataResponse.data.values || [];
    console.log("\n=== SAMPLE DATA FROM POTENTIAL PHOTO COLUMNS ===");
    
    for (const colIndex of driveColumns) {
      const colName = headers[colIndex];
      console.log(`\n--- Column: ${colName} ---`);
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const value = rows[i]?.[colIndex];
        if (value && value.includes('drive.google.com')) {
          console.log(`Row ${i + 2}: ${value.substring(0, 100)}...`);
        }
      }
    }
  }
  
  // Also check fichas for Drive links
  console.log("\n=== CHECKING FICHAS FOR DRIVE LINKS ===");
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [`'${SHEET_NAME}'!T2:T20`],
    fields: 'sheets.data.rowData.values(note)',
  });
  
  const rowData = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
  let driveLinksInFichas = 0;
  
  for (let i = 0; i < rowData.length; i++) {
    const note = rowData[i]?.values?.[0]?.note;
    if (note) {
      const driveMatch = note.match(/https:\/\/drive\.google\.com\/[^\s\n]+/g);
      if (driveMatch) {
        driveLinksInFichas++;
        if (driveLinksInFichas <= 5) {
          console.log(`Row ${i + 2} ficha has Drive link: ${driveMatch[0].substring(0, 80)}...`);
        }
      }
    }
  }
  console.log(`\nTotal fichas with Drive links in first 20 rows: ${driveLinksInFichas}`);
}

checkDriveLinks()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
