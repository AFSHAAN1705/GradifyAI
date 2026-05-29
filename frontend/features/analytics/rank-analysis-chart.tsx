"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Area, ComposedChart, Legend
} from "recharts";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PredictionResultItem } from "@/features/admissions/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)] mb-1">{d?.collegeName}</p>
      <p className="text-[var(--muted)]">{d?.branchCode} &middot; Rank: <span className="text-[var(--foreground)]">{d?.rankClose?.toLocaleString()}</span></p>
      <p className="text-[var(--muted)]">Gap: <span className={d?.rankGap >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>{d?.rankGap >= 0 ? "+" : ""}{d?.rankGap?.toLocaleString()}</span></p>
    </div>
  );
};

export function RankAnalysisChart({ data, userRank }: { data: PredictionResultItem[]; userRank: number }) {
  const [chartType, setChartType] = useState<"all" | "top30">("top30");

  const chartData = useMemo(() => {
    const items = chartType === "top30" ? data.slice(0, 30) : data;
    return items.map((m, i) => ({
      index: i + 1,
      rankClose: m.rankClose,
      collegeName: m.collegeName,
      branchCode: m.branchCode,
      rankGap: m.rankGap,
      tier: m.tier,
      fill: m.tier === "safe" ? "var(--success)" : m.tier === "moderate" ? "var(--primary)" : m.tier === "competitive" ? "var(--warning)" : "var(--danger)"
    }));
  }, [data, chartType]);

  if (!data.length) return null;

  const maxRank = Math.max(...chartData.map((d) => d.rankClose), userRank);
  const minRank = Math.min(...chartData.map((d) => d.rankClose), userRank);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Rank Analysis</h4>
          <p className="text-[10px] text-[var(--muted)]">Your rank vs college cutoff comparison</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setChartType("top30")} className={`rounded px-2 py-1 text-[10px] font-medium transition ${chartType === "top30" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "text-[var(--muted)] border border-transparent hover:text-[var(--foreground)]"}`}>Top 30</button>
          <button onClick={() => setChartType("all")} className={`rounded px-2 py-1 text-[10px] font-medium transition ${chartType === "all" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "text-[var(--muted)] border border-transparent hover:text-[var(--foreground)]"}`}>All</button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="index" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis domain={[Math.max(1, minRank - 5000), maxRank + 5000]} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />

            {/* Safe zone */}
            <ReferenceLine y={userRank + 10000} stroke="transparent" />
            <Area type="monotone" dataKey="rankClose" stroke="none" fill="var(--success)" fillOpacity={0.04} />

            <ReferenceLine y={userRank} stroke="var(--primary)" strokeDasharray="6 4" strokeWidth={2} label={{ value: "Your Rank", position: "insideTopRight", fontSize: 10, fill: "var(--primary)" }} />

            <Line type="monotone" dataKey="rankClose" stroke="var(--foreground)" strokeWidth={1.5} dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (!cx) return null;
              return (
                <svg x={cx - 5} y={cy - 5} width={10} height={10}>
                  <circle cx={5} cy={5} r={4} fill={payload.fill || "var(--foreground)"} stroke="var(--card-bg)" strokeWidth={1.5} />
                </svg>
              );
            }} activeDot={{ r: 5, stroke: "var(--card-bg)", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--muted)]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Safe</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--primary)]" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--warning)]" /> Competitive</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--danger)]" /> Dream</span>
      </div>
    </motion.div>
  );
}
