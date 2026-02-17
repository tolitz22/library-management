import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

function normalizeServiceKey(raw?: string) {
  if (!raw) return undefined;
  return raw
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
}

const SERVICE_KEY = normalizeServiceKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

type RowObj = Record<string, string>;

type BookIndex = {
  expiresAt: number;
  byUser: Map<string, number[]>;
  byId: Map<string, { row: number; userId: string }>;
};

type UserEmailIndex = {
  expiresAt: number;
  byEmail: Map<string, number>;
};

const INDEX_TTL_MS = 45_000;
const headerCache = new Map<string, { headers: string[]; expiresAt: number }>();
let booksIndexCache: BookIndex | null = null;
let usersEmailIndexCache: UserEmailIndex | null = null;

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

function toColLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
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

function clearBooksIndexes() {
  booksIndexCache = null;
}

function clearUsersIndexes() {
  usersEmailIndexCache = null;
}

async function getSheetHeaders(sheetName: string): Promise<string[]> {
  const hit = headerCache.get(sheetName);
  if (hit && Date.now() < hit.expiresAt) return hit.headers;

  const sheets = await getSheetsApi();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!1:1`,
    }),
  );

  const headers = (res.data.values?.[0] ?? []).map((h) => String(h));
  headerCache.set(sheetName, { headers, expiresAt: Date.now() + INDEX_TTL_MS });
  return headers;
}

function valuesToRow(headers: string[], row: string[] | undefined): RowObj {
  const out: RowObj = {};
  headers.forEach((key, i) => {
    out[key] = row?.[i] ?? "";
  });
  return out;
}

async function getColumnPairRows(
  sheetName: string,
  firstCol: string,
  secondCol: string,
): Promise<Array<{ rowNumber: number; first: string; second: string }>> {
  const sheets = await getSheetsApi();
  const headers = await getSheetHeaders(sheetName);
  const firstIdx = headers.indexOf(firstCol);
  const secondIdx = headers.indexOf(secondCol);
  if (firstIdx === -1 || secondIdx === -1) return [];

  const firstLetter = toColLetter(firstIdx);
  const secondLetter = toColLetter(secondIdx);

  const res = await withRetry(() =>
    sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: [`${q(sheetName)}!${firstLetter}2:${firstLetter}`, `${q(sheetName)}!${secondLetter}2:${secondLetter}`],
    }),
  );

  const firstVals = res.data.valueRanges?.[0]?.values ?? [];
  const secondVals = res.data.valueRanges?.[1]?.values ?? [];
  const len = Math.max(firstVals.length, secondVals.length);
  const rows: Array<{ rowNumber: number; first: string; second: string }> = [];

  for (let i = 0; i < len; i++) {
    const first = firstVals[i]?.[0] ?? "";
    const second = secondVals[i]?.[0] ?? "";
    if (!first && !second) continue;
    rows.push({ rowNumber: i + 2, first, second });
  }

  return rows;
}

async function getRowsByNumbers(sheetName: string, rowNumbers: number[]): Promise<RowObj[]> {
  if (!rowNumbers.length) return [];
  const sheets = await getSheetsApi();
  const headers = await getSheetHeaders(sheetName);
  if (!headers.length) return [];

  const lastCol = toColLetter(headers.length - 1);
  const sortedUnique = [...new Set(rowNumbers)].sort((a, b) => a - b);
  const out: RowObj[] = [];

  for (let i = 0; i < sortedUnique.length; i += 120) {
    const chunk = sortedUnique.slice(i, i + 120);
    const ranges = chunk.map((row) => `${q(sheetName)}!A${row}:${lastCol}${row}`);

    const res = await withRetry(() =>
      sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges,
      }),
    );

    const valueRanges = res.data.valueRanges ?? [];
    for (const vr of valueRanges) {
      const row = vr.values?.[0] ?? [];
      out.push(valuesToRow(headers, row));
    }
  }

  return out;
}

async function getRowByNumber(sheetName: string, rowNumber: number): Promise<RowObj | null> {
  const rows = await getRowsByNumbers(sheetName, [rowNumber]);
  return rows[0] ?? null;
}

async function ensureBooksIndex(forceRebuild = false): Promise<BookIndex> {
  if (!forceRebuild && booksIndexCache && Date.now() < booksIndexCache.expiresAt) {
    return booksIndexCache;
  }

  const pairs = await getColumnPairRows("books", "id", "userId");
  const byUser = new Map<string, number[]>();
  const byId = new Map<string, { row: number; userId: string }>();

  for (const p of pairs) {
    const id = p.first.trim();
    const userId = p.second.trim();
    if (!id || !userId) continue;

    const list = byUser.get(userId) ?? [];
    list.push(p.rowNumber);
    byUser.set(userId, list);
    byId.set(id, { row: p.rowNumber, userId });
  }

  const built = {
    byUser,
    byId,
    expiresAt: Date.now() + INDEX_TTL_MS,
  };

  booksIndexCache = built;
  return built;
}

async function ensureUsersEmailIndex(forceRebuild = false): Promise<UserEmailIndex> {
  if (!forceRebuild && usersEmailIndexCache && Date.now() < usersEmailIndexCache.expiresAt) {
    return usersEmailIndexCache;
  }

  const pairs = await getColumnPairRows("users", "email", "userId");
  const byEmail = new Map<string, number>();

  for (const p of pairs) {
    const email = p.first.trim().toLowerCase();
    if (!email) continue;
    byEmail.set(email, p.rowNumber);
  }

  const built = {
    byEmail,
    expiresAt: Date.now() + INDEX_TTL_MS,
  };

  usersEmailIndexCache = built;
  return built;
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

  const current = await getSheetHeaders(sheetName);
  if (current.length === 0) {
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${q(sheetName)}!1:1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] },
      }),
    );
    headerCache.set(sheetName, { headers: [...headers], expiresAt: Date.now() + INDEX_TTL_MS });
    return;
  }

  const missing = headers.filter((h) => !current.includes(h));
  if (missing.length > 0) {
    const merged = [...current, ...missing];
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${q(sheetName)}!1:1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [merged] },
      }),
    );
    headerCache.set(sheetName, { headers: merged, expiresAt: Date.now() + INDEX_TTL_MS });
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
  return rows.map((row) => valuesToRow(header.map((h) => String(h)), row) as T);
}

export async function appendRow(sheetName: string, row: Record<string, string>) {
  const sheets = await getSheetsApi();
  const header = await getSheetHeaders(sheetName);
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

  if (sheetName === "books") clearBooksIndexes();
  if (sheetName === "users") clearUsersIndexes();
}

export async function findRows<T extends Record<string, string>>(
  sheetName: string,
  predicate: (row: T) => boolean,
) {
  const rows = await getRows<T>(sheetName);
  return rows.filter(predicate);
}

export async function getBookRowsByUserId<T extends RowObj = RowObj>(userId: string): Promise<T[]> {
  const idx = await ensureBooksIndex();
  const rowNumbers = idx.byUser.get(userId) ?? [];
  return (await getRowsByNumbers("books", rowNumbers)) as T[];
}

export async function getBookRowByIdForUser<T extends RowObj = RowObj>(id: string, userId: string): Promise<T | null> {
  let idx = await ensureBooksIndex();
  let hit = idx.byId.get(id);

  if (!hit || hit.userId !== userId) {
    idx = await ensureBooksIndex(true);
    hit = idx.byId.get(id);
  }

  if (!hit || hit.userId !== userId) return null;

  const row = await getRowByNumber("books", hit.row);
  if (!row) return null;

  // stale index fallback: verify ownership/id and rebuild once
  if (row.id !== id || row.userId !== userId) {
    idx = await ensureBooksIndex(true);
    const fresh = idx.byId.get(id);
    if (!fresh || fresh.userId !== userId) return null;
    const refreshed = await getRowByNumber("books", fresh.row);
    if (!refreshed || refreshed.id !== id || refreshed.userId !== userId) return null;
    return refreshed as T;
  }

  return row as T;
}

export async function getUserRowByEmail<T extends RowObj = RowObj>(email: string): Promise<T | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  let idx = await ensureUsersEmailIndex();
  let rowNum = idx.byEmail.get(normalized);

  if (!rowNum) {
    idx = await ensureUsersEmailIndex(true);
    rowNum = idx.byEmail.get(normalized);
  }

  if (!rowNum) return null;

  const row = await getRowByNumber("users", rowNum);
  if (!row) return null;

  if ((row.email ?? "").toLowerCase() !== normalized) {
    idx = await ensureUsersEmailIndex(true);
    const freshRowNum = idx.byEmail.get(normalized);
    if (!freshRowNum) return null;
    const refreshed = await getRowByNumber("users", freshRowNum);
    if (!refreshed || (refreshed.email ?? "").toLowerCase() !== normalized) return null;
    return refreshed as T;
  }

  return row as T;
}

export async function updateBookRowByIdForUser(
  id: string,
  userId: string,
  patch: Record<string, string>,
): Promise<boolean> {
  const current = await getBookRowByIdForUser<RowObj>(id, userId);
  if (!current) return false;

  const idx = await ensureBooksIndex();
  const hit = idx.byId.get(id);
  if (!hit || hit.userId !== userId) return false;

  const headers = await getSheetHeaders("books");
  const rowValues = headers.map((key) => (patch[key] !== undefined ? patch[key] : (current[key] ?? "")));
  const lastCol = toColLetter(headers.length - 1);

  const sheets = await getSheetsApi();
  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${q("books")}!A${hit.row}:${lastCol}${hit.row}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowValues] },
    }),
  );

  clearBooksIndexes();
  return true;
}

export async function deleteBookRowByIdForUser(id: string, userId: string): Promise<boolean> {
  const idx = await ensureBooksIndex();
  const hit = idx.byId.get(id);
  if (!hit || hit.userId !== userId) {
    const rebuilt = await ensureBooksIndex(true);
    const fresh = rebuilt.byId.get(id);
    if (!fresh || fresh.userId !== userId) return false;

    return deleteBookRowByIdForUser(id, userId);
  }

  const sheets = await getSheetsApi();

  const meta = await withRetry(() =>
    sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      ranges: [q("books")],
      includeGridData: false,
    }),
  );

  const booksSheet = (meta.data.sheets ?? []).find((s) => s.properties?.title === "books");
  const sheetId = booksSheet?.properties?.sheetId;
  if (sheetId === undefined) return false;

  await withRetry(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: hit.row - 1,
                endIndex: hit.row,
              },
            },
          },
        ],
      },
    }),
  );

  clearBooksIndexes();
  return true;
}

export async function updateRowById(
  sheetName: string,
  idField: string,
  id: string,
  patch: Record<string, string>,
) {
  const sheets = await getSheetsApi();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A:Z`,
    }),
  );

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

  if (sheetName === "books") clearBooksIndexes();
  if (sheetName === "users") clearUsersIndexes();

  return true;
}

export async function deleteRowsWhere<T extends Record<string, string>>(
  sheetName: string,
  predicate: (row: T) => boolean,
) {
  const sheets = await getSheetsApi();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${q(sheetName)}!A:Z`,
    }),
  );

  const values = res.data.values ?? [];
  if (values.length === 0) return 0;

  const [header, ...rows] = values;
  const keptRows: string[][] = [];
  let deleted = 0;

  for (const row of rows) {
    const obj = valuesToRow(header.map((h) => String(h)), row);

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

  if (sheetName === "books") clearBooksIndexes();
  if (sheetName === "users") clearUsersIndexes();

  return deleted;
}
