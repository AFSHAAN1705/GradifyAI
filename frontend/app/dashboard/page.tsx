"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, Bot, BarChart3, BookmarkCheck, History, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/components/auth-provider";

type SavedPrediction = {
  _id: string;
  examRank: number;
  categoryCode: string;
  preferredCity?: string;
  branchCodes: string[];
  status: string;
  createdAt: string;
};

type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export default function DashboardPage() {
  const { user, isLoading } = useProtectedRoute();
  const { logout } = useAuthStore();
  const [predictions, setPredictions] = useState<SavedPrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPredictions = async () => {
      try {
        const data = await apiFetch<PaginatedResult<SavedPrediction>>("/api/admin/predictions?limit=10");
        setPredictions(data.data);
      } catch {
        // User predictions endpoint may vary
      } finally {
        setLoadingPredictions(false);
      }
    };
    fetchPredictions();
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-r-transparent"></div>
          <p className="text-[var(--muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-[var(--muted)]">
          Welcome back, {user?.name || user?.email || "Student"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/">
          <Card className="cursor-pointer transition hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted)]">New Prediction</p>
                  <p className="text-lg font-semibold mt-1">Generate Strategy</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Saved Strategies</p>
                <p className="text-2xl font-semibold mt-1">{predictions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <BookmarkCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">AI Counselling</p>
                <p className="text-lg font-semibold mt-1">Ask AI</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--success)]/10 text-[var(--success)]">
                <Bot className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {user?.role === "ADMIN" && (
          <Link href="/admin">
            <Card className="cursor-pointer transition hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted)]">Admin Panel</p>
                    <p className="text-lg font-semibold mt-1">Manage Data</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-lg font-semibold">Prediction History</h2>
              <p className="text-sm text-[var(--muted)]">Your saved KCET counselling simulations</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPredictions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
              <p className="text-[var(--muted)]">No saved predictions yet</p>
              <Link href="/">
                <Button className="mt-4">Generate Your First Strategy</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.045)]">
                  <div>
                    <p className="font-semibold">Rank {p.examRank.toLocaleString()} - {p.categoryCode}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {p.preferredCity || "Any city"} | {p.branchCodes?.slice(0, 3).join(", ") || "All branches"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--muted)]">
                    <p>{new Date(p.createdAt).toLocaleDateString()}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      p.status === "SAVED" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--muted)]/10 text-[var(--muted)]"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
