"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NotesEditor } from "@/components/notes-editor";
import { HighlightsEditor } from "@/components/highlights-editor";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

function calcProgress(currentPage: number, totalPages: number, fallback: number) {
  if (!totalPages || totalPages <= 0) return fallback;
  return Math.max(0, Math.min(100, Math.round((currentPage / totalPages) * 100)));
}

function toDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function fromDateInputValue(value: string) {
  return `${value}T00:00:00.000Z`;
}

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowedDate, setBorrowedDate] = useState(toDateInputValue());
  const [draftByBook, setDraftByBook] = useState<Record<string, { currentPage: number; totalPages: number }>>({});
  const id = params?.id ?? "";

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/books", { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { books: Book[] };
      setAllBooks(data.books ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const book = useMemo(() => allBooks.find((b) => b.id === id), [allBooks, id]);

  useEffect(() => {
    setBorrowerName(book?.borrowedBy ?? "");
    setBorrowedDate(toDateInputValue(book?.borrowedAt));
  }, [book?.id, book?.borrowedBy, book?.borrowedAt]);

  if (loading) {
    return (
      <main className="brutal-card space-y-2">
        <h1 className="text-xl font-bold">Loading...</h1>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="brutal-card space-y-3">
        <h1 className="text-xl font-bold">Book not found</h1>
        <Link href="/library" className="brutal-btn w-fit">
          Back to Library
        </Link>
      </main>
    );
  }

  const bookId = book.id;
  const draft = draftByBook[bookId];
  const currentPage = draft?.currentPage ?? (book.currentPage ?? 0);
  const totalPages = draft?.totalPages ?? (book.totalPages ?? 0);
  const progress = calcProgress(currentPage, totalPages, book.progress);
  const isBorrowed = Boolean((book.borrowedBy ?? "").trim());

  function setCurrentDraft(nextCurrent: number) {
    setDraftByBook((prev) => ({
      ...prev,
      [bookId]: {
        currentPage: Math.max(0, nextCurrent || 0),
        totalPages,
      },
    }));
  }

  function setTotalDraft(nextTotal: number) {
    setDraftByBook((prev) => ({
      ...prev,
      [bookId]: {
        currentPage,
        totalPages: Math.max(0, nextTotal || 0),
      },
    }));
  }

  async function savePageProgress() {
    const safeCurrent = Math.max(0, currentPage || 0);
    const safeTotal = Math.max(0, totalPages || 0);

    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPage: safeCurrent, totalPages: safeTotal }),
    });

    if (!res.ok) {
      toast.error("Failed to update progress");
      return;
    }
    const data = (await res.json()) as { book: Book };

    setAllBooks((prev) => prev.map((b) => (b.id === bookId ? data.book : b)));
    setDraftByBook((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    toast.success("Progress updated");
  }

  async function updateBorrower(nextBorrower: string, nextDate: string) {
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowedBy: nextBorrower, borrowedAt: fromDateInputValue(nextDate) }),
    });

    if (!res.ok) {
      toast.error("Failed to update borrowing status");
      return;
    }

    const data = (await res.json()) as { book: Book };
    setAllBooks((prev) => prev.map((b) => (b.id === bookId ? data.book : b)));
    setBorrowerName(data.book.borrowedBy ?? "");
    setBorrowedDate(toDateInputValue(data.book.borrowedAt));
    toast.success(nextBorrower ? "Borrow info updated" : "Marked as returned");
  }

  async function confirmDeleteBook() {
    setDeleting(true);
    const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      toast.error("Failed to delete book");
      return;
    }

    toast.success("Book deleted");
    window.dispatchEvent(new Event("books-updated"));
    setConfirmOpen(false);
    router.push("/library");
    router.refresh();
  }

  return (
    <main className="min-w-0 space-y-4 overflow-hidden">
      <section className="brutal-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-zinc-600">{book.author}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{book.shelf}</Badge>
            {isBorrowed ? <Badge style={{ background: "#fde68a", color: "#1f2937" }}>Borrowed</Badge> : null}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Reading progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Current page</label>
            <input
              type="number"
              min={0}
              value={currentPage}
              onChange={(e) => setCurrentDraft(Number(e.target.value))}
              className="brutal-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Total pages</label>
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalDraft(Number(e.target.value))}
              className="brutal-input"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
            <Button onClick={savePageProgress} className="h-11 w-full sm:w-auto">
              <Clock3 className="h-4 w-4" />
              Update Progress
            </Button>
            <Button onClick={() => setConfirmOpen(true)} className="h-11 w-full sm:w-auto" style={{ background: "#dc2626", color: "#fff" }}>
              <Trash2 className="h-4 w-4" />
              Delete Book
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border-[2px] p-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Borrowed by</label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="Friend name"
              className="brutal-input"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Date borrowed</label>
            <input
              type="date"
              value={borrowedDate}
              onChange={(e) => setBorrowedDate(e.target.value)}
              className="brutal-input"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              className="h-11 w-full whitespace-nowrap"
              onClick={() => updateBorrower(borrowerName.trim(), borrowedDate)}
              disabled={!borrowerName.trim()}
            >
              Save borrow info
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full whitespace-nowrap"
              onClick={() => updateBorrower("", borrowedDate)}
              disabled={!isBorrowed}
            >
              Mark returned
            </Button>
          </div>
        </div>

        {book.borrowedAt ? <p className="text-xs text-zinc-500">Borrowed on {new Date(book.borrowedAt).toLocaleDateString()}</p> : null}

        <div className="flex flex-wrap gap-2">
          {book.tags.map((tag) => (
            <Badge key={tag} className="bg-white">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <NotesEditor bookId={book.id} />
        <HighlightsEditor bookId={book.id} initial={book.highlights} />
      </section>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete book?">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            This will permanently delete <span className="font-semibold">{book.title}</span> and all related notes/highlights.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteBook} disabled={deleting} style={{ background: "#dc2626", color: "#fff" }}>
              {deleting ? "Deleting..." : "Yes, delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
