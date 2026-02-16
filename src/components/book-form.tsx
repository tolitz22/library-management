"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  shelves,
  onBookSaved,
}: {
  shelves: string[];
  onBookSaved: (book: Book) => void;
}) {
  const [saved, setSaved] = useState(false);
  const hasShelves = shelves.length > 0;

  const { register, handleSubmit, watch, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { shelf: "", title: "", author: "", tags: "", summary: "" },
  });

  const selectedShelf = watch("shelf");
  const canSave = hasShelves && !!selectedShelf && !formState.isSubmitting;

  const onSubmit = async (values: FormValues) => {
    if (!canSave) return;

    const tags = (values.tags ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    onBookSaved({
      id: `book-${Date.now()}`,
      title: values.title,
      author: values.author,
      coverUrl:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=80",
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      status: "queued",
      tags,
      shelf: values.shelf,
      summary: values.summary,
      notes: [],
      highlights: [],
      attachments: [],
    });

    reset({ shelf: "", title: "", author: "", tags: "", summary: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Add / Edit Book</h3>
        {!hasShelves && (
          <Link href="/collections" className="brutal-btn bg-[#FF6584] px-3 py-1.5 text-sm">
            Create collection first
          </Link>
        )}
      </div>

      {!hasShelves && (
        <div className="rounded-xl border-[2px] border-[#1E1E1E] bg-[#FFF8DF] p-3 text-sm font-medium shadow-[2px_2px_0_0_#1E1E1E]">
          Step 1: choose or create a shelf/collection. Step 2: fill book details. Step 3: save.
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold">Shelf / Collection</label>
        <select {...register("shelf")} className="brutal-input" disabled={!hasShelves}>
          <option value="">Select shelf</option>
          {shelves.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {!selectedShelf && hasShelves && (
          <p className="mt-1 text-xs font-medium text-[#B42318]">Pick a shelf first before saving.</p>
        )}
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
        <Textarea
          {...register("summary")}
          placeholder="What makes this one worth keeping close?"
          disabled={!hasShelves}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSave}>
          Save Book
        </Button>
        {saved && <p className="text-sm font-medium text-[#00A182]">Saved</p>}
      </div>
    </form>
  );
}
