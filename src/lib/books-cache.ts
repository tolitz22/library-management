import type { BookRow } from "@/lib/mappers";

type Entry = {
  rows: BookRow[];
  expiresAt: number;
};

const TTL_MS = 30_000;
const cache = new Map<string, Entry>();

export function getCachedUserBooks(userId: string): BookRow[] | null {
  const hit = cache.get(userId);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return hit.rows;
}

export function setCachedUserBooks(userId: string, rows: BookRow[]) {
  cache.set(userId, { rows, expiresAt: Date.now() + TTL_MS });
}

export function clearCachedUserBooks(userId: string) {
  cache.delete(userId);
}
