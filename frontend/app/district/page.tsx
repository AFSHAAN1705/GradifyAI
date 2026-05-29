"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Building2, Search, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

export default function DistrictsPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ districts: string[] }>("/api/districts");
        setDistricts(data.districts.sort());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchDistricts();
  }, []);

  const filtered = districts.filter((d) => d.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Explore Districts</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{districts.length} districts in Karnataka</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
          placeholder="Search districts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((district) => (
          <Link key={district} href={`/district/${encodeURIComponent(district)}`}>
            <article className="rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--primary)] hover:bg-[var(--card-hover)] h-full">
              <MapPin className="h-5 w-5 text-[var(--primary)] mb-2" />
              <h3 className="text-sm font-semibold">{district}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">View colleges &rarr;</p>
            </article>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
          <MapPin className="h-8 w-8 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">No districts found</p>
        </div>
      )}
    </main>
  );
}