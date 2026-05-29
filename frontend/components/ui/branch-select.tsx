"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check, X } from "lucide-react";

type Branch = {
  code: string;
  name: string;
};

type BranchSelectProps = {
  branches: Branch[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
};

const BRANCH_GROUP_ORDER = [
  "Computer Science",
  "Electronics",
  "Mechanical/Civil",
  "Other Engineering",
  "Non-Engineering"
];

function branchGroup(code: string): string {
  if (["CSE", "ISE", "CSBS", "CSM", "CSD", "AI", "AI&DS", "AIML", "DS", "IOT", "CS", "RAI"].includes(code)) return "Computer Science";
  if (["ECE", "EEE", "EIE", "TC", "IN", "ML", "BM"].includes(code)) return "Electronics";
  if (["ME", "CIV", "AU", "AERO", "MT", "MN", "PT", "CHE"].includes(code)) return "Mechanical/Civil";
  if (["BT", "FT", "EV", "TX", "PM", "CH", "IE", "MCA"].includes(code)) return "Other Engineering";
  return "Non-Engineering";
}

export function BranchSelect({ branches, value, onChange, placeholder = "Select branches", label }: BranchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) => b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q));
  }, [branches, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Branch[]>();
    for (const b of filtered) {
      const g = branchGroup(b.code);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(b);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = BRANCH_GROUP_ORDER.indexOf(a);
      const bi = BRANCH_GROUP_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filtered]);

  function toggle(branchCode: string) {
    if (value.includes(branchCode)) {
      onChange(value.filter((v) => v !== branchCode));
    } else {
      onChange([...value, branchCode]);
    }
  }

  useEffect(() => {
    if (!open) { setSearch(""); }
    else { searchRef.current?.focus(); }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) { setOpen(false); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glow-border flex min-h-11 w-full items-center justify-between rounded-xl px-4 text-sm transition-all"
        style={{ background: "var(--panel-strong)" }}
      >
        <span className={value.length ? "flex flex-wrap gap-1" : "text-[var(--muted)]"}>
          {value.length === 0 ? placeholder : value.slice(0, 4).map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded bg-[rgba(88,166,255,0.12)] px-1.5 py-0.5 text-xs font-bold text-[var(--primary)]">
              {c}
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(c); }} />
            </span>
          ))}
          {value.length > 4 && <span className="text-xs text-[var(--muted)]">+{value.length - 4}</span>}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[rgba(88,166,255,0.2)] shadow-2xl"
            style={{ background: "var(--surface-strong)", backdropFilter: "blur(24px)" }}
          >
            <div className="border-b border-[var(--border)] px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[rgba(0,0,0,0.2)] px-3 py-1.5 transition-colors focus-within:border-[rgba(88,166,255,0.4)]">
                <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branches..." className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {grouped.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">No branches match &quot;{search}&quot;</div>
              ) : grouped.map(([group, items]) => (
                <div key={group}>
                  <div className="sticky top-0 border-b border-[var(--border)] bg-[rgba(10,14,23,0.95)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] backdrop-blur-md">{group}</div>
                  {items.map((b) => {
                    const selected = value.includes(b.code);
                    return (
                      <button key={b.code} type="button" onClick={() => toggle(b.code)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-all ${selected ? "bg-[rgba(88,166,255,0.08)] text-[var(--primary)]" : "text-[var(--foreground)] hover:bg-[rgba(88,166,255,0.04)]"}`}>
                        <span className={`flex h-7 w-14 shrink-0 items-center justify-center rounded-md text-xs font-bold ${selected ? "bg-[rgba(88,166,255,0.15)] text-[var(--primary)]" : "bg-[rgba(255,255,255,0.05)] text-[var(--muted)]"}`}>{b.code}</span>
                        <span className="flex-1 leading-tight">{b.name}</span>
                        {selected && <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] px-4 py-1.5 text-[10px] text-[var(--muted)]">{filtered.length} branches</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
