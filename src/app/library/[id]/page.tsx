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

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!book) return;
    setCurrentPage(book.currentPage ?? 0);
    setTotalPages(book.totalPages ?? 0);
  }, [book?.id]);

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
  const progress = calcProgress(currentPage, totalPages, book.progress);

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
    setCurrentPage(data.book.currentPage ?? safeCurrent);
    setTotalPages(data.book.totalPages ?? safeTotal);
    toast.success("Progress updated");
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
    <main className="space-y-4">
      <section className="brutal-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-zinc-600">{book.author}</p>
          </div>
          <Badge>{book.shelf}</Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Reading progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Current page</label>
            <input
              type="number"
              min={0}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="brutal-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Total pages</label>
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              className="brutal-input"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={savePageProgress} className="h-11">
              <Clock3 className="h-4 w-4" />
              Update Progress
            </Button>
            <Button onClick={() => setConfirmOpen(true)} className="h-11" style={{ background: "#dc2626", color: "#fff" }}>
              <Trash2 className="h-4 w-4" />
              Delete Book
            </Button>
          </div>
        </div>

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
