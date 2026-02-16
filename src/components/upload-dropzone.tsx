"use client";

import { useMemo, useState } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadFile = { name: string; size: number; progress: number };

export function UploadDropzone() {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const total = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  async function onSelect(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).map((f) => ({ name: f.name, size: f.size, progress: 0 }));
    setFiles((prev) => [...prev, ...picked]);

    for (const file of picked) {
      await fetch("/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: "application/octet-stream" }),
      });
      let p = 0;
      const timer = setInterval(() => {
        p += 20;
        setFiles((prev) => prev.map((x) => (x.name === file.name ? { ...x, progress: Math.min(p, 100) } : x)));
        if (p >= 100) clearInterval(timer);
      }, 180);
    }
  }

  return (
    <section className="brutal-card space-y-3">
      <h3 className="text-lg font-bold">Attachments & Covers</h3>
      <label className="block cursor-pointer rounded-2xl border-[2px] border-dashed border-[#1E1E1E] bg-white p-6 text-center shadow-[4px_4px_0_0_#1E1E1E]">
        <Upload className="mx-auto mb-2 h-6 w-6" />
        <p className="font-semibold">Drag & drop or click to upload</p>
        <p className="text-sm text-zinc-500">PDF, JPG, PNG</p>
        <input type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
      </label>

      <p className="text-xs text-zinc-500">Total: {(total / (1024 * 1024)).toFixed(2)} MB</p>

      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.name} className="rounded-xl border-[2px] border-[#1E1E1E] bg-white p-3 shadow-[2px_2px_0_0_#1E1E1E]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="px-2 py-1">
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1"
                  onClick={() => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full border-[2px] border-[#1E1E1E]">
              <div className="h-full bg-[#6C63FF]" style={{ width: `${file.progress}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
