import { shelves, books } from "@/lib/mock-data";

export default function CollectionsPage() {
  return (
    <main className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shelves.map((shelf) => (
        <article key={shelf} className="brutal-card">
          <h3 className="text-lg font-bold">{shelf}</h3>
          <p className="mt-1 text-sm text-zinc-600">{books.filter((b) => b.shelf === shelf).length} books</p>
          <button className="brutal-btn mt-4 w-full">Open shelf</button>
        </article>
      ))}
    </main>
  );
}
