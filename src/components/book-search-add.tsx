"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";

type SearchResult = {
  key: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string;
};

function normalize(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function isLikelyIsbn(value: string) {
  const isbn = normalize(value);
  return isbn.length === 10 || isbn.length === 13;
}

export function BookSearchAdd({
  onBookAdded,
  defaultShelf,
}: {
  onBookAdded: (book: Book) => void;
  defaultShelf: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const hint = useMemo(
    () => "Search by ISBN or keyword. ISBN search will auto-add an item.",
    [],
  );

  function toBook(item: { title: string; author: string; coverUrl?: string; isbn?: string | null }): Book {
    return {
      id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: item.title,
      author: item.author || "Unknown",
      coverUrl:
        item.coverUrl ||
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80",
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      status: "queued",
      tags: item.isbn ? ["ISBN"] : [],
      shelf: defaultShelf,
      notes: [],
      highlights: [],
      attachments: [],
    };
  }

  async function runSearch() {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    try {
      if (isLikelyIsbn(value)) {
        const isbn = normalize(value);
        const res = await fetch("/api/books/auto-add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn }),
        });

        const data = await res.json();
        if (data.added) {
          onBookAdded(
            toBook({
              title: data.book?.title ?? "Untitled",
              author: data.book?.author ?? "Unknown",
              isbn,
            }),
          );
          setQuery("");
          setResults([]);
          toast.success("Added from ISBN");
        } else {
          toast.message(data.message ?? "Could not auto-add this ISBN.");
        }
      } else {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="brutal-card space-y-4">
      <div>
        <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">Search for Books</h3>
        <p className="mt-1 text-sm text-zinc-600">Find fast, add instantly.</p>
      </div>

      <div
        className="rounded-2xl border-[2px] p-3 shadow-[4px_4px_0_0_var(--border)]"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter ISBN or keyword"
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className="h-12 w-full rounded-xl border-[2px] pl-10 pr-3 text-base font-medium outline-none shadow-[2px_2px_0_0_var(--border)] placeholder:text-zinc-400"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
            />
          </div>

          <Button
            onClick={runSearch}
            disabled={loading}
            className="h-12 min-w-36 whitespace-nowrap bg-[#FF6584] leading-none"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      <p className="text-sm italic text-zinc-700">{hint}</p>

      {results.length > 0 && (
        <ul className="space-y-2 pt-1">
          {results.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-3 rounded-xl border-[2px] border-[#1E1E1E] bg-white p-3 shadow-[2px_2px_0_0_#1E1E1E] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  <span>{item.author}</span>
                  {item.isbn && <Badge className="bg-[#FFF8DF] text-[10px]">ISBN {item.isbn}</Badge>}
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  onBookAdded(
                    toBook({
                      title: item.title,
                      author: item.author,
                      coverUrl: item.coverUrl,
                      isbn: item.isbn,
                    }),
                  );
                  toast.success(`Added “${item.title}”`);
                }}
                className="bg-[#00C9A7]"
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
