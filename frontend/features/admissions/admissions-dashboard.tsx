"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity, Building2,
  Filter, Loader2, Search, Sparkles, TrendingUp,
  SlidersHorizontal, Scale, MapPin,
  Star, BadgeCheck, Menu, X, Moon, Sun, Monitor,
  LayoutDashboard, BarChart3, GraduationCap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastStore } from "@/components/ui/toast";
import { CollegeDetailsModal } from "@/components/college-details-modal";
import { usePredictAdmissions, useColleges, useDistricts, useCategories } from "@/features/admissions/queries";
import type { PredictionResultItem } from "@/features/admissions/types";
import { useAdmissionsStore } from "@/features/admissions/use-admissions-store";
import { predictionRequestSchema } from "@/lib/validation/admissions";
import { CategorySelect } from "@/components/ui/category-select";
import { RoundSelect } from "@/components/ui/round-select";
import { BranchSelect } from "@/components/ui/branch-select";
import {
  RankAnalysisChart, PlacementComparisonChart,
  DistrictDistributionChart, BranchPopularityChart,
  TierVisualization, SuccessProbability,
  KarnatakaMap, QuickInsights
} from "@/features/analytics";

const predictorFormSchema = z.object({
  examRank: z.coerce.number().int().positive().max(2_000_000),
  categoryCode: z.string().min(2),
  round: z.coerce.number().int().min(1).max(3).optional(),
  preferredCity: z.string().trim().optional(),
  branchCodesRaw: z.string().trim().optional(),
  save: z.boolean().default(false)
});

type PredictorFormInput = z.input<typeof predictorFormSchema>;
type PredictorFormValues = z.output<typeof predictorFormSchema>;

function toPredictionPayload(input: PredictorFormValues) {
  return predictionRequestSchema.parse({
    examRank: input.examRank,
    categoryCode: input.categoryCode,
    round: input.round,
    preferredCity: input.preferredCity || undefined,
    branchCodes: input.branchCodesRaw
      ? input.branchCodesRaw
          .split(",")
          .map((v) => v.trim().toUpperCase())
          .filter(Boolean)
      : [],
    save: input.save
  });
}

function tierClass(tier: PredictionResultItem["tier"]) {
  switch (tier) {
    case "safe": return "text-[var(--success)]";
    case "moderate": return "text-[var(--primary)]";
    case "competitive": return "text-[var(--warning)]";
    case "dream": return "text-[var(--danger)]";
  }
}

function tierBg(tier: PredictionResultItem["tier"]) {
  switch (tier) {
    case "safe": return "bg-[rgba(63,185,80,0.1)]";
    case "moderate": return "bg-[rgba(88,166,255,0.1)]";
    case "competitive": return "bg-[rgba(210,153,34,0.1)]";
    case "dream": return "bg-[rgba(248,81,73,0.1)]";
  }
}

function collegeTierColor(tier: string) {
  switch (tier) {
    case "Tier 1": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Tier 1.5": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Tier 2": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Tier 2.5": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "Tier 3": return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

const ALL_BRANCHES = [
  { code: "CSE", name: "Computer Science and Engineering" },
  { code: "ISE", name: "Information Science and Engineering" },
  { code: "CSBS", name: "Computer Science and Business Systems" },
  { code: "CSM", name: "CSE (AI & ML)" },
  { code: "CSD", name: "CSE (Data Science)" },
  { code: "AI", name: "Artificial Intelligence" },
  { code: "AI&DS", name: "Artificial Intelligence and Data Science" },
  { code: "AIML", name: "Artificial Intelligence and Machine Learning" },
  { code: "DS", name: "Data Science" },
  { code: "IOT", name: "Internet of Things" },
  { code: "CS", name: "Cyber Security" },
  { code: "RAI", name: "Robotics and Artificial Intelligence" },
  { code: "ECE", name: "Electronics and Communication Engineering" },
  { code: "EEE", name: "Electrical and Electronics Engineering" },
  { code: "EIE", name: "Electronics and Instrumentation Engineering" },
  { code: "TC", name: "Telecommunication Engineering" },
  { code: "IN", name: "Instrumentation Technology" },
  { code: "ML", name: "Medical Electronics" },
  { code: "BM", name: "Biomedical Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "CIV", name: "Civil Engineering" },
  { code: "AU", name: "Automobile Engineering" },
  { code: "AERO", name: "Aeronautical Engineering" },
  { code: "BT", name: "Biotechnology" },
  { code: "CH", name: "Chemical Engineering" },
  { code: "IE", name: "Industrial Engineering and Management" },
  { code: "MT", name: "Metallurgical Engineering" },
  { code: "MN", name: "Mining Engineering" },
  { code: "PT", name: "Petroleum Engineering" },
  { code: "TX", name: "Textile Technology" },
  { code: "FT", name: "Food Technology" },
  { code: "EV", name: "Environmental Engineering" },
  { code: "PM", name: "Polymer Science" },
  { code: "MCA", name: "Master of Computer Applications" },
  { code: "AR", name: "Architecture" },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | "amoled">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("validatorai-theme") as "dark" | "light" | "amoled" | null;
    if (stored) setTheme(stored);
  }, []);

  const cycle = () => {
    const next = theme === "dark" ? "light" : theme === "light" ? "amoled" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("validatorai-theme", next);
  };

  return (
    <button onClick={cycle} className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition" title={`Theme: ${theme}`}>
      {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : theme === "light" ? <Sun className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
    </button>
  );
}

export function AdmissionsDashboard() {
  const toast = useToastStore((state) => state.push);
  const store = useAdmissionsStore();
  const { collegeQuery, districtFilter, selectedCategory, setCollegeQuery, setDistrictFilter, setSelectedCategory, recentSearches, addRecentSearch, showAdvancedFilters, toggleAdvancedFilters, advancedFilters, setAdvancedFilter, resetAdvancedFilters, compareIds, toggleCompareId } = store;
  const collegesQuery = useColleges({
    q: collegeQuery,
    city: districtFilter,
    nirfRankMin: advancedFilters.nirfRankMin,
    nirfRankMax: advancedFilters.nirfRankMax,
    placementPctMin: advancedFilters.placementPctMin,
    hostelAvailable: advancedFilters.hostelAvailable,
    autonomous: advancedFilters.autonomous,
    avgPackageMin: advancedFilters.avgPackageMin,
    campusType: advancedFilters.campusType,
    naacGrade: advancedFilters.naacGrade,
  });
  const categoriesQuery = useCategories();
  const districtsQuery = useDistricts();
  const [branchCodes, setBranchCodes] = useState<string[]>([]);
  const prediction = usePredictAdmissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<"predictions" | "directory">("predictions");

  useEffect(() => {
    if (collegesQuery.data && collegeQuery.trim()) addRecentSearch(collegeQuery);
  }, [collegesQuery.data, collegeQuery, addRecentSearch]);

  const categories = categoriesQuery.data?.categories ?? collegesQuery.data?.categories ?? [];
  const colleges = collegesQuery.data?.colleges ?? [];
  const totalColleges = collegesQuery.data
    ? (collegesQuery.data as unknown as { meta?: { total?: number } }).meta?.total ?? colleges.length
    : 0;

  const form = useForm<PredictorFormInput, unknown, PredictorFormValues>({
    resolver: zodResolver(predictorFormSchema),
    defaultValues: {
      examRank: 25000,
      categoryCode: selectedCategory === "OPEN" ? "GM" : selectedCategory,
      round: undefined,
      preferredCity: "Bangalore",
      branchCodesRaw: "CSE, ISE, ECE, AI&DS",
      save: false
    },
    mode: "onBlur"
  });

  useEffect(() => {
    form.setValue("categoryCode", selectedCategory === "OPEN" ? "GM" : selectedCategory);
  }, [form, selectedCategory]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = { ...toPredictionPayload(values), branchCodes };
    setSelectedCategory(payload.categoryCode);
    setView("predictions");
    prediction.mutate(payload, {
      onSuccess: (result) => {
        toast({
          title: "KCET strategy generated",
          description: `${result.matches.length} real KEA cutoff paths analyzed.`,
          type: "success"
        });
      },
      onError: (error) => {
        toast({
          title: "Prediction failed",
          description: error instanceof Error ? error.message : "Upload KCET PDFs or broaden filters.",
          type: "error"
        });
      }
    });
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Top Navigation Bar */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-lg z-40">
        <div className="mx-auto flex h-12 items-center justify-between px-4 max-w-7xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <a href="/" className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-sm font-bold text-[var(--foreground)] hidden sm:inline">KCET Predictor</span>
              <span className="text-[10px] font-medium text-[var(--accent)] bg-[rgba(188,140,255,0.1)] rounded px-1.5 py-0.5">AI</span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className="w-64 rounded-lg border border-[var(--border)] bg-[var(--background)] py-1.5 pl-9 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none transition"
                placeholder="Search colleges, cities, branches..."
                value={collegeQuery}
                onChange={(e) => setCollegeQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)]" />
              {totalColleges} colleges
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {compareIds.length >= 2 && (
              <Link href={`/compare?ids=${compareIds.join(",")}`}>
                <Button variant="secondary" size="sm" className="text-[10px] h-7 px-2">
                  <Scale className="h-3 w-3 mr-1" />Compare ({compareIds.length})
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
              <button onClick={() => setView("predictions")} className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${view === "predictions" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                <LayoutDashboard className="h-3 w-3 inline mr-1" />Analytics
              </button>
              <button onClick={() => setView("directory")} className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${view === "directory" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                <Building2 className="h-3 w-3 inline mr-1" />Directory
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Prediction Form */}
        <aside className={`shrink-0 w-72 border-r border-[var(--border)] bg-[var(--surface)] overflow-y-auto ${sidebarOpen ? "fixed inset-0 z-30 mt-12 w-full" : "hidden"} lg:block lg:relative lg:mt-0`}>
          {sidebarOpen && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] lg:hidden">
              <span className="text-xs font-semibold text-[var(--foreground)]">Prediction Settings</span>
              <button onClick={() => setSidebarOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]"><X className="h-4 w-4" /></button>
            </div>
          )}
          <div className="p-3 space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--muted)]">KCET Rank</label>
              <Input inputMode="numeric" className="h-8 text-xs" {...form.register("examRank")} />
              {form.formState.errors.examRank && (
                <p className="mt-0.5 text-[10px] text-[var(--danger)]">{form.formState.errors.examRank.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--muted)]">Category</label>
              <CategorySelect
                categories={categories}
                value={form.watch("categoryCode")}
                onChange={(v) => form.setValue("categoryCode", v)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--muted)]">Round</label>
              <RoundSelect
                value={String(form.watch("round") ?? "")}
                onChange={(v) => form.setValue("round", v ? Number(v) : undefined)}
                options={[
                  { value: "", label: "All rounds" },
                  { value: "1", label: "Round 1" },
                  { value: "2", label: "Round 2" },
                  { value: "3", label: "Extended Round" }
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--muted)]">District</label>
              <select
                className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                value={form.watch("preferredCity") ?? ""}
                onChange={(e) => form.setValue("preferredCity", e.target.value || undefined)}
              >
                <option value="" className="text-[var(--muted)]">All districts</option>
                {(districtsQuery.data?.districts ?? []).map((d) => (
                  <option key={d} value={d} className="text-[var(--foreground)]">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <BranchSelect
                branches={ALL_BRANCHES}
                value={branchCodes}
                onChange={setBranchCodes}
                label="Branches"
                placeholder="Select branches..."
              />
            </div>

            <button type="button" onClick={toggleAdvancedFilters} className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--primary)] transition">
              <SlidersHorizontal className="h-3 w-3" />
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </button>

            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 border border-[var(--border)] rounded-lg p-2.5 overflow-hidden">
                  <p className="text-[9px] font-medium text-[var(--muted)]">Filter Colleges</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-[var(--muted)]">NIRF Min</label>
                      <input type="number" className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[10px]" value={advancedFilters.nirfRankMin} onChange={(e) => setAdvancedFilter("nirfRankMin", e.target.value)} placeholder="Min" />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted)]">NIRF Max</label>
                      <input type="number" className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[10px]" value={advancedFilters.nirfRankMax} onChange={(e) => setAdvancedFilter("nirfRankMax", e.target.value)} placeholder="Max" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-[var(--muted)]">Min Placement %</label>
                    <input type="number" min="0" max="100" className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[10px]" value={advancedFilters.placementPctMin} onChange={(e) => setAdvancedFilter("placementPctMin", e.target.value)} placeholder="e.g. 80" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[10px]" value={advancedFilters.hostelAvailable} onChange={(e) => setAdvancedFilter("hostelAvailable", e.target.value)}>
                      <option value="">Hostel: Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <select className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-1 text-[10px]" value={advancedFilters.autonomous} onChange={(e) => setAdvancedFilter("autonomous", e.target.value)}>
                      <option value="">Auto: Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <button type="button" onClick={resetAdvancedFilters} className="text-[9px] text-[var(--muted)] hover:text-[var(--primary)]">Reset filters</button>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <input type="checkbox" className="h-3 w-3 accent-[var(--primary)]" {...form.register("save")} />
              Save simulation
            </label>

            <form onSubmit={onSubmit}>
              <Button type="submit" disabled={prediction.isPending} className="w-full h-8 text-xs font-medium">
                {prediction.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                {prediction.isPending ? "Analyzing..." : "Predict"}
              </Button>
            </form>

            {/* Quick links */}
            <div className="pt-2 border-t border-[var(--border)] space-y-1">
              <Link href="/district" className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--primary)] transition">
                <MapPin className="h-3 w-3" /> Explore Districts
              </Link>
              <Link href="/compare" className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--primary)] transition">
                <Scale className="h-3 w-3" /> Compare Colleges
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content - Scrollable Results */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 space-y-4">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-[var(--foreground)] sm:text-xl">
                  KCET College Predictor
                </h1>
                <p className="text-xs text-[var(--muted)]">
                  Real KEA cutoff analysis &mdash; {totalColleges} colleges loaded
                </p>
              </div>
              {prediction.data && (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[var(--muted)] bg-[var(--surface)] rounded-lg px-2.5 py-1.5 border border-[var(--border)]">
                  <BarChart3 className="h-3 w-3 text-[var(--primary)]" />
                  {prediction.data.totalMatches} matches
                </div>
              )}
            </motion.div>

            {/* Loading State */}
            {prediction.isPending && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Skeleton className="h-64 rounded-lg" />
                  <Skeleton className="h-64 rounded-lg" />
                </div>
                <Skeleton className="h-72 rounded-lg" />
              </div>
            )}

            {/* Empty State */}
            {!prediction.isPending && !prediction.data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
                <GraduationCap className="h-10 w-10 text-[var(--muted)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Ready to predict your KCET colleges?</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Enter your rank and preferences in the sidebar to get started</p>
                </div>
                <p className="text-[10px] text-[var(--muted)] italic">Powered by real KEA cutoff data</p>
              </motion.div>
            )}

            {/* Prediction Results & Analytics */}
            {prediction.data && (
              <AnimatePresence mode="wait">
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* AI Counselling Dashboard */}
                  <SuccessProbability data={prediction.data.matches} userRank={prediction.data.input.examRank} />

                  {/* Analytics Charts Grid */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <RankAnalysisChart data={prediction.data.matches} userRank={prediction.data.input.examRank} />
                    <TierVisualization data={prediction.data.matches} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PlacementComparisonChart data={prediction.data.matches} />
                    <DistrictDistributionChart data={prediction.data.matches} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <BranchPopularityChart data={prediction.data.matches} />
                    <KarnatakaMap data={prediction.data.matches} />
                    <QuickInsights data={prediction.data.matches} />
                  </div>

                  {/* Counselling Strategy */}
                  {prediction.data.counsellingStrategy && prediction.data.counsellingStrategy.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                        <h4 className="text-sm font-semibold text-[var(--foreground)]">Counselling Strategy</h4>
                      </div>
                      <div className="space-y-1">
                        {prediction.data.counsellingStrategy.map((item: string, i: number) => (
                          <p key={i} className="text-xs text-[var(--muted)]">{item}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Prediction Results */}
                  <PredictionResults data={prediction.data.matches} loading={false} searchRange={prediction.data.searchRange} />

                  {/* Matches stats footer */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] border-t border-[var(--border)] pt-3">
                    <span>Generated at {new Date(prediction.data.generatedAt).toLocaleTimeString()}</span>
                    <span>{prediction.data.totalMatches} college-branch combinations analyzed</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Directory View */}
            {view === "directory" && !prediction.isPending && (
              <CollegeDirectory
                colleges={colleges}
                isLoading={collegesQuery.isLoading}
                error={collegesQuery.isError ? collegesQuery.error.message : null}
                query={collegeQuery}
                setQuery={setCollegeQuery}
                recentSearches={recentSearches}
                clearRecentSearches={() => useAdmissionsStore.getState().clearRecentSearches()}
                compareIds={compareIds}
                toggleCompareId={toggleCompareId}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PredictionResults({ data, loading, searchRange }: { data: PredictionResultItem[]; loading: boolean; searchRange?: { min: number; max: number; radius: number } }) {
  const { compareIds, toggleCompareId } = useAdmissionsStore();
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(20);

  const totalTiers = [...new Set(data.map((m) => m.collegeTier))].sort();
  const displayData = data.slice(0, showCount);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div className="rounded-lg border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Predictions</h3>
            {searchRange && (
              <span className="text-[10px] text-[var(--muted)] bg-[var(--surface)] rounded px-2 py-0.5 border border-[var(--border)]">
                &plusmn;{searchRange.radius.toLocaleString()} radius
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {compareIds.length >= 2 && (
              <Link href={`/compare?ids=${compareIds.join(",")}`}>
                <button className="rounded-lg border border-[var(--primary)] bg-[rgba(88,166,255,0.1)] px-2.5 py-1 text-[10px] text-[var(--primary)] font-medium hover:bg-[rgba(88,166,255,0.2)] transition">
                  <Scale className="h-3 w-3 inline mr-1" />Compare ({compareIds.length})
                </button>
              </Link>
            )}
            <span className="text-[10px] text-[var(--muted)] bg-[var(--surface)] rounded px-2 py-1 border border-[var(--border)]">{data.length} matches</span>
          </div>
        </div>

        {/* Tier summary chips */}
        {totalTiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]/50">
            {totalTiers.map((t) => {
              const count = data.filter((m) => m.collegeTier === t).length;
              return (
                <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium border ${collegeTierColor(t)}`}>
                  {t} ({count})
                </span>
              );
            })}
          </div>
        )}

        {/* Results list */}
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : !data.length ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center px-4">
            <Filter className="h-5 w-5 text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">No predictions yet</p>
            <p className="text-xs text-[var(--muted)]">Enter your KCET rank and category in the sidebar</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {displayData.map((match, index) => {
                const isCompared = compareIds.includes(match.collegeId);
                return (
                  <motion.div
                    key={`${match.collegeId}-${match.branchCode}-${match.round}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.008, 0.3) }}
                    className="relative"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCompareId(match.collegeId); }}
                      className={`absolute top-2 right-2 z-10 rounded border p-1 transition ${
                        isCompared
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:border-[var(--primary)]"
                      }`}
                      title={isCompared ? "Remove from compare" : "Add to compare"}
                    >
                      <Scale className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => setSelectedCollegeId(match.collegeId)}
                      className="group w-full rounded-lg border border-[var(--border)] p-3 text-left transition hover:border-[var(--primary)] hover:bg-[var(--card-hover)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${collegeTierColor(match.collegeTier)}`}>
                            {match.collegeTier}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-bold text-[var(--foreground)]">{match.qualityScore}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierClass(match.tier)} ${tierBg(match.tier)}`}>
                          {match.tierLabel}
                        </span>
                      </div>

                      <div className="min-w-0 mb-1.5">
                        <p className="text-sm font-semibold leading-snug truncate">{match.collegeName}</p>
                        <p className="text-[11px] text-[var(--muted)]">{match.branchName} ({match.branchCode})</p>
                      </div>

                      <p className="text-[10px] text-[var(--muted)] mb-2">
                        <MapPin className="h-3 w-3 inline mr-0.5" />
                        {match.district || match.city}
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <div className="rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-1 text-center">
                          <p className="text-[9px] text-[var(--muted)]">Cutoff</p>
                          <p className="text-[11px] font-semibold">{match.rankClose.toLocaleString()}</p>
                        </div>
                        {match.averagePackage != null ? (
                          <div className="rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-1 text-center">
                            <p className="text-[9px] text-[var(--muted)]">Avg Pack</p>
                            <p className="text-[11px] font-semibold text-[var(--success)]">₹{match.averagePackage.toFixed(1)}L</p>
                          </div>
                        ) : (
                          <div className="rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-1 text-center">
                            <p className="text-[9px] text-[var(--muted)]">Cutoff Gap</p>
                            <p className={`text-[11px] font-semibold ${match.rankGap >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                              {match.rankGap >= 0 ? "+" : ""}{match.rankGap.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {match.highestPackage != null ? (
                          <div className="rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-1 text-center">
                            <p className="text-[9px] text-[var(--muted)]">Highest</p>
                            <p className="text-[11px] font-semibold text-[var(--warning)]">₹{match.highestPackage.toFixed(1)}L</p>
                          </div>
                        ) : (
                          <div className="rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-1 text-center">
                            <p className="text-[9px] text-[var(--muted)]">Confidence</p>
                            <p className="text-[11px] font-semibold">{match.confidenceScore}%</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {match.autonomous && (
                          <span className="rounded border border-[var(--primary)] px-1.5 py-0.5 text-[9px] text-[var(--primary)]">Autonomous</span>
                        )}
                        {match.naacGrade && (
                          <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] text-[var(--muted)]">NAAC {match.naacGrade}</span>
                        )}
                        {match.placementRate != null && (
                          <span className="rounded border border-[var(--success)]/30 px-1.5 py-0.5 text-[9px] text-[var(--success)]">{match.placementRate}% placed</span>
                        )}
                        {match.collegeTier === "Tier 1" && (
                          <span className="rounded border border-amber-500/30 px-1.5 py-0.5 text-[9px] text-amber-400"><BadgeCheck className="h-2.5 w-2.5 inline mr-0.5" />Premium</span>
                        )}
                      </div>

                      <p className="text-[10px] italic text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-1.5 mt-1">
                        &ldquo;{match.quickInsight}&rdquo;
                      </p>
                    </button>
                  </motion.div>
                );
              })}
            </div>
            {data.length > showCount && (
              <div className="px-4 pb-4 text-center">
                <button onClick={() => setShowCount(showCount + 20)} className="text-xs text-[var(--primary)] hover:underline">
                  Show {Math.min(20, data.length - showCount)} more ({data.length - showCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedCollegeId && (
        <CollegeDetailsModal
          collegeId={selectedCollegeId}
          isOpen={!!selectedCollegeId}
          onClose={() => setSelectedCollegeId(null)}
        />
      )}
    </motion.div>
  );
}

function CollegeDirectory({
  colleges,
  isLoading,
  error,
  query,
  setQuery,
  recentSearches,
  clearRecentSearches,
  compareIds,
  toggleCompareId
}: {
  colleges: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    district: string | null;
    state: string;
    autonomous: boolean;
    naacGrade: string | null;
    branches: Array<{ id: string; code: string; name: string }>;
  }>;
  isLoading: boolean;
  error: string | null;
  query: string;
  setQuery: (value: string) => void;
  recentSearches: string[];
  clearRecentSearches: () => void;
  compareIds: string[];
  toggleCompareId: (id: string) => void;
}) {
  const [showAllColleges, setShowAllColleges] = useState(false);
  const displayed = showAllColleges ? colleges : colleges.slice(0, 12);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">College Directory</h3>
            <p className="text-[10px] text-[var(--muted)]">{colleges.length} colleges in database</p>
          </div>
          <div className="flex items-center gap-2">
            {compareIds.length >= 2 && (
              <Link href={`/compare?ids=${compareIds.join(",")}`}>
                <Button variant="secondary" size="sm" className="text-[10px] h-7 px-2">
                  <Scale className="h-3 w-3 mr-1" />Compare ({compareIds.length})
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-8 text-center">
              <Activity className="h-5 w-5 text-[var(--danger)]" />
              <p className="text-sm text-[var(--muted)]">{error}</p>
            </div>
          ) : !colleges.length ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-8 text-center">
              <Building2 className="h-5 w-5 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">No colleges found</p>
              <p className="text-xs text-[var(--muted)]">Import KCET cutoff PDFs to populate the database</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {displayed.map((college) => (
                  <div key={college.id} className="relative group">
                    <button
                      onClick={(e) => { e.preventDefault(); toggleCompareId(college.id); }}
                      className={`absolute top-2 right-2 z-10 rounded border p-1 transition ${
                        compareIds.includes(college.id)
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:border-[var(--primary)]"
                      }`}
                      title={compareIds.includes(college.id) ? "Remove from compare" : "Add to compare"}
                    >
                      <Scale className="h-3 w-3" />
                    </button>
                    <Link href={`/college/${college.id}`}>
                      <article className="rounded-lg border border-[var(--border)] p-3 transition hover:border-[var(--primary)] hover:bg-[var(--card-hover)]">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-snug">{college.name}</h4>
                          {college.autonomous && <span className="shrink-0 rounded border border-[var(--primary)] px-1 py-0.5 text-[10px] text-[var(--primary)]">AUTO</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {college.code} &middot; {college.city}{college.naacGrade ? ` &middot; NAAC ${college.naacGrade}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {college.branches.slice(0, 8).map((b) => (
                            <span key={b.id} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">{b.code}</span>
                          ))}
                          {college.branches.length > 8 && <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">+{college.branches.length - 8}</span>}
                        </div>
                      </article>
                    </Link>
                  </div>
                ))}
              </div>
              {colleges.length > 12 && !showAllColleges && (
                <button onClick={() => setShowAllColleges(true)} className="mt-3 text-xs text-[var(--primary)] hover:underline">
                  Show all {colleges.length} colleges
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
