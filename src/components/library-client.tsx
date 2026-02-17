"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookForm } from "@/components/book-form";
import { BookSearchAdd } from "@/components/book-search-add";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";

type ViewMode = "grid" | "list";

const PAGE_SIZE_KEY = "library_page_size_v1";
const RECENT_OPENED_KEY = "library_recent_opened_v1";
const ALLOWED_PAGE_SIZES = [10, 20, 30, 40, 50] as const;

export function LibraryClient({ initialBooks, initialShelf = "All shelves" }: { initialBooks: Book[]; initialShelf?: string }) {
  const [bookList, setBookList] = useState<Book[]>(initialBooks);
  const [shelves, setShelves] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedShelf, setSelectedShelf] = useState(initialShelf || "All shelves");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const offset = (page - 1) * pageSize;

  useEffect(() => {
    const raw = localStorage.getItem(PAGE_SIZE_KEY);
    const parsed = Number(raw);
    if (ALLOWED_PAGE_SIZES.includes(parsed as (typeof ALLOWED_PAGE_SIZES)[number])) {
      setPageSize(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_KEY, String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedShelf, pageSize]);

  useEffect(() => {
    async function loadShelves() {
      try {
        const shelvesRes = await fetch("/api/shelves", { cache: "no-store" });
        if (shelvesRes.ok) {
          const data = (await shelvesRes.json()) as { shelves: string[] };
          setShelves(data.shelves ?? []);
        }
      } catch {
        // ignore
      }
    }

    loadShelves();
  }, []);

  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", String(pageSize));
        qs.set("offset", String(offset));
        if (selectedShelf !== "All shelves") qs.set("shelf", selectedShelf);

        const res = await fetch(`/api/books?${qs.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error("Failed to load books");
        }

        const data = (await res.json()) as { books: Book[]; total?: number };

        let recentMap: Record<string, number> = {};
        try {
          recentMap = JSON.parse(localStorage.getItem(RECENT_OPENED_KEY) ?? "{}") as Record<string, number>;
        } catch {
          recentMap = {};
        }

        const sorted = [...(data.books ?? [])].sort((a, b) => {
          const aRecent = recentMap[a.id] ?? 0;
          const bRecent = recentMap[b.id] ?? 0;
          if (aRecent !== bRecent) return bRecent - aRecent;
          const aCreated = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bCreated = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bCreated - aCreated;
        });

        setBookList(sorted);
        setTotal(data.total ?? sorted.length);
      } catch {
        toast.error("Unable to load books");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [pageSize, offset, selectedShelf]);

  const shelfOptions = useMemo(() => {
    const set = new Set<string>([...shelves]);
    for (const book of bookList) {
      if (book.shelf) set.add(book.shelf);
    }
    return Array.from(set);
  }, [bookList, shelves]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function addBook(book: Book) {
    setBookList((prev) => [book, ...prev]);
    setTotal((t) => t + 1);
    window.dispatchEvent(new Event("books-updated"));
  }

  async function moveBookToShelf(bookId: string, shelf: string) {
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shelf }),
    });

    if (!res.ok) {
      toast.error("Failed to move book");
      return;
    }

    const data = (await res.json()) as { book: Book };
    setBookList((prev) => prev.map((b) => (b.id === data.book.id ? data.book : b)));
    window.dispatchEvent(new Event("books-updated"));
    toast.success(`Moved to ${shelf}`);
  }

  function getProgress(book: Book) {
    if (book.totalPages && book.totalPages > 0) {
      return Math.max(0, Math.min(100, Math.round(((book.currentPage ?? 0) / book.totalPages) * 100)));
    }
    return book.progress;
  }

  function markBookOpened(bookId: string) {
    let recentMap: Record<string, number> = {};
    try {
      recentMap = JSON.parse(localStorage.getItem(RECENT_OPENED_KEY) ?? "{}") as Record<string, number>;
    } catch {
      recentMap = {};
    }

    recentMap[bookId] = Date.now();
    localStorage.setItem(RECENT_OPENED_KEY, JSON.stringify(recentMap));
  }

  return (
    <main className="space-y-4">
      <BookSearchAdd onBookAdded={addBook} shelves={shelfOptions} />

      <section className="brutal-card flex flex-wrap items-center gap-3">
        <select className="brutal-input max-w-52" value={selectedShelf} onChange={(e) => setSelectedShelf(e.target.value)}>
          <option>All shelves</option>
          {shelfOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select className="brutal-input max-w-40" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          {ALLOWED_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>

        <Button onClick={() => setOpenQuickAdd(true)}>
          <PlusCircle className="h-4 w-4" />
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

      {loading ? (
        <section className="brutal-card">
          <p className="text-sm">Loading books...</p>
        </section>
      ) : viewMode === "grid" ? (
        <section className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
          {bookList.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              shelves={shelfOptions}
              onMoveShelf={moveBookToShelf}
              onOpenBook={markBookOpened}
            />
          ))}
        </section>
      ) : (
        <section className="space-y-3">
          {bookList.map((book) => (
            <article key={book.id} className="brutal-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/library/${book.id}`}
                    onClick={() => markBookOpened(book.id)}
                    className="text-lg font-bold hover:underline"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm" style={{ color: "color-mix(in srgb, var(--fg) 75%, transparent)" }}>
                    {book.author}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white">{book.shelf}</Badge>
                  {book.borrowedBy ? <Badge style={{ background: "#fde68a", color: "#1f2937" }}>Borrowed: {book.borrowedBy}</Badge> : null}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress</span>
                  <span>{getProgress(book)}%</span>
                </div>
                <Progress value={getProgress(book)} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <select
                  className="brutal-input max-w-56"
                  value={book.shelf}
                  onChange={(e) => moveBookToShelf(book.id, e.target.value)}
                >
                  {shelfOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && (
        <section className="brutal-card flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            Page {page} of {totalPages} • {total} books
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
