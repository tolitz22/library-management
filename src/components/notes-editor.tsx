"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NotesEditor({ bookId }: { bookId: string }) {
  const [value, setValue] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      const res = await fetch(`/api/notes?bookId=${encodeURIComponent(bookId)}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as { notes?: Array<{ content: string }> };
      if (cancelled) return;
      setSavedNotes((data.notes ?? []).map((note) => note.content).filter(Boolean));
    }

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  async function saveNote() {
    const trimmed = value.trim();
    if (!trimmed) return;

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, content: trimmed }),
    });

    if (!res.ok) {
      toast.error("Failed to save note");
      return;
    }

    setSavedNotes((prev) => [trimmed, ...prev].slice(0, 3));
    setValue("");
  }

  return (
    <section className="brutal-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Notes</h3>
        <span className="rounded-lg border-[2px] border-[#1E1E1E] bg-[#F7F8FC] px-2 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#1E1E1E]">
          Markdown
        </span>
      </div>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-64 w-full resize-y bg-white p-4 font-mono text-sm leading-6"
        placeholder="Write thoughts, quotes, or chapter summary..."
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">Tip: keep each note short and scannable.</p>
        <Button onClick={saveNote}>
          <Save className="h-4 w-4" />
          Save Note
        </Button>
      </div>

      {savedNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Recent notes</p>
          {savedNotes.map((note, idx) => (
            <div
              key={`${idx}-${note.slice(0, 12)}`}
              className="rounded-xl border-[2px] border-[#1E1E1E] bg-white p-3 text-sm shadow-[2px_2px_0_0_#1E1E1E]"
            >
              {note.slice(0, 120)}
              {note.length > 120 ? "..." : ""}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
