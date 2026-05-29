"use client";

import { LineChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Trend = {
  _id: string;
  metric: string;
  year: number;
  value: number;
};

export function TrendsPanel() {
  const query = useQuery({
    queryKey: ["trends"],
    queryFn: () => apiFetch<{ trends: Trend[] }>("/api/trends")
  });

  const trends = query.data?.trends ?? [];
  const max = Math.max(...trends.map((trend) => trend.value), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <LineChart className="h-5 w-5 text-[var(--primary)]" />
          <div>
            <h2 className="text-lg font-semibold">Trends</h2>
            <p className="text-sm text-[var(--muted)]">MongoDB-backed trend summaries</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {!query.isLoading && !trends.length ? (
          <p className="text-sm text-[var(--muted)]">No trends are available yet.</p>
        ) : null}
        <div className="grid gap-3">
          {trends.slice(0, 5).map((trend) => (
            <div key={trend._id} className="grid gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{trend.metric}</span>
                <span className="text-[var(--muted)]">{trend.year}</span>
              </div>
              <div className="h-2 rounded-full bg-[#e6ebf2]">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${(trend.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
