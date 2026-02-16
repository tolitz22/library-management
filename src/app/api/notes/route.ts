import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow } from "@/lib/sheets";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  bookId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`notes:${ip}`, 80, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const row = {
    id: nanoid(),
    bookId: parsed.data.bookId,
    userId,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
  };

  await appendRow("notes", row);
  return NextResponse.json({ note: row });
}
