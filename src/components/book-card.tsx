import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { Book } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="brutal-card hover:rotate-[-0.5deg]" style={{ background: "var(--muted-surface)", color: "var(--fg)" }}>
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl border-[2px]" style={{ borderColor: "var(--border)" }}>
        <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="line-clamp-1 font-bold">{book.title}</h3>
          <p className="text-sm" style={{ color: "color-mix(in srgb, var(--fg) 75%, transparent)" }}>{book.author}</p>
        </div>
        <button
          className="rounded-lg border-[2px] p-1"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3 space-y-1">
        <div className="flex justify-between text-xs font-medium">
          <span>Progress</span>
          <span>{book.progress}%</span>
        </div>
        <Progress value={book.progress} />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {book.tags.map((tag) => (
          <Badge key={tag} className="text-xs" style={{ background: "var(--surface)", color: "var(--fg)" }}>
            {tag}
          </Badge>
        ))}
      </div>
      <Link href={`/library/${book.id}`} className="brutal-btn w-full text-sm">
        Open book
      </Link>
    </article>
  );
}
