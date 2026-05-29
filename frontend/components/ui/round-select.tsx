"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

type RoundOption = {
  value: string;
  label: string;
};

type RoundSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: RoundOption[];
  label?: string;
  error?: string;
};

export function RoundSelect({ value, onChange, options, label, error }: RoundSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`glow-border flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm transition-all ${
          open ? "border-[rgba(101,228,255,0.5)]" : ""
        } ${error ? "border-[var(--danger)]" : ""}`}
        style={{
          background: open
            ? "linear-gradient(135deg, rgba(101,228,255,0.08), rgba(155,124,255,0.05))"
            : "var(--panel-strong)"
        }}
      >
        <span className={selected ? "font-medium text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {selected?.label ?? "All rounds"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
        </motion.div>
      </button>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[rgba(101,228,255,0.2)] shadow-2xl"
            style={{
              background: "var(--surface-strong)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(101,228,255,0.06)"
            }}
          >
            <div className="max-h-[200px] overflow-y-auto">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all ${
                      isSelected
                        ? "bg-[rgba(101,228,255,0.08)] text-[var(--primary)]"
                        : "text-[var(--foreground)] hover:bg-[rgba(101,228,255,0.04)]"
                    }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
