import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { Book } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function BookCard({
  book,
  shelves,
  onMoveShelf,
  onOpenBook,
}: {
  book: Book;
  shelves?: string[];
  onMoveShelf?: (bookId: string, shelf: string) => void;
  onOpenBook?: (bookId: string) => void;
}) {
  const progress =
    book.totalPages && book.totalPages > 0
      ? Math.max(0, Math.min(100, Math.round(((book.currentPage ?? 0) / book.totalPages) * 100)))
      : book.progress;

  return (
    <article
      className="book-card brutal-card relative overflow-hidden p-3 hover:rotate-[-0.5deg] sm:p-4"
      style={{ background: "var(--muted-surface)", color: "var(--fg)" }}
    >
      <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded-xl border-[2px] sm:mb-3 sm:aspect-[3/4]" style={{ borderColor: "var(--border)" }}>
        <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:line-clamp-1 sm:text-base">{book.title}</h3>
          <p className="text-xs sm:text-sm" style={{ color: "color-mix(in srgb, var(--fg) 75%, transparent)" }}>
            {book.author}
          </p>
        </div>
        <button
          className="rounded-lg border-[2px] p-1"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 space-y-1 sm:mb-3">
        <div className="flex justify-between text-xs font-medium">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {book.borrowedBy ? (
          <Badge className="text-xs" style={{ background: "#fde68a", color: "#1f2937" }}>
            Borrowed: {book.borrowedBy}
          </Badge>
        ) : null}
        {book.tags.map((tag) => (
          <Badge key={tag} className="text-xs" style={{ background: "var(--surface)", color: "var(--fg)" }}>
            {tag}
          </Badge>
        ))}
      </div>

      {shelves && onMoveShelf ? (
        <div className="mb-3">
          <select
            className="brutal-input"
            value={book.shelf}
            onChange={(e) => onMoveShelf(book.id, e.target.value)}
          >
            {shelves.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      ) : null}

      <Link href={`/library/${book.id}`} onClick={() => onOpenBook?.(book.id)} className="brutal-btn h-10 w-full text-sm sm:h-11">
        Open book
      </Link>
    </article>
  );
}
