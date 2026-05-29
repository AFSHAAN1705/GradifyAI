"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Target, Sparkles, GraduationCap, MapPin, IndianRupee, Building, Award, Users, Star } from "lucide-react";
import type { Recommendation } from "./chat-store";

type VisualCardData = {
  dream?: number;
  competitive?: number;
  moderate?: number;
  safe?: number;
  successRate?: number;
  avgConfidence?: number;
  rank?: number;
  tierDistribution?: Record<string, number>;
  placements?: Array<{ name: string; avgPackage: number; highestPackage: number }>;
};

function RankMeter({ rank }: { rank: number }) {
  const pct = Math.min(100, Math.max(0, ((200000 - rank) / 200000) * 100));
  const color = rank <= 10000 ? "var(--success)" : rank <= 50000 ? "var(--primary)" : rank <= 100000 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="rounded-lg border border-[var(--border)] p-3 my-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[var(--foreground)]">Rank Opportunity</span>
        <span className="text-xs font-bold" style={{ color }}>#{rank?.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, var(--primary))` }}
        />
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-1">
        {rank <= 10000 ? "Excellent rank — top colleges within reach" :
         rank <= 50000 ? "Good rank — many quality options available" :
         rank <= 100000 ? "Fair rank — focus on safe and moderate choices" :
         "Competitive rank — broaden preferences for best outcomes"}
      </p>
    </div>
  );
}

function ProbabilityCard({ successRate, total }: { successRate: number; total: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 my-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-xs font-medium text-[var(--foreground)]">Admission Probability</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold" style={{ color: successRate >= 60 ? "var(--success)" : successRate >= 30 ? "var(--warning)" : "var(--danger)" }}>
          {successRate}%
        </span>
        <span className="text-[10px] text-[var(--muted)] mb-1">based on {total} matches</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border)] mt-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${successRate}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full"
          style={{
            background: successRate >= 60
              ? "linear-gradient(90deg, var(--success), var(--primary))"
              : "linear-gradient(90deg, var(--warning), var(--primary))"
          }}
        />
      </div>
    </div>
  );
}

function TierDonut({ distribution }: { distribution: Record<string, number> }) {
  const colors: Record<string, string> = {
    "Tier 1": "#f59e0b", "Tier 1.5": "#10b981",
    "Tier 2": "#3b82f6", "Tier 2.5": "#8b5cf6", "Tier 3": "#71717a"
  };
  const entries = Object.entries(distribution);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="rounded-lg border border-[var(--border)] p-3 my-2">
      <p className="text-xs font-medium text-[var(--foreground)] mb-2">Tier Distribution</p>
      <div className="space-y-1.5">
        {entries.map(([tier, count]) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors[tier] || "#71717a" }} />
            <span className="text-[11px] text-[var(--foreground)] flex-1">{tier}</span>
            <span className="text-[10px] text-[var(--muted)]">{count}</span>
            <div className="h-1.5 w-16 rounded-full bg-[var(--border)] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: colors[tier] || "#71717a" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementMiniChart({ data }: { data: Array<{ name: string; avgPackage: number; highestPackage: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.highestPackage), 1);

  return (
    <div className="rounded-lg border border-[var(--border)] p-3 my-2">
      <p className="text-xs font-medium text-[var(--foreground)] mb-2">Placement Comparison</p>
      <div className="space-y-2">
        {data.slice(0, 5).map((d) => (
          <div key={d.name}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-[var(--muted)] truncate max-w-32">{d.name}</span>
              <span className="font-medium">₹{d.avgPackage.toFixed(1)}L</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.highestPackage / maxVal) * 100}%` }}
                className="h-full rounded-full bg-[var(--primary)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recommendation Cards ──────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  "Tier 1": "#f59e0b",
  "Tier 1.5": "#10b981",
  "Tier 2": "#3b82f6",
  "Tier 2.5": "#8b5cf6",
  "Tier 3": "#71717a",
};

function RecommendationCards({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations?.length) return null;

  return (
    <div className="space-y-2 my-2">
      <p className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
        <Star className="h-3 w-3 text-[var(--accent)]" />
        Top Recommendations
      </p>
      <div className="grid gap-2">
        {recommendations.slice(0, 4).map((rec, i) => (
          <motion.div
            key={`${rec.college}-${rec.branch}-${i}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--primary)]/30 transition shadow-sm"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                  <span className="text-[12px] font-semibold text-[var(--foreground)] truncate">{rec.college}</span>
                  <span className="text-[9px] text-[var(--muted)]">[{rec.code}]</span>
                </div>
                <span className="text-[10px] text-[var(--muted)]">{rec.branch}</span>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{
                  backgroundColor: `${TIER_COLORS[rec.tier] || "#71717a"}20`,
                  color: TIER_COLORS[rec.tier] || "#71717a",
                  border: `1px solid ${TIER_COLORS[rec.tier] || "#71717a"}40`,
                }}
              >
                {rec.tier}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-lg bg-[var(--background)] p-1.5 text-center">
                <p className="text-[8px] text-[var(--muted)]">Cutoff</p>
                <p className="text-[10px] font-semibold text-[var(--foreground)]">#{rec.cutoff?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-1.5 text-center">
                <p className="text-[8px] text-[var(--muted)]">Avg Pkg</p>
                <p className="text-[10px] font-semibold text-[var(--foreground)]">
                  {rec.avgPackage ? `₹${rec.avgPackage.toFixed(1)}L` : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--background)] p-1.5 text-center">
                <p className="text-[8px] text-[var(--muted)]">Placed</p>
                <p className="text-[10px] font-semibold text-[var(--foreground)]">
                  {rec.placementPct ? `${rec.placementPct}%` : "N/A"}
                </p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rec.confidence}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                />
              </div>
              <span className="text-[9px] text-[var(--muted)] shrink-0">{rec.confidence}% match</span>
            </div>

            {rec.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {rec.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[8px] text-[var(--muted)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Strategy Cards ────────────────────────────────────────────────────────────

type Strategy = {
  round: number;
  label: string;
  choices: Array<{
    college: string;
    branch: string;
    reason: string;
  }>;
  risk: "low" | "medium" | "high";
};

function StrategyCards({ strategies }: { strategies: Strategy[] }) {
  if (!strategies?.length) return null;

  return (
    <div className="space-y-2 my-2">
      <p className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
        <Target className="h-3 w-3 text-[var(--accent)]" />
        Counselling Strategy
      </p>
      {strategies.map((s) => (
        <motion.div
          key={s.round}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--foreground)]">{s.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${
                s.risk === "low"
                  ? "bg-[rgba(63,185,80,0.12)] text-[var(--success)]"
                  : s.risk === "medium"
                  ? "bg-[rgba(245,158,11,0.12)] text-[var(--warning)]"
                  : "bg-[rgba(248,81,73,0.12)] text-[var(--danger)]"
              }`}
            >
              {s.risk.toUpperCase()} risk
            </span>
          </div>
          <div className="space-y-1.5">
            {s.choices.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[8px] font-bold text-[var(--primary)]">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-[var(--foreground)]">{c.college}</span>{" "}
                  <span className="text-[9px] text-[var(--muted)]">{c.branch}</span>
                  <p className="text-[8px] text-[var(--muted)] mt-0.5">{c.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable({ colleges }: { colleges: Array<Record<string, unknown>> }) {
  if (!colleges?.length) return null;

  const fields = [
    { key: "name", label: "College", icon: Building },
    { key: "district", label: "Location", icon: MapPin },
    { key: "naacGrade", label: "NAAC", icon: Award },
    { key: "avgPackage", label: "Avg Package", icon: IndianRupee, format: (v: unknown) => v ? `₹${Number(v).toFixed(1)}L` : "N/A" },
    { key: "placementPct", label: "Placement %", icon: Users, format: (v: unknown) => v ? `${v}%` : "N/A" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden my-2">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[var(--surface)]">
              {fields.map((f) => (
                <th key={f.key} className="px-2.5 py-2 text-left font-medium text-[var(--muted)]">
                  <div className="flex items-center gap-1">
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--card-hover)]">
                {fields.map((f) => (
                  <td key={f.key} className="px-2.5 py-2 text-[var(--foreground)]">
                    {f.format ? f.format(c[f.key]) : String(c[f.key] || "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Action Buttons ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: "compare", label: "Compare Colleges", icon: Target },
  { id: "strategy", label: "Generate Strategy", icon: Sparkles },
  { id: "best", label: "Best For My Rank", icon: TrendingUp },
  { id: "upgrade", label: "Round 2 Chances", icon: ShieldCheck },
  { id: "placement", label: "Placement Analysis", icon: TrendingUp },
  { id: "branch", label: "Branch Comparison", icon: Target },
  { id: "option-list", label: "Build Option Entry", icon: Sparkles },
];

function ActionButtons({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 my-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition flex items-center gap-1"
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}

export {
  RankMeter, ProbabilityCard, TierDonut, PlacementMiniChart,
  RecommendationCards, StrategyCards, ComparisonTable,
  ActionButtons, QUICK_ACTIONS,
};
