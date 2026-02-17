import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

function assertEnv() {
  if (!SHEET_ID || !SERVICE_EMAIL || !SERVICE_KEY) {
    throw new Error("Missing Google Sheets env vars");
  }
}

async function getSheetsApi() {
  assertEnv();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: SERVICE_EMAIL,
      private_key: SERVICE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function q(name: string) {
  return `'${name.replace(/'/g, "''")}'`;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 250): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      const retryable = msg.includes("429") || msg.includes("rateLimit") || msg.includes("503") || msg.includes("500");

      if (!retryable || attempt === retries) break;

      const jitter = Math.floor(Math.random() * 120);
      const wait = baseDelayMs * Math.pow(2, attempt) + jitter;
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  throw lastError;
}

export async function ensureSheet(sheetName: string, headers: string[]) {
  const sheets = await getSheetsApi();

  const meta = await withRetry(() => sheets.spreadsheets.get({ spreadsheetId: SHEET_ID }));
  const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === sheetName);

  if (!exists) {
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      }),
    );
  }

  const headerRes = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!1:1`,
    }),
  );
  const current = headerRes.data.values?.[0] ?? [];

  if (current.length === 0) {
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${q(sheetName)}!1:1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] },
      }),
    );
  }
}

export async function getRows<T extends Record<string, string>>(sheetName: string): Promise<T[]> {
  const sheets = await getSheetsApi();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A:Z`,
    }),
  );

  const values = res.data.values ?? [];
  if (values.length === 0) return [];

  const [header, ...rows] = values;
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });
    return obj as T;
  });
}

export async function appendRow(sheetName: string, row: Record<string, string>) {
  const sheets = await getSheetsApi();
  const existing = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!1:1`,
    }),
  );

  const header = existing.data.values?.[0] ?? [];
  if (!header.length) throw new Error(`Sheet ${sheetName} is missing header row`);

  const values = header.map((key) => row[key] ?? "");

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    }),
  );
}

export async function findRows<T extends Record<string, string>>(
  sheetName: string,
  predicate: (row: T) => boolean,
) {
  const rows = await getRows<T>(sheetName);
  return rows.filter(predicate);
}

export async function updateRowById(
  sheetName: string,
  idField: string,
  id: string,
  patch: Record<string, string>,
) {
  const sheets = await getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${q(sheetName)}!A:Z`,
  });

  const values = res.data.values ?? [];
  if (!values.length) throw new Error(`Sheet ${sheetName} is empty`);

  const header = values[0];
  const idIndex = header.indexOf(idField);
  if (idIndex === -1) throw new Error(`id field ${idField} not found in ${sheetName}`);

  const rowIndex = values.findIndex((row, idx) => idx > 0 && row[idIndex] === id);
  if (rowIndex === -1) return false;

  const current = values[rowIndex] ?? [];
  const next = [...current];
  header.forEach((key, idx) => {
    if (patch[key] !== undefined) {
      next[idx] = patch[key];
    }
  });

  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A${rowIndex + 1}:Z${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [next] },
    }),
  );

  return true;
}

export async function deleteRowsWhere<T extends Record<string, string>>(
  sheetName: string,
  predicate: (row: T) => boolean,
) {
  const sheets = await getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${q(sheetName)}!A:Z`,
  });

  const values = res.data.values ?? [];
  if (values.length === 0) return 0;

  const [header, ...rows] = values;
  const keptRows: string[][] = [];
  let deleted = 0;

  for (const row of rows) {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });

    if (predicate(obj as T)) {
      deleted += 1;
    } else {
      keptRows.push(row);
    }
  }

  await withRetry(() =>
    sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A:Z`,
    }),
  );

  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A1:Z1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [header, ...keptRows],
      },
    }),
  );

  return deleted;
}
