import { NextResponse } from "next/server";
import { getBookRowsByUserId } from "@/lib/sheets";
import { requireUserId } from "@/lib/server-auth";
import type { BookRow } from "@/lib/mappers";
import { getCachedUserBooks, setCachedUserBooks } from "@/lib/books-cache";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`books:user-search:${userId}:${ip}`, 25, 60_000);
  if (!rl.ok) return NextResponse.json({ books: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") ?? 8), 20);

  if (q.length < 2) {
    return NextResponse.json({ books: [] });
  }

  try {
    let rows = getCachedUserBooks(userId);
    if (!rows) {
      rows = await getBookRowsByUserId<BookRow>(userId);
      setCachedUserBooks(userId, rows);
    }

    const books = rows
      .filter((row) => {
        const title = (row.title ?? "").toLowerCase();
        const author = (row.author ?? "").toLowerCase();
        const isbn = (row.isbn ?? "").toLowerCase();
        return title.includes(q) || author.includes(q) || isbn.includes(q);
      })
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author,
      }));

    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json({ error: "Search failed", detail: String(error) }, { status: 500 });
  }
}
