"use client";

import { useCallback, useEffect, useState } from "react";

interface Job {
  id: string;
  type: "video" | "imagepost";
  title: string;
  aspectRatio: string;
  createdAt: string;
  videoUrl?: string;
  images?: string[];
  zipUrl?: string;
  thumb?: string;
}

export function LibraryPanel({ refreshKey }: { refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const load = useCallback(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, refreshKey, load]);

  async function del(id: string) {
    await fetch(`/api/library?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        📚 Thư viện ({jobs.length || "—"})
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1">
          {jobs.length === 0 && <p className="text-xs text-zinc-500">Chưa có sản phẩm nào.</p>}
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
              <span className="text-lg">{j.type === "video" ? "🎬" : "🖼️"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-zinc-200">{j.title}</div>
                <div className="text-xs text-zinc-500">
                  {j.aspectRatio} · {j.createdAt.slice(0, 16).replace("T", " ")}
                </div>
              </div>
              <a
                href={j.videoUrl || j.zipUrl || j.images?.[0] || "#"}
                download
                className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Tải
              </a>
              <button
                onClick={() => del(j.id)}
                className="rounded-lg border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
