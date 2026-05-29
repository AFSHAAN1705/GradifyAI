"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { PredictionResultItem } from "@/features/admissions/types";

const TIER_COLORS: Record<string, string> = {
  "Tier 1": "#f59e0b",
  "Tier 1.5": "#10b981",
  "Tier 2": "#3b82f6",
  "Tier 2.5": "#8b5cf6",
  "Tier 3": "#71717a",
};

const TierTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)]">{d.name}</p>
      <p className="text-[var(--muted)]">{d.value} college{d.value !== 1 ? "s" : ""} ({d.percent}%)</p>
    </div>
  );
};

export function TierVisualization({ data }: { data: PredictionResultItem[] }) {
  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    data.forEach((m) => {
      const tier = m.collegeTier || "Tier 3";
      counts.set(tier, (counts.get(tier) || 0) + 1);
    });
    const tierOrder = ["Tier 1", "Tier 1.5", "Tier 2", "Tier 2.5", "Tier 3"];
    return tierOrder
      .filter((t) => counts.has(t))
      .map((name) => ({
        name,
        value: counts.get(name) ?? 0,
        percent: ((counts.get(name) ?? 0) / data.length * 100).toFixed(1),
        color: TIER_COLORS[name] || "#71717a",
      }));
  }, [data]);

  if (!chartData.length) return null;

  const topTier = chartData[0];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">College Tier Distribution</h4>
        <p className="text-[10px] text-[var(--muted)]">Quality tiers based on placements, reputation & accreditation</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="h-52 w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="var(--card-bg)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<TierTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2 space-y-2">
          {chartData.map((t) => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ backgroundColor: t.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--foreground)]">{t.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{t.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)] mt-0.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${t.percent}%`, backgroundColor: t.color }} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
            Most colleges are <strong className="text-[var(--foreground)]">{topTier?.name}</strong> ({topTier?.percent}%)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
