import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface SheetUnitRow {
  unitNumber: string;
  condominiumName?: string;
  rentPurpose?: string;
  floorNumber?: string;
  bedrooms?: string;
  bathrooms?: string;
  size?: string;
  rentAmount?: string;
  depositAmount?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  notes?: string;
}

export async function readUnitsFromSheet(spreadsheetId: string, range: string = 'Sheet1!A2:M'): Promise<SheetUnitRow[]> {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    unitNumber: row[0] || '',
    condominiumName: row[1] || '',
    rentPurpose: row[2] || 'long_term',
    floorNumber: row[3] || '',
    bedrooms: row[4] || '',
    bathrooms: row[5] || '',
    size: row[6] || '',
    rentAmount: row[7] || '',
    depositAmount: row[8] || '',
    ownerName: row[9] || '',
    ownerEmail: row[10] || '',
    ownerPhone: row[11] || '',
    notes: row[12] || '',
  }));
}

export async function getSpreadsheetInfo(spreadsheetId: string) {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return {
    title: response.data.properties?.title,
    sheets: response.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
    })),
  };
}
