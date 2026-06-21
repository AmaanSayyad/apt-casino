import { createSign } from 'crypto';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function getGoogleSheetsCredentials() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

async function getGoogleAccessToken(): Promise<string> {
  const creds = getGoogleSheetsCredentials();
  if (!creds) throw new Error('Google Sheets credentials not configured');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: SHEETS_SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  signer.end();
  const signature = signer.sign(creds.privateKey, 'base64url');
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Failed to authenticate with Google');
  }
  return json.access_token;
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    getGoogleSheetsCredentials() && process.env.KOL_ALLOCATIONS_GOOGLE_SHEET_ID?.trim(),
  );
}

export async function writeGoogleSheetValues(sheetId: string, values: string[][]): Promise<void> {
  const token = await getGoogleAccessToken();
  const range = process.env.KOL_ALLOCATIONS_GOOGLE_SHEET_RANGE?.trim() || 'Sheet1!A1';
  const clearRange = range.replace(/![^!]+$/, '!A:ZZ');

  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(clearRange)}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!clearRes.ok) {
    const err = await clearRes.text();
    throw new Error(`Failed to clear Google Sheet: ${err}`);
  }

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    },
  );
  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Failed to write Google Sheet: ${err}`);
  }
}

export function getKolAllocationsSheetUrl(): string | null {
  const sheetId = process.env.KOL_ALLOCATIONS_GOOGLE_SHEET_ID?.trim();
  if (!sheetId) return null;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}
