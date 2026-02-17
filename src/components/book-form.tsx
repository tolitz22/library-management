"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Book } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  shelf: z.string().min(1),
  tags: z.string().optional(),
  summary: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function BookForm({
  onBookSaved,
  shelves,
}: {
  onBookSaved: (book: Book) => void;
  shelves: string[];
}) {
  const [saved, setSaved] = useState(false);
  const hasShelves = shelves.length > 0;

  const { register, handleSubmit, formState, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", author: "", shelf: "", tags: "", summary: "" },
  });

  const selectedShelf = watch("shelf");

  const onSubmit = async (values: FormValues) => {
    if (formState.isSubmitting || !hasShelves) return;

    const tags = (values.tags ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        author: values.author,
        tags,
        summary: values.summary,
        shelf: values.shelf,
        currentPage: 0,
        totalPages: 0,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to save book");
      return;
    }

    const data = (await res.json()) as { book: Book };
    onBookSaved(data.book);

    reset({ title: "", author: "", shelf: "", tags: "", summary: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Quick Add Book</h3>
        {!hasShelves && (
          <Link href="/collections" className="brutal-btn text-sm">
            Create shelf first
          </Link>
        )}
      </div>

      {!hasShelves ? (
        <div className="rounded-xl border-[2px] border-[#1E1E1E] bg-[#FFF8DF] p-3 text-sm font-medium shadow-[2px_2px_0_0_#1E1E1E]">
          You need at least one shelf before adding books.
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-semibold">Shelf</label>
        <select {...register("shelf")} className="brutal-input" disabled={!hasShelves}>
          <option value="">Select shelf</option>
          {shelves.map((shelf) => (
            <option key={shelf} value={shelf}>
              {shelf}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Title</label>
          <Input {...register("title")} placeholder="The Name of the Wind" disabled={!hasShelves} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Author</label>
          <Input {...register("author")} placeholder="Patrick Rothfuss" disabled={!hasShelves} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">Tags</label>
        <Input {...register("tags")} placeholder="Fantasy, Adventure" disabled={!hasShelves} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">Quick Summary</label>
        <Textarea {...register("summary")} placeholder="What makes this one worth keeping close?" disabled={!hasShelves} />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={formState.isSubmitting || !hasShelves || !selectedShelf}
        >
          <BookPlus className="h-4 w-4" />
          Save Book
        </Button>
        {saved && <p className="text-sm font-medium text-[#00A182]">Saved</p>}
      </div>
    </form>
  );
}
