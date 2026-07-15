// 구글 스프레드시트를 key-value 저장소처럼 사용하기 위한 공용 모듈.
// A열=key, B열=value(JSON 문자열), C열=updatedAt

const { google } = require('googleapis');

const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'KV';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n'); // Netlify 환경변수는 개행이 \n 문자열로 들어오므로 복원
  if (!email || !key) throw new Error('MISSING_GOOGLE_CREDENTIALS');
  return new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/spreadsheets']);
}

async function getSheetsClient() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

async function ensureSheetExists(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = (meta.data.sheets || []).some(s => s.properties.title === SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:C1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['key', 'value', 'updatedAt']] },
    });
  }
}

async function findRow(sheets, spreadsheetId, key) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:C`,
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      return { rowIndex: i + 1, value: rows[i][1] !== undefined ? rows[i][1] : null };
    }
  }
  return null;
}

async function getKV(key) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('MISSING_GOOGLE_SHEET_ID');
  const sheets = await getSheetsClient();
  await ensureSheetExists(sheets, spreadsheetId);
  const found = await findRow(sheets, spreadsheetId, key);
  return found ? found.value : null;
}

async function setKV(key, value) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('MISSING_GOOGLE_SHEET_ID');
  const sheets = await getSheetsClient();
  await ensureSheetExists(sheets, spreadsheetId);
  const found = await findRow(sheets, spreadsheetId, key);
  const now = new Date().toISOString();
  if (found) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!B${found.rowIndex}:C${found.rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[value, now]] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[key, value, now]] },
    });
  }
}

async function deleteKV(key) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('MISSING_GOOGLE_SHEET_ID');
  const sheets = await getSheetsClient();
  await ensureSheetExists(sheets, spreadsheetId);
  const found = await findRow(sheets, spreadsheetId, key);
  if (found) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_NAME}!A${found.rowIndex}:C${found.rowIndex}`,
    });
  }
}

module.exports = { getKV, setKV, deleteKV };
