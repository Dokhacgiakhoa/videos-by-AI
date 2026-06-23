"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

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
  extractedColors?: string[];
}

const LS_KEY = "ai91_brand";

export function BrandUploader({ onChange }: { onChange: (brand: BrandData | null) => void }) {
  const [mode, setMode] = useState<"logo" | "color">("logo");
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [customColor, setCustomColor] = useState("#f59e0b");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "color") {
      const b: BrandData = {
        logoUrl: "",
        palette: {
          primary: customColor,
          secondary: customColor,
          accent: customColor,
          bg: "#050505",
          text: "#f4f4f5"
        }
      };
      onChange(b);
    } else {
      onChange(brand);
    }
  }, [mode, customColor, brand, onChange]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const b = JSON.parse(saved) as BrandData;
        setBrand(b);
        return;
      }
    } catch { /* ignore */ }
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => {
        if (d?.logoUrl) {
          setBrand(d);
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
      localStorage.setItem(LS_KEY, JSON.stringify(b));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(async () => {
    await fetch("/api/brand", { method: "DELETE" }).catch(() => {});
    setBrand(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  const selectExtractedColor = useCallback((color: string) => {
    setBrand(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        palette: {
          ...prev.palette,
          primary: color,
        }
      };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl<"logo" | "color">
        value={mode}
        onChange={(v) => setMode(v)}
        options={[
          { value: "logo", label: "🖼️ Nhận diện Logo" },
          { value: "color", label: "🎨 Chọn Màu Chính" },
        ]}
        accent="orange"
      />

      {mode === "logo" && (
        <div className="flex flex-col gap-2">
          {brand ? (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/20 p-3 w-full animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-line bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-white">Đã nhận diện logo</span>
                  <button
                    onClick={reset}
                    className="text-base font-mono text-red-400 hover:text-red-300 cursor-pointer text-left mt-0.5"
                  >
                    Xóa logo
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2 border-t border-line/40 pt-3">
                <span className="text-base text-zinc-400 font-mono uppercase mb-1">Chọn màu thương hiệu từ Logo:</span>
                {(brand.extractedColors || Object.values(brand.palette)).slice(0, 6).map((c, i) => {
                  const isSelected = brand.palette.primary === c;
                  return (
                    <div 
                      key={i} 
                      onClick={() => selectExtractedColor(c)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                        isSelected 
                          ? "bg-hot/10 border-hot" 
                          : "bg-black/20 border-line hover:border-hot/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-4 h-4 rounded-full border ${
                          isSelected ? "border-hot" : "border-zinc-600"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-hot" />}
                        </div>
                        <div className="w-8 h-8 rounded-md shadow-inner border border-black/20" style={{ background: c }} />
                      </div>
                      <span className="text-base font-mono font-bold text-white">{c.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center rounded-xl border border-dashed border-line/80 hover:border-cy/50 bg-black/20 py-5 cursor-pointer transition-all animate-in fade-in duration-300"
            >
              <span className="text-base font-mono text-zinc-400">
                {uploading ? "Đang phân tích màu..." : "Kéo thả hoặc click để chọn logo"}
              </span>
            </div>
          )}
        </div>
      )}

      {mode === "color" && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-line bg-black/20 animate-in fade-in duration-300">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold text-white">Màu chủ đạo</span>
            <span className="text-base font-mono text-zinc-400 uppercase">{customColor}</span>
          </div>
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

      {error && <p className="text-base text-red-400 font-mono">{error}</p>}
    </div>
  );
}
