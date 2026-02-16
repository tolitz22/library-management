"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function HighlightsEditor({ initial, bookId }: { initial: string[]; bookId: string }) {
  const [highlights, setHighlights] = useState<string[]>(initial);
  const [input, setInput] = useState("");

  async function addHighlight() {
    const text = input.trim();
    if (!text) return;

    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, content: text }),
    });

    if (!res.ok) {
      toast.error("Failed to add highlight");
      return;
    }

    setHighlights((prev) => [text, ...prev]);
    setInput("");
  }

  return (
    <section className="brutal-card space-y-3">
      <h3 className="text-lg font-bold">Highlights</h3>

      <div className="rounded-2xl border-[2px] border-[#1E1E1E] bg-white p-3 shadow-[3px_3px_0_0_#1E1E1E]">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Add a highlight</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste quote or write a highlight"
            className="h-11 w-full rounded-xl border-[2px] border-[#1E1E1E] bg-[#fffefc] px-3 text-sm font-medium outline-none shadow-[2px_2px_0_0_#1E1E1E]"
            onKeyDown={(e) => e.key === "Enter" && addHighlight()}
          />
          <Button
            onClick={addHighlight}
            iconPath="/templates/demon-slayer/icons/Reminders.png"
            className="bg-[#00C9A7] text-[#1E1E1E]"
          >
            Add Highlight
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {highlights.length ? (
          highlights.map((h, i) => (
            <li key={`${h}-${i}`} className="rounded-xl border-[2px] border-[#1E1E1E] bg-[#FFF8DF] p-3 shadow-[2px_2px_0_0_#1E1E1E]">
              <div className="flex items-start justify-between gap-3">
                <p>{h}</p>
                <button
                  onClick={() => setHighlights((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-lg border-[2px] border-[#1E1E1E] bg-white px-2 py-0.5 text-xs font-semibold shadow-[2px_2px_0_0_#1E1E1E]"
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-zinc-500">No highlights yet.</li>
        )}
      </ul>
    </section>
  );
}
