"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { books as mockBooks } from "@/lib/mock-data";
import type { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NotesEditor } from "@/components/notes-editor";
import { UploadDropzone } from "@/components/upload-dropzone";
import { HighlightsEditor } from "@/components/highlights-editor";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "library_books_v1";

function calcProgress(currentPage: number, totalPages: number, fallback: number) {
  if (!totalPages || totalPages <= 0) return fallback;
  return Math.max(0, Math.min(100, Math.round((currentPage / totalPages) * 100)));
}

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const [allBooks, setAllBooks] = useState<Book[]>(mockBooks);
  const id = params?.id ?? "";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Book[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllBooks(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const book = useMemo(() => allBooks.find((b) => b.id === id), [allBooks, id]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!book) return;
    setCurrentPage(book.currentPage ?? 0);
    setTotalPages(book.totalPages ?? 0);
  }, [book?.id]);

  if (!book) {
    return (
      <main className="brutal-card space-y-3">
        <h1 className="text-xl font-bold">Book not found</h1>
        <p className="text-zinc-600">This can happen after refresh if the book was only in temporary state before.</p>
        <Link href="/library" className="brutal-btn w-fit">
          Back to Library
        </Link>
      </main>
    );
  }

  const progress = calcProgress(currentPage, totalPages, book.progress);

  function savePageProgress() {
    const safeCurrent = Math.max(0, currentPage || 0);
    const safeTotal = Math.max(0, totalPages || 0);
    const nextProgress = calcProgress(safeCurrent, safeTotal, book.progress);

    const updated = allBooks.map((b) =>
      b.id === book.id
        ? {
            ...b,
            currentPage: safeCurrent,
            totalPages: safeTotal,
            progress: nextProgress,
          }
        : b,
    );

    setAllBooks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
          <Button onClick={savePageProgress} className="h-11">Update Progress</Button>
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
        <NotesEditor />
        <HighlightsEditor initial={book.highlights} />
      </section>

      <UploadDropzone />
    </main>
  );
}
