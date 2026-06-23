import React from "react";

interface SwitchCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  iconOn: string;
  iconOff: string;
  title: string;
  description?: React.ReactNode;
  color: "cyan" | "amber" | "emerald";
  className?: string;
}

export function SwitchCard({
  checked,
  onChange,
  disabled,
  iconOn,
  iconOff,
  title,
  description,
  color,
  className = "",
}: SwitchCardProps) {
  const baseColors = {
    cyan: {
      bgActive: "bg-cyan-500/10",
      borderActive: "border-cyan-500/50",
      shadowActive: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
      textActive: "text-cyan-400",
      toggleBgActive: "bg-cyan-500",
    },
    amber: {
      bgActive: "bg-amber-500/10",
      borderActive: "border-amber-500/50",
      shadowActive: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      textActive: "text-amber-500",
      toggleBgActive: "bg-amber-500",
    },
    emerald: {
      bgActive: "bg-emerald-500/10",
      borderActive: "border-emerald-500/50",
      shadowActive: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      textActive: "text-emerald-400",
      toggleBgActive: "bg-emerald-500",
    },
  };

  const theme = baseColors[color];
  const cursorStyle = disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer";
  const bgStyle = checked ? `${theme.bgActive} ${theme.borderActive} ${theme.shadowActive}` : "bg-black/20 border-line hover:border-zinc-700";

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all duration-300 ${cursorStyle} ${bgStyle} ${className}`}
    >
      <div className="flex items-center gap-3 text-left">
        <div className={`text-lg ${checked ? theme.textActive : "text-zinc-400"}`}>
          {checked ? iconOn : iconOff}
        </div>
        <div className="flex flex-col items-start mt-0.5">
          <span className={`text-base font-bold transition-colors font-mono ${checked ? theme.textActive : "text-white"}`}>
            {title}
          </span>
          {description && (
            <span className="text-base text-zinc-400 mt-0.5 normal-case font-sans font-normal">
              {description}
            </span>
          )}
        </div>
      </div>
      <div className={`shrink-0 w-12 h-6 rounded-full p-1 flex items-center transition-colors ${checked ? theme.toggleBgActive : "bg-zinc-800"}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </div>
    </button>
  );
}
