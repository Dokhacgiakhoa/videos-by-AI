"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GeminiKeyField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-panel/60 backdrop-blur-md p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-mono font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Gemini API Key (bắt buộc — lưu trên máy bạn)
        {value ? (
          <span className="ml-auto text-xs text-cy">Đã lưu ✓</span>
        ) : (
          <span className="ml-auto text-xs text-hot">Chưa có</span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1 font-sans">
          <p className="text-xs text-zinc-500">
            Lấy free tại{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-cy hover:underline"
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
              className="flex-1 rounded-lg border border-line bg-black/60 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-line px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer"
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
