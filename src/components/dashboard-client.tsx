"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookCard } from "@/components/book-card";
import type { Book } from "@/lib/types";

export function DashboardClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/books", { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { books: Book[] };
      setBooks(data.books ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const reading = useMemo(() => books.filter((b) => b.status === "reading"), [books]);
  const completed = useMemo(() => books.filter((b) => b.status === "completed").length, [books]);

  if (loading) {
    return (
      <main className="space-y-4">
        <section className="brutal-card">
          <p className="text-sm">Loading dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <article
          className="brutal-card"
          style={{ background: "color-mix(in srgb, var(--primary) 16%, var(--surface))", color: "var(--fg)" }}
        >
          <p className="text-sm font-medium">Currently reading</p>
          <p className="text-3xl font-bold">{reading.length}</p>
        </article>

        <article
          className="brutal-card"
          style={{ background: "color-mix(in srgb, var(--accent) 18%, var(--surface))", color: "var(--fg)" }}
        >
          <p className="text-sm font-medium">Books tracked</p>
          <p className="text-3xl font-bold">{books.length}</p>
        </article>

        <article
          className="brutal-card"
          style={{ background: "color-mix(in srgb, var(--highlight) 26%, var(--surface))", color: "var(--fg)" }}
        >
          <p className="text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold">{completed}</p>
        </article>
      </section>

      <section className="brutal-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Keep reading momentum</h3>
          <Link href="/library" className="brutal-btn inline-flex items-center gap-2">
            <span
              className="inline-block h-4 w-4"
              style={{
                backgroundImage: "url('/templates/demon-slayer/icons/Books.png')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              aria-hidden="true"
            />
            Open library
          </Link>
        </div>

        {reading.length === 0 ? (
          <p className="text-sm text-zinc-600">No books in reading status yet. Start one from your library.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reading.slice(0, 6).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
