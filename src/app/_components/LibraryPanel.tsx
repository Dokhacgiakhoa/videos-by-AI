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
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-panel/60 backdrop-blur-md p-4 shadow-xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-mono font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        📚 Thư viện ({jobs.length || "—"})
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1 font-sans">
          {jobs.length === 0 && <p className="text-xs text-zinc-500 font-mono">Chưa có sản phẩm nào.</p>}
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-black/60 p-2.5 hover:border-cy/30 transition-colors">
              <span className="text-base select-none">{j.type === "video" ? "🎬" : "🖼️"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-mono text-zinc-200" title={j.title}>{j.title}</div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {j.aspectRatio} · {j.createdAt.slice(0, 16).replace("T", " ")}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <a
                  href={j.videoUrl || j.images?.[0] || "#"}
                  download
                  className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-mono text-cy bg-cy/5 hover:bg-cy/15 transition-colors cursor-pointer"
                >
                  Tải
                </a>
                <button
                  onClick={() => del(j.id)}
                  className="rounded-lg border border-red-950 px-2.5 py-1 text-[11px] font-mono text-red-400 bg-red-950/10 hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
