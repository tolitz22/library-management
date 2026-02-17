"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/types";

export function CollectionsClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<string[]>([]);
  const [newShelf, setNewShelf] = useState("");
  const [loading, setLoading] = useState(true);

  async function safeJson<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async function loadAll() {
    try {
      const [booksRes, shelvesRes] = await Promise.all([
        fetch("/api/books", { cache: "no-store" }),
        fetch("/api/shelves", { cache: "no-store" }),
      ]);

      if (booksRes.ok) {
        const booksData = await safeJson<{ books: Book[] }>(booksRes);
        setBooks(booksData?.books ?? []);
      }

      if (shelvesRes.ok) {
        const shelvesData = await safeJson<{ shelves: string[] }>(shelvesRes);
        setShelves(shelvesData?.shelves ?? []);
      }
    } catch {
      toast.error("Unable to load collections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const shelfStats = useMemo(() => {
    const all = new Set<string>([
      ...shelves,
      ...books
        .map((b) => b.shelf)
        .filter((shelf): shelf is string => Boolean(shelf && shelf.trim())),
    ]);

    return Array.from(all).map((name) => ({
      name,
      count: books.filter((b) => b.shelf === name).length,
    }));
  }, [books, shelves]);

  async function createShelf() {
    const name = newShelf.trim();
    if (!name) return;

    const res = await fetch("/api/shelves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await safeJson<{ shelf?: string; error?: string; detail?: string }>(res);
    if (!res.ok || !data?.shelf) {
      toast.error(data?.error ?? "Failed to create shelf");
      return;
    }

    setShelves((prev) => (prev.includes(data.shelf!) ? prev : [data.shelf!, ...prev]));
    setNewShelf("");
    toast.success(`Shelf "${data.shelf}" created`);
  }

  if (loading) {
    return (
      <main className="brutal-card">
        <p className="text-sm">Loading collections...</p>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <section className="brutal-card space-y-3">
        <h3 className="text-lg font-bold">Create Shelf</h3>
        <div className="flex gap-2">
          <Input value={newShelf} onChange={(e) => setNewShelf(e.target.value)} placeholder="e.g. Weekend Reads" />
          <Button onClick={createShelf}>
            <FolderPlus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </section>

      {shelfStats.length === 0 ? (
        <section className="brutal-card">
          <h3 className="text-lg font-bold">No collections yet</h3>
          <p className="mt-1 text-sm text-zinc-600">Create your first shelf above.</p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shelfStats.map((shelf) => (
            <article key={shelf.name} className="brutal-card">
              <h3 className="text-lg font-bold">{shelf.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">{shelf.count} books</p>
              <Link href={`/library?shelf=${encodeURIComponent(shelf.name)}`} className="brutal-btn mt-4 w-full">
                Open shelf
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
