import { google } from 'googleapis';
import { getGoogleSheetsClient } from "../googleSheets";

async function testDriveFolder() {
  const sheets = await getGoogleSheetsClient();
  const auth = sheets.context._options.auth;
  const drive = google.drive({ version: 'v3', auth });
  
  // Test folder from sheet
  const testFolderId = '1Jfiah69jaEXBpAzuPx3jKh0_zncWUkQ5';
  
  console.log("Testing folder access...\n");
  
  try {
    // First try to get folder info
    const folderInfo = await drive.files.get({
      fileId: testFolderId,
      fields: 'id, name, mimeType, shared, permissions',
    });
    console.log("Folder info:", folderInfo.data);
  } catch (error: any) {
    console.log("Cannot get folder info:", error.message);
  }
  
  try {
    // List ALL files in folder (not just images)
    const response = await drive.files.list({
      q: `'${testFolderId}' in parents`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 20,
    });
    
    console.log(`\nFound ${response.data.files?.length || 0} files:`);
    for (const file of response.data.files || []) {
      console.log(`  - ${file.name} (${file.mimeType})`);
    }
  } catch (error: any) {
    console.log("Cannot list files:", error.message);
    
    if (error.code === 404) {
      console.log("\nThe folder is not accessible. Options:");
      console.log("1. Make the folder public (anyone with link can view)");
      console.log("2. Share the folder with the Google account used for this app");
    }
  }
}

testDriveFolder()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
