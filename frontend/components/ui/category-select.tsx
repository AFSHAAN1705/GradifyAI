"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check } from "lucide-react";

type Category = {
  id: string;
  code: string;
  name: string;
  group?: string | null;
};

type CategorySelectProps = {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
};

const GROUP_ORDER = [
  "General",
  "Rural",
  "Kannada Medium",
  "Hyderabad Karnataka",
  "Category 1",
  "Category 2A",
  "Category 2B",
  "Category 3A",
  "Category 3B",
  "SC",
  "ST",
  "Private"
];

function groupKey(cat: Category): string {
  return cat.group ?? "Other";
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Select category",
  label,
  error
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => categories.find((c) => c.code === value), [categories, value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.group ?? "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const cat of filtered) {
      const gk = groupKey(cat);
      if (!map.has(gk)) map.set(gk, []);
      map.get(gk)!.push(cat);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = GROUP_ORDER.indexOf(a);
      const bi = GROUP_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);
  const totalItems = flatList.length;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setFocusedIdx(-1);
    } else {
      searchRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "Enter" || event.key === "ArrowDown") {
        setOpen(true);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIdx((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIdx((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIdx >= 0 && focusedIdx < flatList.length) {
          onChange(flatList[focusedIdx].code);
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
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
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="rounded bg-[rgba(101,228,255,0.12)] px-1.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                {selected.code}
              </span>
              <span className="text-[var(--muted)]">{selected.name}</span>
            </span>
          ) : (
            placeholder
          )}
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
            {/* Search */}
            <div className="border-b border-[var(--border)] px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.2)] px-3 py-1.5 transition-colors focus-within:border-[rgba(101,228,255,0.4)]">
                <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setFocusedIdx(-1); }}
                  placeholder="Type to filter..."
                  className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-[260px] overflow-y-auto overscroll-contain" style={{ scrollBehavior: "smooth" }}>
              {grouped.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">
                  No categories match &quot;{search}&quot;
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group}>
                    <div className="sticky top-0 border-b border-[var(--border)] bg-[rgba(10,14,23,0.95)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] backdrop-blur-md">
                      {group}
                    </div>
                    {items.map((cat) => {
                      const isSelected = cat.code === value;
                      const idx = flatList.indexOf(cat);
                      const isFocused = idx === focusedIdx;
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          onClick={() => { onChange(cat.code); setOpen(false); }}
                          onMouseEnter={() => setFocusedIdx(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all ${
                            isSelected
                              ? "bg-[rgba(101,228,255,0.08)] text-[var(--primary)]"
                              : isFocused
                              ? "bg-[rgba(101,228,255,0.06)] text-[var(--foreground)]"
                              : "text-[var(--foreground)] hover:bg-[rgba(101,228,255,0.04)]"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-14 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                              isSelected
                                ? "bg-[rgba(101,228,255,0.15)] text-[var(--primary)]"
                                : "bg-[rgba(255,255,255,0.05)] text-[var(--muted)]"
                            }`}
                          >
                            {cat.code}
                          </span>
                          <span className="flex-1 leading-tight">{cat.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-1.5 text-[10px] text-[var(--muted)]">
              {totalItems} categories &middot; Arrow keys &middot; Enter to select
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
