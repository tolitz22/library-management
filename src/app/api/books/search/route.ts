import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("search failed");

    const data = await res.json();
    const results = (data.docs ?? []).map((doc: any) => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] ?? "Unknown",
      isbn: doc.isbn?.[0] ?? null,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
