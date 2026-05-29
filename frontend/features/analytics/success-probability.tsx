"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShieldCheck, Target, Zap } from "lucide-react";
import { useMemo } from "react";
import type { PredictionResultItem } from "@/features/admissions/types";

export function SuccessProbability({ data, userRank }: { data: PredictionResultItem[]; userRank: number }) {
  const stats = useMemo(() => {
    const total = data.length;
    const dream = data.filter((m) => m.tier === "dream").length;
    const competitive = data.filter((m) => m.tier === "competitive").length;
    const moderate = data.filter((m) => m.tier === "moderate").length;
    const safe = data.filter((m) => m.tier === "safe").length;
    const successRate = total > 0 ? Math.round(((moderate + safe) / total) * 100) : 0;
    const avgConfidence = total > 0 ? Math.round(data.reduce((s, m) => s + m.confidenceScore, 0) / total) : 0;
    return { total, dream, competitive, moderate, safe, successRate, avgConfidence };
  }, [data]);

  if (!stats.total) return null;

  const cards = [
    { label: "Dream Colleges", value: stats.dream, icon: Target, color: "var(--danger)", bg: "rgba(248,81,73,0.1)" },
    { label: "Competitive", value: stats.competitive, icon: Zap, color: "var(--warning)", bg: "rgba(210,153,34,0.1)" },
    { label: "Moderate Chance", value: stats.moderate, icon: TrendingUp, color: "var(--primary)", bg: "rgba(88,166,255,0.1)" },
    { label: "Safe Bets", value: stats.safe, icon: ShieldCheck, color: "var(--success)", bg: "rgba(63,185,80,0.1)" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">AI Counselling Dashboard</h4>
          <p className="text-[10px] text-[var(--muted)]">Personalized admission probability analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {cards.map((card) => (
          <motion.div key={card.label} whileHover={{ scale: 1.02 }} className="rounded-lg border border-[var(--border)] p-3 text-center transition hover:border-[var(--primary)]/30">
            <card.icon className="h-4 w-4 mx-auto mb-1" style={{ color: card.color }} />
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-[10px] text-[var(--muted)]">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--border)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--foreground)]">Overall Success Probability</span>
          <span className="text-xs font-bold" style={{ color: stats.successRate >= 60 ? "var(--success)" : stats.successRate >= 30 ? "var(--warning)" : "var(--danger)" }}>
            {stats.successRate}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.successRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: stats.successRate >= 60
                ? "linear-gradient(90deg, var(--success), var(--primary))"
                : stats.successRate >= 30
                ? "linear-gradient(90deg, var(--warning), var(--primary))"
                : "linear-gradient(90deg, var(--danger), var(--warning))"
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--muted)]">
          <span>{stats.total} total matches</span>
          <span>Avg confidence: {stats.avgConfidence}%</span>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-[var(--muted)] italic leading-relaxed">
        {stats.successRate >= 70
          ? "Strong position. You have a high probability of securing a seat. Consider targeting a few dream options."
          : stats.successRate >= 40
          ? "Balanced position. You have moderate options. Broaden branch preferences to improve chances."
          : "Competitive position. Consider expanding district preferences and adding more branches."}
      </div>
    </motion.div>
  );
}
