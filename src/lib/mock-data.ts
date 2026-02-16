import type { Book } from "@/lib/types";

export const shelves = ["Desk Stack", "Weekend Reads", "Reference", "Wishlist"];

export const books: Book[] = [
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80",
    progress: 62,
    status: "reading",
    tags: ["Habits", "Self-growth"],
    shelf: "Desk Stack",
    summary: "Small systems beat giant goals.",
    notes: [
      {
        id: "n1",
        title: "Identity-driven habits",
        content: "Focus on becoming the type of person who does the habit.",
        createdAt: "2026-02-15",
      },
    ],
    highlights: ["You do not rise to the level of your goals.", "Make it obvious, attractive, easy, satisfying."],
    attachments: [
      {
        id: "a1",
        name: "chapter-3-notes.pdf",
        type: "pdf",
        size: "1.2 MB",
        uploadedAt: "2026-02-14",
      },
    ],
  },
  {
    id: "deep-work",
    title: "Deep Work",
    author: "Cal Newport",
    coverUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=480&q=80",
    progress: 30,
    status: "reading",
    tags: ["Focus", "Productivity"],
    shelf: "Weekend Reads",
    notes: [],
    highlights: ["Clarity about what matters provides clarity about what does not."],
    attachments: [],
  },
  {
    id: "clean-code",
    title: "Clean Code",
    author: "Robert C. Martin",
    coverUrl:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=480&q=80",
    progress: 100,
    status: "completed",
    tags: ["Engineering", "Craft"],
    shelf: "Reference",
    notes: [],
    highlights: [],
    attachments: [],
  },
];
