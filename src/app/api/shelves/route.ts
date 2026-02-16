import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { appendRow, ensureSheet, findRows } from "@/lib/sheets";
import { requireUserId } from "@/lib/server-auth";
import { rateLimit } from "@/lib/rate-limit";

type ShelfRow = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};

const createSchema = z.object({
  name: z.string().min(1).max(60),
});

export async function GET() {
  await ensureSheet("shelves", ["id", "userId", "name", "createdAt"]);
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await findRows<ShelfRow>("shelves", (row) => row.userId === userId);
    const shelves = rows.map((r) => r.name).filter(Boolean);
    return NextResponse.json({ shelves });
  } catch {
    return NextResponse.json({ shelves: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSheet("shelves", ["id", "userId", "name", "createdAt"]);
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const rl = rateLimit(`shelves:create:${ip}`, 40, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const name = parsed.data.name.trim();
    const existing = await findRows<ShelfRow>(
      "shelves",
      (r) => r.userId === userId && r.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing.length > 0) return NextResponse.json({ error: "Shelf already exists" }, { status: 409 });

    const row: ShelfRow = {
      id: nanoid(),
      userId,
      name,
      createdAt: new Date().toISOString(),
    };

    await appendRow("shelves", row);
    return NextResponse.json({ shelf: name });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create shelf",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
