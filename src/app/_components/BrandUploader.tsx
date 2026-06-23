"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface BrandData {
  logoUrl: string;
  palette: BrandPalette;
}

const LS_KEY = "ai91_brand";

export function BrandUploader({ onChange }: { onChange: (brand: BrandData | null) => void }) {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const b = JSON.parse(saved) as BrandData;
        setBrand(b);
        onChange(b);
        return;
      }
    } catch { /* ignore */ }
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => {
        if (d?.logoUrl) {
          setBrand(d);
          onChange(d);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/brand", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Lỗi ${res.status}`);
      const b = (await res.json()) as BrandData;
      setBrand(b);
      onChange(b);
      localStorage.setItem(LS_KEY, JSON.stringify(b));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const reset = useCallback(async () => {
    await fetch("/api/brand", { method: "DELETE" }).catch(() => {});
    setBrand(null);
    onChange(null);
    localStorage.removeItem(LS_KEY);
  }, [onChange]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Logo thương hiệu</label>

      {brand ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-black/40 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-line" />
          <div className="flex gap-1">
            {Object.values(brand.palette).map((c, i) => (
              <span key={i} className="w-5 h-5 rounded-md border border-line" style={{ background: c }} title={c} />
            ))}
          </div>
          <button
            onClick={reset}
            className="ml-auto text-[10px] font-mono text-red-400 hover:text-red-300 cursor-pointer"
          >
            Xóa
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center rounded-xl border-2 border-dashed border-line hover:border-cy/40 bg-black/20 py-4 cursor-pointer transition-colors"
        >
          <span className="text-xs font-mono text-zinc-500">
            {uploading ? "Đang phân tích màu..." : "Kéo thả hoặc click để chọn logo"}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}
    </div>
  );
}
