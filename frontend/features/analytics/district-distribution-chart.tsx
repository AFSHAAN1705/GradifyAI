"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PredictionResultItem } from "@/features/admissions/types";

const COLORS = ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#bc8cff", "#79c0ff", "#56d364", "#e3b341", "#ff7b72", "#d2a8ff", "#7ee787", "#a5d6ff"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)]">{d.name}</p>
      <p className="text-[var(--muted)]">{d.value} college{d.value !== 1 ? "s" : ""} ({d.percent}%)</p>
    </div>
  );
};

export function DistrictDistributionChart({ data }: { data: PredictionResultItem[] }) {
  const [showAll, setShowAll] = useState(false);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    data.forEach((m) => {
      const district = m.district || m.city || "Unknown";
      counts.set(district, (counts.get(district) || 0) + 1);
    });
    const sorted = [...counts.entries()]
      .map(([name, value]) => ({ name, value, percent: ((value / data.length) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);
    return showAll ? sorted : sorted.slice(0, 8);
  }, [data, showAll]);

  if (!chartData.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">District Distribution</h4>
          <p className="text-[10px] text-[var(--muted)]">Colleges by district</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="h-52 w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card-bg)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2 space-y-1">
          {chartData.slice(0, showAll ? chartData.length : 6).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[11px] text-[var(--foreground)] flex-1 truncate">{d.name}</span>
              <span className="text-[10px] text-[var(--muted)]">{d.value}</span>
              <div className="h-1.5 w-16 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.percent}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          ))}
          {!showAll && chartData.length > 6 && (
            <button onClick={() => setShowAll(true)} className="text-[10px] text-[var(--primary)] hover:underline pt-1">Show all {chartData.length} districts</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
