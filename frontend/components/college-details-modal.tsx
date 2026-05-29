"use client";

import { useEffect, useState } from "react";
import {
  X, Building2, MapPin, Briefcase, BookOpen, TrendingUp, Globe,
  GraduationCap, Home, Award, School, Users, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useToastStore } from "@/components/ui/toast";

type Branch = {
  id: string;
  code: string;
  name: string;
  cutoffs: Array<{
    round: number;
    year: number;
    rankOpen: number | null;
    rankClose: number;
    category: string;
    categoryName: string;
    quota: string;
    seatType: string;
    percentile: number | null;
  }>;
};

type CollegeDetail = {
  id: string;
  code: string;
  name: string;
  city: string;
  district: string | null;
  state: string;
  website: string | null;
  autonomous: boolean;
  affiliatedTo: string | null;
  naacGrade: string | null;
  hostelAvailable: boolean;
  campusType: string | null;
  branches: Branch[];
  placements: Array<{
    academicYear: string;
    medianPackageLpa: string | null;
    averagePackageLpa: string | null;
    highestPackageLpa: string | null;
    placementRate: string | null;
    recruiters: string[];
  }>;
  stats: {
    totalBranches: number;
    totalCutoffs: number;
    totalPlacements: number;
  };
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2">
      <div className="shrink-0 text-[var(--muted)]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--muted)]">{label}</p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}

export function CollegeDetailsModal({ collegeId, isOpen, onClose }: { collegeId: string; isOpen: boolean; onClose: () => void }) {
  const toast = useToastStore((s) => s.push);
  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showAllCutoffs, setShowAllCutoffs] = useState(false);

  useEffect(() => {
    if (!isOpen || !collegeId) { setCollege(null); return; }
    const fetchCollege = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<CollegeDetail>(`/api/colleges/${collegeId}`);
        setCollege(data);
        if (data.branches.length > 0) setSelectedBranch(data.branches[0].code);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to load", type: "error" });
        onClose();
      } finally { setLoading(false); }
    };
    fetchCollege();
  }, [collegeId, isOpen, toast, onClose]);

  if (!isOpen) return null;

  const selectedBranchData = college?.branches.find((b) => b.code === selectedBranch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-bold">{loading ? "Loading..." : college?.name}</h2>
            {college && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{college.city}{college.district ? `, ${college.district}` : ""}</span>
                <span>Code: {college.code}</span>
                {college.website && <a href={college.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--primary)] hover:underline"><Globe className="h-3 w-3" />Website</a>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)]"><X className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--muted)]">Loading...</div>
        ) : college ? (
          <div className="space-y-5 p-5">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <InfoRow icon={<School />} label="Code" value={college.code} />
              <InfoRow icon={<Award />} label="NAAC" value={college.naacGrade || "N/A"} />
              <InfoRow icon={<GraduationCap />} label="Type" value={college.autonomous ? "Autonomous" : "Affiliated"} />
              <InfoRow icon={<Home />} label="Hostel" value={college.hostelAvailable ? "Yes" : "N/A"} />
              <InfoRow icon={<MapPin />} label="City" value={college.city} />
              <InfoRow icon={<Building2 />} label="Campus" value={college.campusType || "Urban"} />
              <InfoRow icon={<BookOpen />} label="Branches" value={String(college.stats.totalBranches)} />
              <InfoRow icon={<Users />} label="Placements" value={college.stats.totalPlacements > 0 ? `${college.stats.totalPlacements}y` : "N/A"} />
            </div>

            {/* Branches */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-[var(--muted)]">Branches ({college.branches.length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {college.branches.map((b) => (
                  <button key={b.code} onClick={() => setSelectedBranch(b.code)}
                    className={`rounded border px-2 py-1 text-xs font-medium transition ${
                      selectedBranch === b.code ? "border-[var(--primary)] bg-[var(--card-hover)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"
                    }`}>{b.code}</button>
                ))}
              </div>
            </div>

            {/* Cutoff Table */}
            {selectedBranchData && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-[var(--muted)]">{selectedBranchData.name} ({selectedBranchData.code}) - Cutoffs</h3>
                {selectedBranchData.cutoffs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-left text-[10px] text-[var(--muted)]">
                          <th className="pb-1.5 pr-3 font-medium">Year</th>
                          <th className="pb-1.5 pr-3 font-medium">Rd</th>
                          <th className="pb-1.5 pr-3 font-medium">Category</th>
                          <th className="pb-1.5 pr-3 font-medium">Last Closing Rank</th>
                          <th className="pb-1.5 pr-3 font-medium">Opening Rank</th>
                          <th className="pb-1.5 pr-3 font-medium">Seat Type</th>
                          <th className="pb-1.5 pr-3 font-medium">Quota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllCutoffs ? selectedBranchData.cutoffs : selectedBranchData.cutoffs.slice(0, 6))
                          .sort((a, b) => (b.year - a.year) || (b.round - a.round))
                          .map((c, i) => (
                            <tr key={i} className="border-b border-[var(--border)] last:border-0">
                              <td className="py-1.5 pr-3 font-medium">{c.year}</td>
                              <td className="py-1.5 pr-3">R{c.round}</td>
                              <td className="py-1.5 pr-3"><span className="rounded bg-[rgba(88,166,255,0.1)] px-1 py-0.5 text-[10px] text-[var(--primary)]">{c.category}</span></td>
                              <td className="py-1.5 pr-3 font-semibold">{c.rankClose.toLocaleString()}</td>
                              <td className="py-1.5 pr-3 text-[var(--muted)]">{c.rankOpen?.toLocaleString() ?? "--"}</td>
                              <td className="py-1.5 pr-3 text-[var(--muted)]">{c.seatType || "--"}</td>
                              <td className="py-1.5 pr-3 text-[var(--muted)]">{c.quota}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {selectedBranchData.cutoffs.length > 6 && (
                      <button onClick={() => setShowAllCutoffs(!showAllCutoffs)} className="mt-1 flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline">
                        {showAllCutoffs ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Show all {selectedBranchData.cutoffs.length} <ChevronDown className="h-3 w-3" /></>}
                      </button>
                    )}
                  </div>
                ) : <p className="text-xs text-[var(--muted)]">No cutoff data</p>}
              </div>
            )}

            {/* Placements */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-[var(--muted)]">Placements</h3>
              {college.placements.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {college.placements.slice(0, 4).map((p, i) => (
                    <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] font-medium text-[var(--muted)]">{p.academicYear}</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                        {p.averagePackageLpa && <div><span className="text-[10px] text-[var(--muted)]">Avg</span><p className="font-medium">{p.averagePackageLpa} LPA</p></div>}
                        {p.medianPackageLpa && <div><span className="text-[10px] text-[var(--muted)]">Median</span><p className="font-medium">{p.medianPackageLpa} LPA</p></div>}
                        {p.highestPackageLpa && <div><span className="text-[10px] text-[var(--muted)]">Highest</span><p className="font-medium text-[var(--success)]">{p.highestPackageLpa} LPA</p></div>}
                        {p.placementRate && <div><span className="text-[10px] text-[var(--muted)]">Placed</span><p className="font-medium">{p.placementRate}%</p></div>}
                      </div>
                      {p.recruiters.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.recruiters.slice(0, 4).map((r, ri) => <span key={ri} className="rounded bg-[rgba(63,185,80,0.1)] px-1.5 py-0.5 text-[10px] text-[var(--success)]">{r}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-[var(--muted)]">No placement data</p>}
            </div>
          </div>
        ) : null}

        {/* View full details link */}
        {college && (
          <div className="border-t border-[var(--border)] px-5 py-3 text-center">
            <Link href={`/college/${collegeId}`} className="text-xs text-[var(--primary)] hover:underline flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" /> View full college intelligence page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
