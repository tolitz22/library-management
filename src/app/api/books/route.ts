import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow, findRows } from "@/lib/sheets";
import { bookToRow, rowToBook, type BookRow } from "@/lib/mappers";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";

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

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await findRows<BookRow>("books", (row) => row.userId === userId);
    return NextResponse.json({ books: rows.map(rowToBook) });
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
    return NextResponse.json({ book: rowToBook(row as BookRow) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create book", detail: String(error) }, { status: 500 });
  }
}
