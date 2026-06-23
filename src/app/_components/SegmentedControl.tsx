"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";

export interface SegOption<T extends string> {
  value: T;
  label: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  label?: string;
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  accent?: "indigo" | "orange";
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  accent = "indigo",
}: Props<T>) {
  const activeCls =
    accent === "orange"
      ? "bg-hot/15 border-hot/40 shadow-[0_0_15px_rgba(250,163,9,0.3)] backdrop-blur-lg"
      : "bg-blue-500/15 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-lg";

  const layoutId = useId();

  function onKey(e: React.KeyboardEvent, idx: number) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(options[(idx + 1) % options.length].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(options[(idx - 1 + options.length) % options.length].value);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-base font-mono uppercase tracking-wide text-[#6b7c96] px-0.5">{label}</span>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 relative bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKey(e, i)}
              className={`relative flex-1 z-10 flex flex-col items-center justify-center min-w-[80px] rounded-lg px-2 py-2 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? (accent === "orange" ? "text-hot" : "text-blue-400") : "text-zinc-400 hover:text-white"
              }`}
            >
              {active && (
                <motion.div
                  layoutId={layoutId}
                  className={`absolute inset-0 z-[-1] rounded-lg border ${activeCls}`}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="flex items-center justify-center gap-1.5 z-10">
                {o.icon}
                {o.label}
              </span>
              {o.hint && <span className="mt-0.5 block text-base font-normal opacity-70 z-10">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
