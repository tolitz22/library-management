"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NotesEditor() {
  const [value, setValue] = useState("## Chapter takeaway\n\n- Keep habits tiny\n- Review every week");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

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
        <Button
          onClick={() => {
            const trimmed = value.trim();
            if (!trimmed) return;
            setSavedNotes((prev) => [trimmed, ...prev].slice(0, 3));
            setValue("");
          }}
        >
          Save Note
        </Button>
      </div>

      {savedNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Recent notes</p>
          {savedNotes.map((note, idx) => (
            <div key={`${idx}-${note.slice(0, 12)}`} className="rounded-xl border-[2px] border-[#1E1E1E] bg-white p-3 text-sm shadow-[2px_2px_0_0_#1E1E1E]">
              {note.slice(0, 120)}
              {note.length > 120 ? "..." : ""}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
