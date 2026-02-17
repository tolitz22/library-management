import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteRowsWhere, findRows, updateRowById } from "@/lib/sheets";
import { requireUserId } from "@/lib/server-auth";
import { rowToBook, type BookRow } from "@/lib/mappers";
import { clearCachedUserBooks } from "@/lib/books-cache";

const patchSchema = z.object({
  shelf: z.string().optional(),
  tags: z.array(z.string()).optional(),
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
  progress: z.number().optional(),
  status: z.enum(["queued", "reading", "completed"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const rows = await findRows<BookRow>("books", (row) => row.id === id && row.userId === userId);
  const current = rows[0];
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextCurrentPage = parsed.data.currentPage ?? Number(current.currentPage || 0);
  const nextTotalPages = parsed.data.totalPages ?? Number(current.totalPages || 0);
  const nextProgress =
    parsed.data.progress ??
    (nextTotalPages > 0 ? Math.max(0, Math.min(100, Math.round((nextCurrentPage / nextTotalPages) * 100))) : 0);

  const patch: Record<string, string> = {
    updatedAt: new Date().toISOString(),
    progress: String(nextProgress),
    status:
      parsed.data.status ?? (nextProgress >= 100 ? "completed" : nextProgress > 0 ? "reading" : "queued"),
  };

  if (parsed.data.shelf !== undefined) patch.shelf = parsed.data.shelf;
  if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags.join(", ");
  if (parsed.data.currentPage !== undefined) patch.currentPage = String(parsed.data.currentPage);
  if (parsed.data.totalPages !== undefined) patch.totalPages = String(parsed.data.totalPages);

  await updateRowById("books", "id", id, patch);
  clearCachedUserBooks(userId);

  const updatedRows = await findRows<BookRow>("books", (row) => row.id === id && row.userId === userId);
  return NextResponse.json({ book: rowToBook(updatedRows[0] ?? current) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await findRows<BookRow>("books", (row) => row.id === id && row.userId === userId);
  const current = rows[0];
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deletedBooks = await deleteRowsWhere<BookRow>("books", (row) => row.id === id && row.userId === userId);
  clearCachedUserBooks(userId);

  type NoteRow = { id: string; bookId: string; userId: string; content: string; createdAt: string };
  type HighlightRow = { id: string; bookId: string; userId: string; content: string; createdAt: string };

  try {
    await deleteRowsWhere<NoteRow>("notes", (row) => row.bookId === id && row.userId === userId);
  } catch {
    // ignore if notes sheet is missing/misconfigured
  }

  try {
    await deleteRowsWhere<HighlightRow>("highlights", (row) => row.bookId === id && row.userId === userId);
  } catch {
    // ignore if highlights sheet is missing/misconfigured
  }

  return NextResponse.json({ ok: true, deletedBooks });
}
