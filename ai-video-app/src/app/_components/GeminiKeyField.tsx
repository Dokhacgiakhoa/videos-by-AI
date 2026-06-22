"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GeminiKeyField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Gemini API Key (bắt buộc — lưu trên máy bạn)
        {value ? (
          <span className="ml-auto text-xs text-emerald-400">Đã lưu ✓</span>
        ) : (
          <span className="ml-auto text-xs text-amber-400">Chưa có</span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs text-zinc-500">
            Lấy free tại{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline"
            >
              aistudio.google.com/apikey
            </a>
            . Key chỉ lưu trên trình duyệt của bạn (localStorage), chỉ gửi tới Google.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="AIza..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
