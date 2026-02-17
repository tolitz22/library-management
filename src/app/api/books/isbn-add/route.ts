import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow } from "@/lib/sheets";
import { rowToBook, type BookRow } from "@/lib/mappers";
import { clearCachedUserBooks } from "@/lib/books-cache";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  isbn: z.string().min(10),
  shelf: z.string().min(1),
});

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`books:isbn:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const isbn = normalizeIsbn(parsed.data.isbn);
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json({ error: "ISBN not found" }, { status: 404 });
    }

    const data = (await res.json()) as { title?: string; covers?: number[] };
    const imageUrl = data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
      : "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80";

    const now = new Date().toISOString();
    const row: BookRow = {
      id: nanoid(),
      userId,
      title: data.title ?? `Book ${isbn}`,
      author: "Unknown",
      isbn,
      imageUrl,
      shelf: parsed.data.shelf,
      tags: "ISBN",
      currentPage: "0",
      totalPages: "0",
      progress: "0",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };

    await appendRow("books", row);
    clearCachedUserBooks(userId);
    return NextResponse.json({ book: rowToBook(row) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add ISBN book", detail: String(error) }, { status: 500 });
  }
}
