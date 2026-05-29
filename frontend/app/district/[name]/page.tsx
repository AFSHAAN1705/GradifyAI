"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, TrendingUp, Home, Award,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type DistrictCollege = {
  id: string;
  code: string;
  name: string;
  city: string;
  autonomous: boolean;
  naacGrade: string;
  hostelAvailable: boolean;
  campusType: string;
  branches: Array<{ code: string; name: string }>;
  latestPlacement: {
    academicYear: string;
    averagePackageLpa: string | null;
    placementRate: string | null;
  } | null;
  placementDetails: {
    averagePackage: number | null;
    placementPercentage: number | null;
    highestPackage: number | null;
  };
};

type DistrictData = {
  district: string;
  totalColleges: number;
  colleges: DistrictCollege[];
};

export default function DistrictPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const params = useParams();
  const districtName = decodeURIComponent(params.name as string);
  const [data, setData] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!districtName) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiFetch<DistrictData>(`/api/college-intelligence/district/${encodeURIComponent(districtName)}`);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load district data");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [districtName]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-center">
        <Building2 className="mx-auto h-16 w-16 text-[var(--muted)] mb-4" />
        <h1 className="text-2xl font-semibold mb-2">District not found</h1>
        <p className="text-[var(--muted)] mb-6">{error || "Could not find colleges in this district."}</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </main>
    );
  }

  const placementAvg = data.colleges.filter((c) => c.placementDetails.averagePackage != null).reduce((s, c) => s + (c.placementDetails.averagePackage ?? 0), 0);
  const placementAvgCount = data.colleges.filter((c) => c.placementDetails.averagePackage != null).length;
  const hostelCount = data.colleges.filter((c) => c.hostelAvailable).length;
  const autonomousCount = data.colleges.filter((c) => c.autonomous).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{data.district} District</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{data.totalColleges} engineering colleges</p>
      </div>

      {/* District Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <Building2 className="mx-auto h-5 w-5 text-[var(--primary)] mb-1" />
          <p className="text-xl font-bold">{data.totalColleges}</p>
          <p className="text-[10px] text-[var(--muted)]">Colleges</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <Home className="mx-auto h-5 w-5 text-[var(--success)] mb-1" />
          <p className="text-xl font-bold">{hostelCount}</p>
          <p className="text-[10px] text-[var(--muted)]">Hostel Available</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <Award className="mx-auto h-5 w-5 text-[var(--warning)] mb-1" />
          <p className="text-xl font-bold">{autonomousCount}</p>
          <p className="text-[10px] text-[var(--muted)]">Autonomous</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <DollarSign className="mx-auto h-5 w-5 text-[var(--success)] mb-1" />
          <p className="text-xl font-bold">{placementAvgCount > 0 ? `₹${(placementAvg / placementAvgCount).toFixed(1)}L` : "N/A"}</p>
          <p className="text-[10px] text-[var(--muted)]">Avg Package</p>
        </div>
      </div>

      {/* College List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.colleges.map((college) => (
          <Link key={college.id} href={`/college/${college.id}`}>
            <article className="rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--primary)] hover:bg-[var(--card-hover)] h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold leading-snug">{college.name}</h3>
                {college.autonomous && <span className="shrink-0 rounded border border-[var(--primary)] px-1 py-0.5 text-[9px] text-[var(--primary)]">AUTO</span>}
              </div>
              <p className="text-xs text-[var(--muted)]">
                {college.code} &middot; {college.city}{college.naacGrade ? ` &middot; NAAC ${college.naacGrade}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-1"><Home className="h-3 w-3" />{college.hostelAvailable ? "Hostel" : "No Hostel"}</span>
                {college.placementDetails.averagePackage != null && (
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₹{college.placementDetails.averagePackage.toFixed(1)}L</span>
                )}
                {college.placementDetails.placementPercentage != null && (
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{college.placementDetails.placementPercentage}%</span>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>

      {data.colleges.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
          <Building2 className="h-8 w-8 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">No colleges found in this district</p>
        </div>
      )}
    </main>
  );
}