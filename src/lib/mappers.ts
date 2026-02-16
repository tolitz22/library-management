import type { Book } from "@/lib/types";

export type BookRow = {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string;
  imageUrl: string;
  shelf: string;
  tags: string;
  currentPage: string;
  totalPages: string;
  progress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    coverUrl:
      row.imageUrl ||
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80",
    imageUrl: row.imageUrl,
    isbn: row.isbn,
    progress: Number(row.progress || 0),
    currentPage: Number(row.currentPage || 0),
    totalPages: Number(row.totalPages || 0),
    status: (row.status as Book["status"]) || "queued",
    tags: row.tags ? row.tags.split(",").map((x) => x.trim()).filter(Boolean) : [],
    shelf: row.shelf || "Desk Stack",
    summary: "",
    notes: [],
    highlights: [],
    attachments: [],
  };
}

export function bookToRow(book: Book, userId: string): BookRow {
  return {
    id: book.id,
    userId,
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? "",
    imageUrl: book.imageUrl ?? book.coverUrl,
    shelf: book.shelf,
    tags: book.tags.join(", "),
    currentPage: String(book.currentPage ?? 0),
    totalPages: String(book.totalPages ?? 0),
    progress: String(book.progress ?? 0),
    status: book.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
