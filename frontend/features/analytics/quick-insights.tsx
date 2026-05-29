"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, ShieldCheck, Zap, Star, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { PredictionResultItem } from "@/features/admissions/types";

const INSIGHT_CONFIGS = [
  { match: (s: number) => s >= 85, icon: Star, text: "Excellent placement-focused option with top-tier outcomes.", color: "var(--warning)" },
  { match: (s: number) => s >= 70, icon: TrendingUp, text: "Strong academic reputation with competitive placements.", color: "var(--success)" },
  { match: (s: number) => s >= 55, icon: ShieldCheck, text: "Good backup option with decent placement record.", color: "var(--primary)" },
  { match: (s: number) => s >= 40, icon: Zap, text: "Decent option with satisfactory outcomes for moderate ranks.", color: "var(--accent)" },
  { match: (s: number) => s < 40, icon: Lightbulb, text: "Suitable safe option with high admission probability.", color: "var(--muted)" },
];

export function QuickInsights({ data }: { data: PredictionResultItem[] }) {
  const insights = useMemo(() => {
    return data.slice(0, 100).map((m) => {
      const config = INSIGHT_CONFIGS.find((c) => c.match(m.qualityScore)) || INSIGHT_CONFIGS[INSIGHT_CONFIGS.length - 1];
      return { text: config.text, icon: config.icon, color: config.color, name: m.collegeName, tier: m.collegeTier };
    });
  }, [data]);

  if (!data.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Quick Insights</h4>
          <p className="text-[10px] text-[var(--muted)]">AI-generated summary for top colleges</p>
        </div>
      </div>
      <div className="grid gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {insights.slice(0, 20).map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--card-hover)] transition"
          >
            <insight.icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: insight.color }} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--foreground)] truncate">{insight.name}</p>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">{insight.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
