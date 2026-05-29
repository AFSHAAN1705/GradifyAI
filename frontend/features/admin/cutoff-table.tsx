"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Cutoff = {
  _id: string;
  collegeId: { code: string; name: string; city: string };
  branchId: { code: string; name: string };
  categoryCode: string;
  year: number;
  round: number;
  rankClose: number;
};

export function CutoffTable() {
  const query = useQuery({
    queryKey: ["cutoffs"],
    queryFn: () => apiFetch<{ cutoffs: Cutoff[] }>("/api/cutoffs?pageSize=25&sortBy=rankClose")
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold">KCET Cutoff Intelligence Table</h2>
            <p className="text-sm text-[var(--muted)]">Sticky, searchable KEA cutoff records from MongoDB</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
            <Input className="pl-9" placeholder="Use API filters for deep search" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? <Skeleton className="h-64 w-full" /> : null}
        <div className="max-h-[520px] overflow-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--panel-strong)] text-xs uppercase text-[var(--muted)]">
              <tr>
                {["College", "Branch", "Category", "Round", "Cutoff rank", "Year"].map((heading) => (
                  <th key={heading} className="border-b border-[var(--border)] px-4 py-3">
                    <span className="inline-flex items-center gap-2">{heading}<ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(query.data?.cutoffs ?? []).map((cutoff) => (
                <tr key={cutoff._id} className="transition hover:bg-[rgba(101,228,255,0.08)]">
                  <td className="border-b border-[var(--border)] px-4 py-3">
                    <p className="font-semibold">{cutoff.collegeId?.name}</p>
                    <p className="text-xs text-[var(--muted)]">{cutoff.collegeId?.code} - {cutoff.collegeId?.city}</p>
                  </td>
                  <td className="border-b border-[var(--border)] px-4 py-3">{cutoff.branchId?.name}</td>
                  <td className="border-b border-[var(--border)] px-4 py-3">{cutoff.categoryCode}</td>
                  <td className="border-b border-[var(--border)] px-4 py-3">{cutoff.round === 3 ? "Extended" : `Round ${cutoff.round}`}</td>
                  <td className="border-b border-[var(--border)] px-4 py-3 font-semibold">{cutoff.rankClose.toLocaleString()}</td>
                  <td className="border-b border-[var(--border)] px-4 py-3">{cutoff.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
