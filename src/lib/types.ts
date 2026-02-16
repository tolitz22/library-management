export type Attachment = {
  id: string;
  name: string;
  type: "pdf" | "image" | "other";
  size: string;
  uploadedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  imageUrl?: string;
  isbn?: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  status: "reading" | "completed" | "queued";
  tags: string[];
  shelf: string;
  summary?: string;
  notes: Note[];
  highlights: string[];
  attachments: Attachment[];
};
