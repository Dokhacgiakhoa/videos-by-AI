"use client";

import { useEffect, useRef } from "react";

interface Props {
  running: boolean;
  title: string;
  status: string;
  log: string[];
  thumbs: string[];
}

export function ProgressPanel({ running, title, status, log, thumbs }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  if (!running && log.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        {running && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
        )}
        <span>{title ? `Tiến độ — ${title}` : "Tiến độ"}</span>
      </div>
      <p className="text-sm text-indigo-300" aria-live="polite">
        {status}
      </p>
      <div
        ref={logRef}
        role="log"
        className="max-h-40 overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-400"
      >
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {thumbs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Ảnh ${i + 1}`} className="h-28 w-auto rounded-lg border border-zinc-700" />
          ))}
        </div>
      )}
    </section>
  );
}
