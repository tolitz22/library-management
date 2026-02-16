import Link from "next/link";
import { books } from "@/lib/mock-data";
import { BookCard } from "@/components/book-card";

export default function DashboardPage() {
  const reading = books.filter((b) => b.status === "reading");
  const completed = books.filter((b) => b.status === "completed").length;

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
          <Link href="/library" className="brutal-btn">
            Open library
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reading.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </main>
  );
}
