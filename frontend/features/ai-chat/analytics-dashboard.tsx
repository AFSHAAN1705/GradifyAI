"use client";

import { motion } from "framer-motion";
import { X, TrendingUp, BarChart3, PieChart } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { useChatStore } from "./chat-store";

type AnalyticsData = {
  type: "placement" | "tier" | "cutoff" | "branch";
  title: string;
  data: Array<Record<string, unknown>>;
};

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export function AnalyticsDashboard({ data }: { data?: AnalyticsData[] }) {
  const { showAnalytics, setShowAnalytics } = useChatStore();

  if (!showAnalytics) return null;

  const defaultData: AnalyticsData[] = data || [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Analytics</span>
          </div>
          <button
            onClick={() => setShowAnalytics(false)}
            className="rounded-lg p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {defaultData.length === 0 ? (
          <div className="text-center py-6">
            <PieChart className="h-8 w-8 text-[var(--muted)] mx-auto mb-2" />
            <p className="text-[11px] text-[var(--muted)]">No analytics data yet. Ask SAM about placements, cutoffs, or tier distribution to see charts here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {defaultData.map((section, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[11px] font-medium text-[var(--foreground)] mb-2">{section.title}</p>
                {section.type === "placement" && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={section.data as Array<Record<string, string | number>>}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="avgPackage" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Package (LPA)" />
                        <Bar dataKey="highestPackage" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Highest Package (LPA)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {section.type === "tier" && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={section.data as Array<{ name: string; value: number }>}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(section.data as Array<{ name: string; value: number }>).map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px", color: "var(--muted)" }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {section.type === "cutoff" && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={section.data as Array<Record<string, string | number>>}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line type="monotone" dataKey="cutoff" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {section.type === "branch" && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={section.data as Array<Record<string, string | number>>} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "var(--muted)" }} width={60} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="colleges" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Colleges Offering" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
