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
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel/60 backdrop-blur-md p-4 shadow-xl">
      {/* Terminal window header */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="text-[10px] font-mono text-zinc-400 ml-1.5 uppercase tracking-wider">
            {title ? `progress_monitor: ${title}` : "progress_monitor.sh"}
          </span>
        </div>
        {running && (
          <span className="text-[9px] font-mono text-cy animate-pulse uppercase tracking-wider font-semibold">
            RUNNING
          </span>
        )}
      </div>

      <p className="text-xs font-mono text-cy" aria-live="polite">
        {running ? "⚡ " : "✓ "} {status}
      </p>
      
      <div
        ref={logRef}
        role="log"
        className="max-h-44 overflow-y-auto rounded-lg bg-black/60 border border-line p-3 font-mono text-[11px] leading-relaxed text-zinc-400"
      >
        {log.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-zinc-600 select-none">&gt;</span>
            <span className={l.startsWith("✅") ? "text-emerald-400" : l.startsWith("⚠️") ? "text-amber-400" : ""}>{l}</span>
          </div>
        ))}
      </div>

      {thumbs.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Ảnh ${i + 1}`} className="h-20 w-auto rounded-lg border border-line" />
          ))}
        </div>
      )}
    </section>
  );
}
