"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { PredictionResultItem } from "@/features/admissions/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)]">{d?.name}</p>
      <p className="text-[var(--muted)]">{d?.value} college{d?.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export function BranchPopularityChart({ data }: { data: PredictionResultItem[] }) {
  const chartData = useMemo(() => {
    const counts = new Map<string, { count: number; avgPackage: number }>();
    data.forEach((m) => {
      const existing = counts.get(m.branchCode) || { count: 0, avgPackage: 0 };
      existing.count += 1;
      existing.avgPackage += m.averagePackage ?? 0;
      counts.set(m.branchCode, existing);
    });
    return [...counts.entries()]
      .map(([code, info]) => ({
        code,
        name: code,
        value: info.count,
        avgPackage: info.count > 0 ? +(info.avgPackage / info.count).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [data]);

  if (!chartData.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">Branch Popularity</h4>
        <p className="text-[10px] text-[var(--muted)]">Most available branches across colleges</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis type="category" dataKey="code" tick={{ fontSize: 10, fill: "var(--foreground)" }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)", fillOpacity: 0.1 }} />
            <Bar dataKey="value" fill="var(--accent)" radius={[0, 3, 3, 0]} maxBarSize={20}>
              {chartData.map((_, i) => (
                <rect key={i} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
