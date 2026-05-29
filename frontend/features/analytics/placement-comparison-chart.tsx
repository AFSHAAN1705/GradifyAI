"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PredictionResultItem } from "@/features/admissions/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)] mb-1">{d?.collegeName}</p>
      {d?.averagePackage != null && <p className="text-[var(--muted)]">Avg: <span className="text-[var(--success)]">₹{Number(d.averagePackage).toFixed(1)}L</span></p>}
      {d?.highestPackage != null && <p className="text-[var(--muted)]">Highest: <span className="text-[var(--warning)]">₹{Number(d.highestPackage).toFixed(1)}L</span></p>}
      {d?.placementRate != null && <p className="text-[var(--muted)]">Placement: <span className="text-[var(--foreground)]">{d.placementRate}%</span></p>}
    </div>
  );
};

type SortMode = "avgPackage" | "highestPackage" | "placementRate";

export function PlacementComparisonChart({ data }: { data: PredictionResultItem[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("avgPackage");
  const [showCount, setShowCount] = useState(10);

  const chartData = useMemo(() => {
    const withPlacements = data.filter((m) => m.averagePackage != null || m.highestPackage != null);
    const sorted = [...withPlacements].sort((a, b) => {
      const aVal = sortMode === "avgPackage" ? (a.averagePackage ?? 0) : sortMode === "highestPackage" ? (a.highestPackage ?? 0) : (a.placementRate ?? 0);
      const bVal = sortMode === "avgPackage" ? (b.averagePackage ?? 0) : sortMode === "highestPackage" ? (b.highestPackage ?? 0) : (b.placementRate ?? 0);
      return bVal - aVal;
    });
    return sorted.slice(0, showCount).map((m) => ({
      collegeName: m.collegeName.length > 20 ? m.collegeName.slice(0, 18) + "..." : m.collegeName,
      avgPackage: m.averagePackage ?? 0,
      highestPackage: m.highestPackage ?? 0,
      placementRate: m.placementRate ?? 0,
      tier: m.collegeTier,
      _fullName: m.collegeName,
    }));
  }, [data, sortMode, showCount]);

  if (!chartData.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Placement Comparison</h4>
          <p className="text-[10px] text-[var(--muted)]">Top colleges by package and placement rate</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {([{ key: "avgPackage", label: "Avg Pkg" }, { key: "highestPackage", label: "Highest" }, { key: "placementRate", label: "Placement %" }] as const).map((opt) => (
            <button key={opt.key} onClick={() => setSortMode(opt.key as SortMode)}
              className={`rounded px-2 py-1 text-[10px] font-medium transition ${sortMode === opt.key ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "text-[var(--muted)] border border-transparent hover:text-[var(--foreground)]"}`}
            >{opt.label}</button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 40, left: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="collegeName" tick={{ fontSize: 9, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v: number) => v >= 1 ? `₹${v.toFixed(0)}L` : `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)", fillOpacity: 0.1 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "var(--muted)" }} iconSize={8} />
            {sortMode !== "placementRate" && <Bar dataKey="avgPackage" name="Avg Package (LPA)" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={24} />}
            <Bar dataKey={sortMode === "placementRate" ? "placementRate" : "highestPackage"} name={sortMode === "placementRate" ? "Placement Rate (%)" : "Highest Package (LPA)"} fill={sortMode === "placementRate" ? "var(--success)" : "var(--warning)"} radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button onClick={() => setShowCount(showCount === 10 ? 20 : 10)} className="text-[10px] text-[var(--primary)] hover:underline">
          Show {showCount === 10 ? "20" : "10"} colleges
        </button>
        <span className="text-[10px] text-[var(--muted)]">{chartData.filter((d) => d.avgPackage > 0).length} with data</span>
      </div>
    </motion.div>
  );
}
