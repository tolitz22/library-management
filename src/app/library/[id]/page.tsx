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

const STORAGE_KEY = "library_books_v1";

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
            <span>{book.progress}%</span>
          </div>
          <Progress value={book.progress} />
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
