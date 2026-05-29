"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Award, Home, DollarSign, TrendingUp,
  Check, X, BookOpen, Users, School, BadgeCheck, Target, BarChart3,
  GraduationCap, Star
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type ComparisonItem = {
  id: string;
  code: string;
  name: string;
  city: string;
  district: string;
  autonomous: boolean;
  naacGrade: string;
  hostelAvailable: boolean;
  campusType: string;
  campusSize: string;
  website: string;
  branches: string[];
  totalBranches: number;
  placementDetails: {
    placementPercentage: number | null;
    averagePackage: number | null;
    medianPackage: number | null;
    highestPackage: number | null;
    placementScore: number | null;
    roiScore: number | null;
    topRecruiters: string[];
  };
  fees: {
    tuition: number | null;
    hostelFees: number | null;
  };
  rankings: {
    nirfRank: number | null;
    naacGrade: string;
    nbaAccreditation: boolean;
    stateRank: number | null;
  };
  studentLife: {
    codingCultureScore: number | null;
    campusLifeScore: number | null;
  };
  verifiedBadge: boolean;
};

export default function ComparePage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get("ids") ?? "";
  const [data, setData] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ids) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiFetch<{ comparison: ComparisonItem[] }>(
          `/api/college-intelligence/compare?ids=${ids}`
        );
        setData(result.comparison);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load comparison");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [ids]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      </main>
    );
  }

  if (!ids) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-center">
        <Building2 className="mx-auto h-16 w-16 text-[var(--muted)] mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Compare Colleges</h1>
        <p className="text-[var(--muted)] mb-6">Select colleges from the home page to compare them side by side.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </main>
    );
  }

  if (error || data.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-center">
        <Building2 className="mx-auto h-16 w-16 text-[var(--muted)] mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Comparison failed</h1>
        <p className="text-[var(--muted)] mb-6">{error || "Colleges not found"}</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </main>
    );
  }

  function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
    return (
      <td className={`p-3 text-xs border-r border-[var(--border)] last:border-r-0 ${highlight ? "bg-[rgba(88,166,255,0.05)]" : ""}`}>
        {children}
      </td>
    );
  }

  function YesNo({ value }: { value: boolean }) {
    return value ? <Check className="h-4 w-4 text-[var(--success)]" /> : <X className="h-4 w-4 text-[var(--danger)]" />;
  }

  const bestPlacement = Math.max(...data.map((c) => c.placementDetails.placementPercentage ?? 0));
  const bestPackage = Math.max(...data.map((c) => c.placementDetails.averagePackage ?? 0));
  const bestNirf = Math.min(...data.map((c) => c.rankings.nirfRank ?? Infinity));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">College Comparison</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Comparing {data.length} colleges side by side</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-3 text-left text-xs font-semibold text-[var(--muted)] w-40">Metric</th>
              {data.map((college) => (
                <th key={college.id} className="p-3 text-left text-xs font-semibold border-r border-[var(--border)] last:border-r-0">
                  <Link href={`/college/${college.id}`} className="text-[var(--primary)] hover:underline">
                    {college.name}
                  </Link>
                  <p className="text-[10px] text-[var(--muted)] font-normal mt-0.5">{college.code} &middot; {college.city}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Basic Info */}
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">City</td>
              {data.map((c) => <Cell key={c.id}>{c.city}, {c.district}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Autonomous</td>
              {data.map((c) => <Cell key={c.id}><YesNo value={c.autonomous} /></Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">NAAC Grade</td>
              {data.map((c) => <Cell key={c.id}>{c.naacGrade || "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Branches</td>
              {data.map((c) => <Cell key={c.id}>{c.totalBranches} ({c.branches.slice(0, 5).join(", ")}{c.branches.length > 5 ? "..." : ""})</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Campus</td>
              {data.map((c) => <Cell key={c.id}>{c.campusType}{c.campusSize ? ` (${c.campusSize})` : ""}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Hostel</td>
              {data.map((c) => <Cell key={c.id}><YesNo value={c.hostelAvailable} /></Cell>)}
            </tr>

            {/* Rankings */}
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
              <td className="p-3 text-xs font-semibold" colSpan={data.length + 1}>Rankings & Accreditation</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">NIRF Rank</td>
              {data.map((c) => <Cell key={c.id} highlight={c.rankings.nirfRank === bestNirf}>{c.rankings.nirfRank ? `#${c.rankings.nirfRank}` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">NBA Accredited</td>
              {data.map((c) => <Cell key={c.id}><YesNo value={c.rankings.nbaAccreditation} /></Cell>)}
            </tr>

            {/* Placements */}
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
              <td className="p-3 text-xs font-semibold" colSpan={data.length + 1}>Placements</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Placement %</td>
              {data.map((c) => <Cell key={c.id} highlight={c.placementDetails.placementPercentage === bestPlacement}>{c.placementDetails.placementPercentage != null ? `${c.placementDetails.placementPercentage}%` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Average Package</td>
              {data.map((c) => <Cell key={c.id} highlight={c.placementDetails.averagePackage === bestPackage}>{c.placementDetails.averagePackage != null ? `₹${c.placementDetails.averagePackage.toFixed(1)}L` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Median Package</td>
              {data.map((c) => <Cell key={c.id}>{c.placementDetails.medianPackage != null ? `₹${c.placementDetails.medianPackage.toFixed(1)}L` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Highest Package</td>
              {data.map((c) => <Cell key={c.id}>{c.placementDetails.highestPackage != null ? `₹${c.placementDetails.highestPackage.toFixed(1)}L` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Placement Score</td>
              {data.map((c) => <Cell key={c.id}>{c.placementDetails.placementScore != null ? `${c.placementDetails.placementScore}/100` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">ROI Score</td>
              {data.map((c) => <Cell key={c.id}>{c.placementDetails.roiScore != null ? `${c.placementDetails.roiScore}/100` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Verified Badge</td>
              {data.map((c) => <Cell key={c.id}>{c.verifiedBadge ? <BadgeCheck className="h-4 w-4 text-[var(--success)]" /> : "No"}</Cell>)}
            </tr>

            {/* Fees */}
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
              <td className="p-3 text-xs font-semibold" colSpan={data.length + 1}>Fees</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Tuition</td>
              {data.map((c) => <Cell key={c.id}>{c.fees.tuition != null ? `₹${c.fees.tuition.toLocaleString()}` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Hostel Fees</td>
              {data.map((c) => <Cell key={c.id}>{c.fees.hostelFees != null ? `₹${c.fees.hostelFees.toLocaleString()}` : "N/A"}</Cell>)}
            </tr>

            {/* Student Life */}
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
              <td className="p-3 text-xs font-semibold" colSpan={data.length + 1}>Student Life</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Coding Culture</td>
              {data.map((c) => <Cell key={c.id}>{c.studentLife.codingCultureScore != null ? `${c.studentLife.codingCultureScore}/100` : "N/A"}</Cell>)}
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Campus Life</td>
              {data.map((c) => <Cell key={c.id}>{c.studentLife.campusLifeScore != null ? `${c.studentLife.campusLifeScore}/100` : "N/A"}</Cell>)}
            </tr>

            {/* Recruiters */}
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
              <td className="p-3 text-xs font-semibold" colSpan={data.length + 1}>Recruiters</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-xs font-medium text-[var(--muted)]">Top Recruiters</td>
              {data.map((c) => (
                <Cell key={c.id}>
                  <div className="flex flex-wrap gap-1">
                    {(c.placementDetails.topRecruiters ?? []).slice(0, 6).map((r, i) => (
                      <span key={i} className="rounded bg-[rgba(63,185,80,0.08)] px-1.5 py-0.5 text-[10px] text-[var(--success)]">{r}</span>
                    ))}
                  </div>
                </Cell>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
          Back to college directory
        </Link>
      </div>
    </main>
  );
}