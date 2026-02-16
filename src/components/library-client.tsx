"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookCard } from "@/components/book-card";
import { BookForm } from "@/components/book-form";
import { BookSearchAdd } from "@/components/book-search-add";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";

const STORAGE_KEY = "library_books_v1";

type ViewMode = "grid" | "list";

export function LibraryClient({ initialBooks }: { initialBooks: Book[] }) {
  const [bookList, setBookList] = useState<Book[]>(initialBooks);
  const [hydrated, setHydrated] = useState(false);
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedShelf, setSelectedShelf] = useState("All shelves");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Book[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBookList(parsed);
        }
      }
    } catch {
      // ignore parse/storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookList));
  }, [bookList, hydrated]);

  const shelfOptions = useMemo(() => {
    const set = new Set(bookList.map((b) => b.shelf).filter(Boolean));
    return Array.from(set);
  }, [bookList]);

  const defaultShelf = shelfOptions[0] ?? "Desk Stack";

  const visibleBooks = useMemo(() => {
    if (selectedShelf === "All shelves") return bookList;
    return bookList.filter((b) => b.shelf === selectedShelf);
  }, [bookList, selectedShelf]);

  function addBook(book: Book) {
    setBookList((prev) => [book, ...prev]);
  }

  function getProgress(book: Book) {
    if (book.totalPages && book.totalPages > 0) {
      return Math.max(0, Math.min(100, Math.round(((book.currentPage ?? 0) / book.totalPages) * 100)));
    }
    return book.progress;
  }

  return (
    <main className="space-y-4">
      <BookSearchAdd onBookAdded={addBook} defaultShelf={defaultShelf} />

      <section className="brutal-card flex flex-wrap items-center gap-3">
        <select
          className="brutal-input max-w-52"
          value={selectedShelf}
          onChange={(e) => setSelectedShelf(e.target.value)}
        >
          <option>All shelves</option>
          {shelfOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <Button onClick={() => setOpenQuickAdd(true)}> 
          Quick Add / Edit
        </Button>

        <div
          className="ml-auto flex items-center gap-2 rounded-xl border-[2px] p-1 shadow-[2px_2px_0_0_var(--border)]"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <button
            className="rounded-lg border-[2px] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_var(--border)]"
            style={{
              borderColor: "var(--border)",
              background: viewMode === "grid" ? "var(--primary)" : "var(--surface)",
              color: viewMode === "grid" ? "var(--primary-contrast)" : "var(--fg)",
            }}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className="rounded-lg border-[2px] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_var(--border)]"
            style={{
              borderColor: "var(--border)",
              background: viewMode === "list" ? "var(--primary)" : "var(--surface)",
              color: viewMode === "list" ? "var(--primary-contrast)" : "var(--fg)",
            }}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </section>

      <Modal open={openQuickAdd} title="Quick Add / Edit Book" onClose={() => setOpenQuickAdd(false)}>
        <BookForm
          shelves={shelfOptions}
          onBookSaved={(book) => {
            addBook(book);
            setOpenQuickAdd(false);
          }}
        />
      </Modal>

      {viewMode === "grid" ? (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </section>
      ) : (
        <section className="space-y-3">
          {visibleBooks.map((book) => (
            <article key={book.id} className="brutal-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/library/${book.id}`} className="text-lg font-bold hover:underline">
                    {book.title}
                  </Link>
                  <p className="text-sm" style={{ color: "color-mix(in srgb, var(--fg) 75%, transparent)" }}>
                    {book.author}
                  </p>
                </div>
                <Badge className="bg-white">{book.shelf}</Badge>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress</span>
                  <span>{getProgress(book)}%</span>
                </div>
                <Progress value={getProgress(book)} />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
