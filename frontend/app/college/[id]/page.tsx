"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Briefcase, Building2, MapPin, TrendingUp, Globe,
  GraduationCap, Home, Award, School, Users,
  Phone, Mail, Calendar, Check, X, Wifi, Library, Beaker, Dumbbell,
  Coffee, Plus, Monitor, Bus, ExternalLink, Sparkles,
  Target, DollarSign, Star, Lightbulb,
  ShieldCheck, BarChart3, Scale, Ruler
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useToastStore } from "@/components/ui/toast";

type EnhancedCollegeDetail = Record<string, unknown>;

function InfoBadge({ label, value, icon }: { label: string; value: string | number | boolean | null | undefined; icon?: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2.5">
      {icon && <div className="shrink-0 text-[var(--muted)]">{icon}</div>}
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--muted)]">{label}</p>
        <p className="text-xs font-medium">{display}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-[var(--primary)]">{icon}</div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-[11px] text-[var(--muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode; color?: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 text-center">
      {icon && <div className="mx-auto mb-1 h-5 w-5" style={{ color: color ?? "var(--primary)" }}>{icon}</div>}
      <p className="text-lg font-bold" style={{ color: color ?? "var(--primary)" }}>{value}</p>
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function PlacementTrendChart({ trends }: { trends: Array<{ year: number; placementRate?: number; averagePackage?: number; highestPackage?: number }> }) {
  if (!trends.length) return null;
  const maxVal = Math.max(...trends.map((t) => Math.max(t.placementRate ?? 0, t.averagePackage ?? 0, t.highestPackage ?? 0)), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--muted)]">Year-wise Trends</p>
      <div className="grid gap-2">
        {trends.slice(0, 5).map((t) => (
          <div key={t.year} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="font-medium">{t.year}</span>
              <span className="text-[var(--muted)]">{t.placementRate ?? "--"}% placed</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--border)]">
              <div className="h-1.5 rounded-full bg-[var(--success)]" style={{ width: `${((t.placementRate ?? 0) / 100) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifiedBadge({ verified, score }: { verified: boolean; score?: number | null }) {
  if (!verified && !score) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${verified ? "bg-[rgba(63,185,80,0.1)] text-[var(--success)]" : "bg-[rgba(248,81,73,0.1)] text-[var(--danger)]"}`}>
      <ShieldCheck className="h-3 w-3" />
      {verified ? "Verified" : "Unverified"}
      {score != null && <span className="opacity-80">({score}%)</span>}
    </div>
  );
}

export default function CollegeDetailPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const toast = useToastStore((s) => s.push);
  const params = useParams();
  const collegeId = params.id as string;
  const [college, setCollege] = useState<EnhancedCollegeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showAllRecruiters, setShowAllRecruiters] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [verification, setVerification] = useState<Record<string, unknown> | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    if (!collegeId) return;
    const fetchCollege = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<EnhancedCollegeDetail>(`/api/college-intelligence/${collegeId}/enhanced`);
        setCollege(data);
        const branches = (data.branches as Array<{ code: string }>) ?? [];
        if (branches.length > 0) setSelectedBranch(branches[0].code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load college details");
      } finally { setLoading(false); }
    };
    fetchCollege();
  }, [collegeId]);

  const checkVerification = async () => {
    if (!collegeId) return;
    try {
      setCheckingVerification(true);
      const result = await apiFetch<Record<string, unknown>>(`/api/college-intelligence/${collegeId}/verify-placement`);
      setVerification(result);
    } catch { /* ignore */ }
    finally { setCheckingVerification(false); }
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (error || !college) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-center">
        <Building2 className="mx-auto h-16 w-16 text-[var(--muted)] mb-4" />
        <h1 className="text-2xl font-semibold mb-2">College not found</h1>
        <p className="text-[var(--muted)] mb-6">{error || "The requested college could not be found."}</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </main>
    );
  }

  const branches = (college.branches as Array<{ id: string; code: string; name: string }>) ?? [];
  const placements = (college.placements as Array<Record<string, unknown>>) ?? [];
  const placementDetails = college.placementDetails as Record<string, unknown> ?? {};
  const fees = college.fees as Record<string, unknown> ?? {};
  const rankings = college.rankings as Record<string, unknown> ?? {};
  const studentLife = college.studentLife as Record<string, unknown> ?? {};
  const districtData = college.districtData as Record<string, unknown> ?? {};
  const researchCenters = (college.researchCenters as string[]) ?? [];
  const industryCollaborations = (college.industryCollaborations as string[]) ?? [];
  const branchAnalytics = (college.branchAnalytics as Array<Record<string, unknown>>) ?? [];
  const reviews = (college.reviews as Array<Record<string, unknown>>) ?? [];
  const placementTrends = (placementDetails.placementTrends as Array<Record<string, number>>) ?? [];
  const topRecruiters = (placementDetails.topRecruiters as string[]) ?? [];

  const selectedBranchData = branches.find((b) => b.code === selectedBranch);
  const selectedBranchAnalytics = branchAnalytics.find((b) => b.code === selectedBranch);

  const tabs = [
    { id: "overview", label: "Overview", icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: "branches", label: "Branches", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: "placements", label: "Placements", icon: <Briefcase className="h-3.5 w-3.5" /> },
    { id: "campus", label: "Campus", icon: <Home className="h-3.5 w-3.5" /> },
    { id: "fees", label: "Fees & ROI", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: "rankings", label: "Rankings", icon: <Award className="h-3.5 w-3.5" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="h-3.5 w-3.5" /> },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to colleges
      </Link>

      {/* College Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold sm:text-3xl">{college.name as string}</h1>
              {(college.autonomous as boolean) && (
                <span className="rounded border border-[var(--primary)] px-2 py-0.5 text-[11px] text-[var(--primary)] font-medium">Autonomous</span>
              )}
              {(placementDetails.verifiedBadge as boolean) && (
                <VerifiedBadge verified={true} score={placementDetails.confidenceScore as number | null} />
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{college.city as string}{(college.district as string) ? `, ${college.district}` : ""}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />Code: {college.code as string}</span>
              {(college.establishedYear as number) && (
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Est. {college.establishedYear}</span>
              )}
              {(college.collegeType as string) && (
                <span>{college.collegeType as string}</span>
              )}
              {(college.naacGrade as string) && (
                <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />NAAC {college.naacGrade}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              {(college.website as string) && (
                <a href={college.website as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--primary)] hover:underline">
                  <Globe className="h-3 w-3" />Website
                </a>
              )}
              {(college.contactNumber as string) && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{college.contactNumber}</span>
              )}
              {(college.email as string) && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{college.email}</span>
              )}
            </div>
            {(college.address as string) && (
              <p className="mt-1.5 text-xs text-[var(--muted)]">{college.address as string}</p>
            )}
          </div>
          {(college.latitude as number) && (college.longitude as number) && (
            <a
              href={`https://maps.google.com/?q=${college.latitude},${college.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition"
            >
              <MapPin className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Branches" value={(college.stats as Record<string, number>)?.totalBranches ?? branches.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Placements" value={(college.stats as Record<string, number>)?.totalPlacements ?? placements.length > 0 ? `${placements.length}y` : "N/A"} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Placement %" value={placementDetails.placementPercentage != null ? `${placementDetails.placementPercentage}%` : null} icon={<TrendingUp className="h-5 w-5" />} color="var(--success)" />
        <StatCard label="Avg Package" value={placementDetails.averagePackage != null ? `₹${(placementDetails.averagePackage as number).toFixed(1)}L` : null} icon={<DollarSign className="h-5 w-5" />} color="var(--success)" />
      </div>

      {/* Verification Check */}
      <div className="mb-6">
        <button
          onClick={checkVerification}
          disabled={checkingVerification}
          className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {checkingVerification ? "Checking..." : verification ? `Verified: ${(verification.verificationSource as string) ?? "N/A"} (${(verification.confidenceScore as number) ?? 0}%)` : "Verify placement data authenticity"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-[var(--border)] pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Basic Info Grid */}
            <Card>
              <CardHeader><SectionHeader icon={<Building2 className="h-4 w-4" />} title="Basic Information" /></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  <InfoBadge icon={<School className="h-3.5 w-3.5" />} label="College Code" value={college.code as string} />
                  <InfoBadge icon={<MapPin className="h-3.5 w-3.5" />} label="City" value={college.city as string} />
                  <InfoBadge icon={<MapPin className="h-3.5 w-3.5" />} label="District" value={college.district as string} />
                  <InfoBadge icon={<Globe className="h-3.5 w-3.5" />} label="State" value={college.state as string} />
                  <InfoBadge icon={<Calendar className="h-3.5 w-3.5" />} label="Established" value={college.establishedYear as number} />
                  <InfoBadge icon={<GraduationCap className="h-3.5 w-3.5" />} label="Type" value={college.collegeType as string} />
                  <InfoBadge icon={<Check className="h-3.5 w-3.5" />} label="Autonomous" value={college.autonomous as boolean} />
                  <InfoBadge icon={<Building2 className="h-3.5 w-3.5" />} label="Affiliated To" value={college.affiliatedTo as string} />
                  <InfoBadge icon={<Award className="h-3.5 w-3.5" />} label="NAAC Grade" value={college.naacGrade as string} />
                  <InfoBadge icon={<Home className="h-3.5 w-3.5" />} label="Campus Type" value={college.campusType as string} />
                  <InfoBadge icon={<Ruler className="h-3.5 w-3.5" />} label="Campus Size" value={college.campusSize as string} />
                  <InfoBadge icon={<Phone className="h-3.5 w-3.5" />} label="Contact" value={college.contactNumber as string} />
                  <InfoBadge icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={college.email as string} />
                </div>
              </CardContent>
            </Card>

            {/* Placement Summary */}
            {(placementDetails.placementPercentage != null || placementDetails.averagePackage != null || placementDetails.highestPackage != null) && (
              <Card>
                <CardHeader><SectionHeader icon={<Briefcase className="h-4 w-4" />} title="Placement Summary" subtitle="Overall placement intelligence" /></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {placementDetails.placementPercentage != null && <StatCard label="Placement Rate" value={`${placementDetails.placementPercentage}%`} icon={<TrendingUp className="h-4 w-4" />} color="var(--success)" />}
                    {placementDetails.averagePackage != null && <StatCard label="Avg Package" value={`₹${(placementDetails.averagePackage as number).toFixed(1)}L`} icon={<DollarSign className="h-4 w-4" />} color="var(--success)" />}
                    {placementDetails.medianPackage != null && <StatCard label="Median Package" value={`₹${(placementDetails.medianPackage as number).toFixed(1)}L`} icon={<BarChart3 className="h-4 w-4" />} color="var(--primary)" />}
                    {placementDetails.highestPackage != null && <StatCard label="Highest Package" value={`₹${(placementDetails.highestPackage as number).toFixed(1)}L`} icon={<Target className="h-4 w-4" />} color="var(--warning)" />}
                  </div>
                  {placementDetails.placementScore != null && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Sparkles className="h-3 w-3 text-[var(--primary)]" />
                      <span>Placement Score: <strong className="text-[var(--foreground)]">{placementDetails.placementScore}/100</strong></span>
                      {placementDetails.roiScore != null && (
                        <span>ROI Score: <strong className="text-[var(--foreground)]">{placementDetails.roiScore}/100</strong></span>
                      )}
                    </div>
                  )}
                  {placementTrends.length > 0 && (
                    <div className="mt-4">
                      <PlacementTrendChart trends={placementTrends} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top Recruiters */}
            {topRecruiters.length > 0 && (
              <Card>
                <CardHeader><SectionHeader icon={<Users className="h-4 w-4" />} title="Top Recruiters" subtitle={`${topRecruiters.length} companies`} /></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(showAllRecruiters ? topRecruiters : topRecruiters.slice(0, 12)).map((r, i) => (
                      <span key={i} className="rounded-lg border border-[var(--border)] bg-[rgba(63,185,80,0.05)] px-2.5 py-1 text-[11px] font-medium text-[var(--success)]">{r}</span>
                    ))}
                    {topRecruiters.length > 12 && !showAllRecruiters && (
                      <button onClick={() => setShowAllRecruiters(true)} className="text-[11px] text-[var(--primary)] hover:underline px-2">+{topRecruiters.length - 12} more</button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Research & Innovation */}
            {(researchCenters.length > 0 || college.patents != null || college.publications != null || college.startupIncubators || college.innovationLabs || industryCollaborations.length > 0) && (
              <Card>
                <CardHeader><SectionHeader icon={<Lightbulb className="h-4 w-4" />} title="Research & Innovation" /></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {college.patents != null && <StatCard label="Patents" value={college.patents as number} icon={<Lightbulb className="h-4 w-4" />} />}
                    {college.publications != null && <StatCard label="Publications" value={college.publications as number} icon={<BookOpen className="h-4 w-4" />} />}
                    <StatCard label="Startup Incubator" value={college.startupIncubators as boolean} icon={<Building2 className="h-4 w-4" />} />
                    <StatCard label="Innovation Lab" value={college.innovationLabs as boolean} icon={<Beaker className="h-4 w-4" />} />
                  </div>
                  {researchCenters.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--muted)] mb-2">Research Centers</p>
                      <div className="flex flex-wrap gap-1.5">
                        {researchCenters.map((rc, i) => (
                          <span key={i} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">{rc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {industryCollaborations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--muted)] mb-2">Industry Collaborations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {industryCollaborations.map((ic, i) => (
                          <span key={i} className="rounded border border-[var(--primary)]/30 px-2 py-0.5 text-[11px] text-[var(--primary)]">{ic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* BRANCHES TAB */}
        {activeTab === "branches" && (
          <Card>
            <CardHeader><SectionHeader icon={<BookOpen className="h-4 w-4" />} title={`Branches (${branches.length})`} subtitle="Branch-wise cutoff & placement analytics" /></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-5">
                {branches.map((branch) => (
                  <button key={branch.code} onClick={() => setSelectedBranch(branch.code)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selectedBranch === branch.code ? "border-[var(--primary)] bg-[rgba(88,166,255,0.1)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"
                    }`}>{branch.code}</button>
                ))}
              </div>

              {selectedBranchData && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--muted)] mb-2">{selectedBranchData.name} ({selectedBranchData.code})</h3>
                    {selectedBranchAnalytics && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {selectedBranchAnalytics.averagePackage != null && (
                          <InfoBadge icon={<DollarSign className="h-3 w-3" />} label="Avg Package" value={selectedBranchAnalytics.averagePackage ? `₹${Number(selectedBranchAnalytics.averagePackage).toFixed(1)}L` : null} />
                        )}
                        {selectedBranchAnalytics.placementPercentage != null && (
                          <InfoBadge icon={<TrendingUp className="h-3 w-3" />} label="Placement %" value={`${selectedBranchAnalytics.placementPercentage}%`} />
                        )}
                        {selectedBranchAnalytics.intake != null && selectedBranchAnalytics.intake !== 0 && (
                          <InfoBadge icon={<Users className="h-3 w-3" />} label="Intake" value={selectedBranchAnalytics.intake as number} />
                        )}
                        {(selectedBranchAnalytics.recruiters as string[] ?? []).length > 0 && (
                          <InfoBadge icon={<Users className="h-3 w-3" />} label="Recruiters" value={(selectedBranchAnalytics.recruiters as string[]).length} />
                        )}
                      </div>
                    )}
                    {selectedBranchAnalytics && (selectedBranchAnalytics.topRecruiters as string[] ?? []).length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-medium text-[var(--muted)] mb-1.5">Recruiters</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedBranchAnalytics.topRecruiters as string[]).slice(0, 6).map((r, i) => (
                            <span key={i} className="rounded bg-[rgba(63,185,80,0.08)] px-1.5 py-0.5 text-[10px] text-[var(--success)]">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Branch Cutoffs from placements data */}
                  {placements.filter((p) => {
                    const bData = p as Record<string, unknown>;
                    return !bData.branchId || bData.branchId === selectedBranchData.id;
                  }).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)] mb-2">Branch Placements</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {placements.filter((p) => {
                          const bData = p as Record<string, unknown>;
                          return !bData.branchId || bData.branchId === selectedBranchData.id;
                        }).slice(0, 5).map((p, i) => {
                          const pl = p as Record<string, unknown>;
                          return (
                            <div key={i} className="rounded border border-[var(--border)] p-2.5">
                              <p className="text-[10px] font-medium text-[var(--muted)]">{pl.academicYear as string}</p>
                              <div className="grid grid-cols-2 gap-1 mt-1 text-[11px]">
                                {pl.averagePackageLpa && <span>Avg: <strong>₹{pl.averagePackageLpa}L</strong></span>}
                                {pl.placementRate && <span>Placed: <strong>{pl.placementRate}%</strong></span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Branches Table */}
              {branchAnalytics.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <p className="text-xs font-semibold text-[var(--muted)] mb-2">Branch-wise Analysis</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-[10px] text-[var(--muted)]">
                        <th className="pb-2 pr-3 font-medium">Branch</th>
                        <th className="pb-2 pr-3 font-medium">Avg Package</th>
                        <th className="pb-2 pr-3 font-medium">Placement %</th>
                        <th className="pb-2 pr-3 font-medium">Recruiters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchAnalytics.map((ba, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2 pr-3 font-medium">{ba.code as string} - {ba.name as string}</td>
                          <td className="py-2 pr-3">{ba.averagePackage != null ? `₹${Number(ba.averagePackage).toFixed(1)}L` : "--"}</td>
                          <td className="py-2 pr-3">{ba.placementPercentage != null ? `${ba.placementPercentage}%` : "--"}</td>
                          <td className="py-2 pr-3">{(ba.recruiters as string[] ?? []).length > 0 ? `${(ba.recruiters as string[]).length} companies` : "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PLACEMENTS TAB */}
        {activeTab === "placements" && (
          <div className="space-y-4">
            {/* Overall Stats */}
            {(placementDetails.placementPercentage != null || placementDetails.averagePackage != null || placementDetails.highestPackage != null) && (
              <Card>
                <CardHeader><SectionHeader icon={<Briefcase className="h-4 w-4" />} title="Placement Intelligence" subtitle="Overall placement analytics" /></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {placementDetails.placementPercentage != null && <StatCard label="Placement Rate" value={`${placementDetails.placementPercentage}%`} icon={<TrendingUp className="h-4 w-4" />} color="var(--success)" />}
                    {placementDetails.averagePackage != null && <StatCard label="Average Package" value={`₹${(placementDetails.averagePackage as number).toFixed(1)}L`} icon={<DollarSign className="h-4 w-4" />} color="var(--success)" />}
                    {placementDetails.medianPackage != null && <StatCard label="Median Package" value={`₹${(placementDetails.medianPackage as number).toFixed(1)}L`} icon={<BarChart3 className="h-4 w-4" />} color="var(--primary)" />}
                    {placementDetails.highestPackage != null && <StatCard label="Highest Package" value={`₹${(placementDetails.highestPackage as number).toFixed(1)}L`} icon={<Target className="h-4 w-4" />} color="var(--warning)" />}
                  </div>
                  {placementTrends.length > 0 && (
                    <PlacementTrendChart trends={placementTrends} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Year-wise Placement Details */}
            {placements.length > 0 && (
              <Card>
                <CardHeader><SectionHeader icon={<BarChart3 className="h-4 w-4" />} title="Year-wise Placements" subtitle={`${placements.length} years of data`} /></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {placements.slice(0, 8).map((p, i) => {
                      const pl = p as Record<string, unknown>;
                      return (
                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold">{pl.academicYear as string}</p>
                            {pl.verified && <VerifiedBadge verified={true} score={pl.confidenceScore as number | null} />}
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                            {pl.averagePackageLpa && <div><span className="text-[var(--muted)]">Avg</span><p className="font-medium">₹{pl.averagePackageLpa}L</p></div>}
                            {pl.medianPackageLpa && <div><span className="text-[var(--muted)]">Median</span><p className="font-medium">₹{pl.medianPackageLpa}L</p></div>}
                            {pl.highestPackageLpa && <div><span className="text-[var(--muted)]">Highest</span><p className="font-medium text-[var(--success)]">₹{pl.highestPackageLpa}L</p></div>}
                            {pl.placementRate && <div><span className="text-[var(--muted)]">Placement %</span><p className="font-medium">{pl.placementRate}%</p></div>}
                            {pl.totalStudents && <div><span className="text-[var(--muted)]">Total Students</span><p className="font-medium">{pl.totalStudents}</p></div>}
                            {pl.studentsPlaced && <div><span className="text-[var(--muted)]">Placed</span><p className="font-medium">{pl.studentsPlaced}</p></div>}
                            {pl.internshipPercentage != null && <div><span className="text-[var(--muted)]">Internship</span><p className="font-medium">{pl.internshipPercentage}%</p></div>}
                          </div>
                          {(pl.recruiters as string[] ?? []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(pl.recruiters as string[]).slice(0, 4).map((r, ri) => (
                                <span key={ri} className="rounded bg-[rgba(63,185,80,0.08)] px-1.5 py-0.5 text-[10px] text-[var(--success)]">{r}</span>
                              ))}
                              {(pl.recruiters as string[]).length > 4 && <span className="text-[10px] text-[var(--muted)]">+{(pl.recruiters as string[]).length - 4}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Recruiters */}
            {topRecruiters.length > 0 && (
              <Card>
                <CardHeader><SectionHeader icon={<Users className="h-4 w-4" />} title="Recruiters" subtitle={`${topRecruiters.length} companies recruited`} /></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(showAllRecruiters ? topRecruiters : topRecruiters.slice(0, 20)).map((r, i) => (
                      <span key={i} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[rgba(63,185,80,0.05)] transition">{r}</span>
                    ))}
                    {topRecruiters.length > 20 && !showAllRecruiters && (
                      <button onClick={() => setShowAllRecruiters(true)} className="text-xs text-[var(--primary)] hover:underline px-2">Show all {topRecruiters.length}</button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CAMPUS TAB */}
        {activeTab === "campus" && (
          <Card>
            <CardHeader><SectionHeader icon={<Home className="h-4 w-4" />} title="Campus & Facilities" subtitle="Infrastructure and amenities" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                <InfoBadge icon={<Ruler className="h-3.5 w-3.5" />} label="Campus Size" value={college.campusSize as string} />
                <InfoBadge icon={<Building2 className="h-3.5 w-3.5" />} label="Campus Type" value={college.campusType as string} />
                <InfoBadge icon={<Home className="h-3.5 w-3.5" />} label="Hostel Available" value={college.hostelAvailable as boolean} />
                <InfoBadge icon={<Users className="h-3.5 w-3.5" />} label="Boys Hostel" value={college.boysHostel as boolean} />
                <InfoBadge icon={<Users className="h-3.5 w-3.5" />} label="Girls Hostel" value={college.girlsHostel as boolean} />
                <InfoBadge icon={<Wifi className="h-3.5 w-3.5" />} label="WiFi" value={college.wifiAvailable as boolean} />
                <InfoBadge icon={<Library className="h-3.5 w-3.5" />} label="Library" value={college.libraryAvailable as boolean} />
                <InfoBadge icon={<Beaker className="h-3.5 w-3.5" />} label="Labs & Workshops" value={college.labsWorkshops as boolean} />
                <InfoBadge icon={<Dumbbell className="h-3.5 w-3.5" />} label="Sports" value={college.sportsFacilities as boolean} />
                <InfoBadge icon={<Coffee className="h-3.5 w-3.5" />} label="Cafeteria" value={college.cafeteria as boolean} />
                <InfoBadge icon={<Plus className="h-3.5 w-3.5" />} label="Medical" value={college.medicalFacilities as boolean} />
                <InfoBadge icon={<Monitor className="h-3.5 w-3.5" />} label="Auditorium" value={college.auditorium as boolean} />
                <InfoBadge icon={<Bus className="h-3.5 w-3.5" />} label="Transportation" value={college.transportation as boolean} />
              </div>

              {/* Campus Images */}
              {(college.campusImages as string[] ?? []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-2">Campus Gallery</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(college.campusImages as string[]).slice(0, 4).map((img, i) => (
                      <div key={i} className="aspect-video rounded-lg bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                        <img src={img} alt={`Campus ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Tour */}
              {(college.virtualTour as string) && (
                <div className="mt-4">
                  <a href={college.virtualTour as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline">
                    <ExternalLink className="h-3 w-3" /> Virtual Campus Tour
                  </a>
                </div>
              )}

              {/* Student Life */}
              {(studentLife.clubs as string[] ?? []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-2">Student Clubs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(studentLife.clubs as string[]).map((club, i) => (
                      <span key={i} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">{club}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rankings */}
              {(rankings.nirfRank != null || rankings.stateRank != null || rankings.naacGrade || rankings.nbaAccreditation) && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[var(--muted)] mb-2">Rankings & Accreditation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rankings.nirfRank != null && <InfoBadge icon={<Award className="h-3 w-3" />} label="NIRF Rank" value={rankings.nirfRank as number} />}
                    {rankings.stateRank != null && <InfoBadge icon={<Award className="h-3 w-3" />} label="State Rank" value={rankings.stateRank as number} />}
                    {rankings.naacGrade && <InfoBadge icon={<Star className="h-3 w-3" />} label="NAAC" value={rankings.naacGrade as string} />}
                    <InfoBadge icon={<Check className="h-3 w-3" />} label="NBA Accredited" value={rankings.nbaAccreditation as boolean} />
                    <InfoBadge icon={<Check className="h-3 w-3" />} label="AICTE Approved" value={rankings.aicteApproved as boolean ?? true} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FEES & ROI TAB */}
        {activeTab === "fees" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><SectionHeader icon={<DollarSign className="h-4 w-4" />} title="Fee Structure" subtitle="Tuition, hostel & other fees" /></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fees.tuition != null && <StatCard label="Tuition Fees" value={`₹${(fees.tuition as number).toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} />}
                  {fees.hostelFees != null && <StatCard label="Hostel Fees" value={`₹${(fees.hostelFees as number).toLocaleString()}`} icon={<Home className="h-4 w-4" />} />}
                  {fees.miscellaneous != null && <StatCard label="Misc Fees" value={`₹${(fees.miscellaneous as number).toLocaleString()}`} icon={<Plus className="h-4 w-4" />} />}
                </div>
                <div className="mt-4 space-y-2">
                  {fees.scholarshipInfo && <p className="text-sm"><span className="text-[var(--muted)]">Scholarships: </span>{fees.scholarshipInfo as string}</p>}
                  <InfoBadge icon={<Check className="h-3.5 w-3.5" />} label="Education Loan Support" value={fees.educationLoanSupport as boolean} />
                </div>
              </CardContent>
            </Card>

            {/* ROI */}
            {placementDetails.roiScore != null && (
              <Card>
                <CardHeader><SectionHeader icon={<Target className="h-4 w-4" />} title="Return on Investment" subtitle="Fees vs placement value analysis" /></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {placementDetails.roiScore != null && <StatCard label="ROI Score" value={`${placementDetails.roiScore}/100`} icon={<Target className="h-4 w-4" />} color="var(--success)" />}
                    {placementDetails.placementScore != null && <StatCard label="Placement Score" value={`${placementDetails.placementScore}/100`} icon={<BarChart3 className="h-4 w-4" />} color="var(--primary)" />}
                    {fees.tuition != null && (placementDetails.averagePackage as number) != null && (
                      <StatCard label="Avg vs Fees" value={`${((placementDetails.averagePackage as number) / ((fees.tuition as number) / 100000)).toFixed(1)}x`} icon={<Scale className="h-4 w-4" />} color="var(--warning)" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* RANKINGS TAB */}
        {activeTab === "rankings" && (
          <Card>
            <CardHeader><SectionHeader icon={<Award className="h-4 w-4" />} title="Rankings & Accreditation" subtitle="Official rankings and accreditations" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rankings.nirfRank != null && <StatCard label="NIRF Rank" value={`#${rankings.nirfRank}`} icon={<Award className="h-4 w-4" />} color="var(--primary)" />}
                {rankings.stateRank != null && <StatCard label="State Rank" value={`#${rankings.stateRank}`} icon={<Award className="h-4 w-4" />} />}
                {rankings.naacGrade && <StatCard label="NAAC Grade" value={rankings.naacGrade as string} icon={<Star className="h-4 w-4" />} color="var(--warning)" />}
                <StatCard label="NBA Accredited" value={rankings.nbaAccreditation ? "Yes" : "No"} icon={<Check className="h-4 w-4" />} color={rankings.nbaAccreditation ? "var(--success)" : "var(--danger)"} />
                <StatCard label="AICTE Approved" value={rankings.aicteApproved != null ? (rankings.aicteApproved ? "Yes" : "No") : "Yes"} icon={<Check className="h-4 w-4" />} color={rankings.aicteApproved != null && !rankings.aicteApproved ? "var(--danger)" : "var(--success)"} />
                {rankings.affiliatedUniversity && <InfoBadge icon={<GraduationCap className="h-3.5 w-3.5" />} label="University" value={rankings.affiliatedUniversity as string} />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <Card>
            <CardHeader>
              <SectionHeader icon={<Star className="h-4 w-4" />} title={`Student Reviews (${reviews.length})`} subtitle="What students say about this college" />
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {(showAllReviews ? reviews : reviews.slice(0, 5)).map((rv, i) => {
                    const review = rv as Record<string, unknown>;
                    return (
                      <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: review.rating as number ?? 0 }).map((_, si) => (
                              <Star key={si} className="h-3 w-3 fill-[var(--warning)] text-[var(--warning)]" />
                            ))}
                          </div>
                          <p className="text-xs font-semibold">{review.title as string}</p>
                        </div>
                        <p className="text-xs text-[var(--muted)]">{review.body as string}</p>
                      </div>
                    );
                  })}
                  {reviews.length > 5 && !showAllReviews && (
                    <button onClick={() => setShowAllReviews(true)} className="text-xs text-[var(--primary)] hover:underline">
                      Show all {reviews.length} reviews
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">No reviews yet. Be the first to review this college.</p>
              )}

              {/* Student Life Scores */}
              {(studentLife.codingCultureScore != null || studentLife.campusLifeScore != null) && (
                <div className="mt-6">
                  <p className="text-xs font-medium text-[var(--muted)] mb-3">Student Life Scores</p>
                  <div className="grid grid-cols-2 gap-3">
                    {studentLife.codingCultureScore != null && (
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <p className="text-xs text-[var(--muted)] mb-1">Coding Culture</p>
                        <div className="h-2 rounded-full bg-[var(--border)]">
                          <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${(studentLife.codingCultureScore as number)}%` }} />
                        </div>
                        <p className="text-right text-[10px] text-[var(--muted)] mt-0.5">{studentLife.codingCultureScore}/100</p>
                      </div>
                    )}
                    {studentLife.campusLifeScore != null && (
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <p className="text-xs text-[var(--muted)] mb-1">Campus Life</p>
                        <div className="h-2 rounded-full bg-[var(--border)]">
                          <div className="h-2 rounded-full bg-[var(--success)]" style={{ width: `${(studentLife.campusLifeScore as number)}%` }} />
                        </div>
                        <p className="text-right text-[10px] text-[var(--muted)] mt-0.5">{studentLife.campusLifeScore}/100</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              {(studentLife.pros as string[] ?? []).length > 0 || (studentLife.cons as string[] ?? []).length > 0 ? (
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {(studentLife.pros as string[] ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--success)] mb-2 flex items-center gap-1"><Check className="h-3 w-3" /> Pros</p>
                      <ul className="space-y-1">
                        {(studentLife.pros as string[]).map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--muted)]">
                            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[var(--success)]" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(studentLife.cons as string[] ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--danger)] mb-2 flex items-center gap-1"><X className="h-3 w-3" /> Cons</p>
                      <ul className="space-y-1">
                        {(studentLife.cons as string[]).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--muted)]">
                            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[var(--danger)]" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* District Data */}
      {(districtData.costOfLiving || districtData.connectivity) && (
        <Card className="mt-6">
          <CardHeader><SectionHeader icon={<MapPin className="h-4 w-4" />} title="District Insights" subtitle={`About ${college.district as string}`} /></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {districtData.costOfLiving && <InfoBadge icon={<DollarSign className="h-3.5 w-3.5" />} label="Cost of Living" value={districtData.costOfLiving as string} />}
              {districtData.connectivity && <InfoBadge icon={<Bus className="h-3.5 w-3.5" />} label="Connectivity" value={districtData.connectivity as string} />}
              {districtData.hostelAvailability && <InfoBadge icon={<Home className="h-3.5 w-3.5" />} label="PG/Hostel Availability" value={districtData.hostelAvailability as string} />}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}