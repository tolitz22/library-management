import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow, findRows } from "@/lib/sheets";
import { bookToRow, rowToBook, type BookRow } from "@/lib/mappers";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";
import { clearCachedUserBooks, getCachedUserBooks, setCachedUserBooks } from "@/lib/books-cache";

const createSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  shelf: z.string().min(1),
  tags: z.array(z.string()).default([]),
  summary: z.string().optional(),
  currentPage: z.number().default(0),
  totalPages: z.number().default(0),
  isbn: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shelf = (searchParams.get("shelf") ?? "All shelves").trim();
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const limit = limitParam ? Math.max(1, Math.min(Number(limitParam), 100)) : null;
  const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;

  try {
    let rows = getCachedUserBooks(userId);
    if (!rows) {
      rows = await findRows<BookRow>("books", (row) => row.userId === userId);
      setCachedUserBooks(userId, rows);
    }

    const filtered = shelf === "All shelves" ? rows : rows.filter((row) => row.shelf === shelf);
    const total = filtered.length;
    const paged = limit ? filtered.slice(offset, offset + limit) : filtered;

    return NextResponse.json({
      books: paged.map(rowToBook),
      total,
      limit: limit ?? total,
      offset,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch books", detail: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`books:create:${ip}`, 40, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const progress = parsed.data.totalPages
      ? Math.max(0, Math.min(100, Math.round((parsed.data.currentPage / parsed.data.totalPages) * 100)))
      : 0;

    const now = new Date().toISOString();
    const row = {
      id: nanoid(),
      userId,
      title: parsed.data.title,
      author: parsed.data.author,
      isbn: parsed.data.isbn ?? "",
      imageUrl: parsed.data.imageUrl ?? "",
      shelf: parsed.data.shelf,
      tags: parsed.data.tags.join(", "),
      currentPage: String(parsed.data.currentPage),
      totalPages: String(parsed.data.totalPages),
      progress: String(progress),
      status: progress >= 100 ? "completed" : progress > 0 ? "reading" : "queued",
      createdAt: now,
      updatedAt: now,
    };

    await appendRow("books", row);
    clearCachedUserBooks(userId);
    return NextResponse.json({ book: rowToBook(row as BookRow) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create book", detail: String(error) }, { status: 500 });
  }
}
