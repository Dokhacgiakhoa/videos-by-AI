"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  provider?: "gemini" | "openai";
}

export function GeminiKeyField({ value, onChange, provider = "gemini" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-black/15 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-base font-mono font-medium text-white hover:text-white cursor-pointer"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        {provider === "gemini" ? "Gemini API Key" : "OpenAI API Key"}
        {value ? (
          <span className="ml-auto text-lg text-emerald-400">✅</span>
        ) : (
          <span className="ml-auto text-lg text-hot">❌</span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2 pt-1 font-sans">
          {provider === "gemini" ? (
            <p className="text-base text-zinc-400 leading-relaxed">
              Lấy free tại{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-hot hover:underline"
              >
                aistudio.google.com
              </a>
              . Video sẽ được kết xuất dựa trên tuỳ chỉnh Prompt. Bạn không cần làm gì thêm.
            </p>
          ) : (
            <p className="text-base text-zinc-400 leading-relaxed">
              Lấy key tại{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-hot hover:underline"
              >
                platform.openai.com
              </a>
              . Video sẽ được kết xuất dựa trên tuỳ chỉnh Prompt.
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="AIza..."
              className="flex-1 px-3 py-2 text-base outline-none text-white tech-input-glass"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-3 py-2 text-base text-zinc-400 cursor-pointer tech-btn-glass"
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
