import { NextResponse } from "next/server";

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export async function POST(req: Request) {
  const body = await req.json();
  const isbnRaw = String(body?.isbn ?? "");
  const isbn = normalizeIsbn(isbnRaw);

  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    return NextResponse.json({ error: "Invalid ISBN" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        added: false,
        message: "ISBN not found. You can still add manually.",
      });
    }

    const data = await res.json();

    return NextResponse.json({
      added: true,
      book: {
        title: data.title ?? "Untitled",
        author: "Unknown",
        isbn,
      },
      message: "Book found by ISBN and auto-added (stub).",
    });
  } catch {
    return NextResponse.json({ added: false, message: "Unable to reach book service." });
  }
}
