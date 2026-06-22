"use client";

import React from "react";

export interface SegOption<T extends string> {
  value: T;
  label: string;
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
      ? "border-orange-500 bg-orange-600/20 text-orange-300"
      : "border-indigo-500 bg-indigo-600/20 text-indigo-300";

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
      {label && <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
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
              className={`flex-1 min-w-[100px] rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? activeCls : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {o.icon}
                {o.label}
              </span>
              {o.hint && <span className="mt-0.5 block text-xs font-normal opacity-70">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
