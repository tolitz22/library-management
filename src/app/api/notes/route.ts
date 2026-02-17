import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow, ensureSheet, findRows } from "@/lib/sheets";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  bookId: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookId = (searchParams.get("bookId") ?? "").trim();
  if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

  try {
    await ensureSheet("notes", ["id", "bookId", "userId", "content", "createdAt"]);
    const rows = await findRows<{
      id: string;
      bookId: string;
      userId: string;
      content: string;
      createdAt: string;
    }>("notes", (row) => row.userId === userId && row.bookId === bookId);

    const notes = rows
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt,
      }));

    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notes", detail: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`notes:${ip}`, 80, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    await ensureSheet("notes", ["id", "bookId", "userId", "content", "createdAt"]);

    const row = {
      id: nanoid(),
      bookId: parsed.data.bookId,
      userId,
      content: parsed.data.content,
      createdAt: new Date().toISOString(),
    };

    await appendRow("notes", row);
    return NextResponse.json({ note: row });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save note", detail: String(error) }, { status: 500 });
  }
}
