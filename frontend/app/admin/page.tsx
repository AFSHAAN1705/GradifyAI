"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuthStore } from "@/components/auth-provider";
import {
  Building2,
  GraduationCap,
  FileText,
  Users,
  TrendingUp,
  Upload,
  BarChart3,
  Database,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  FolderOpen,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { TrainingPanel } from "@/features/admin/training-panel";

type Tab = "dashboard" | "colleges" | "branches" | "cutoffs" | "categories" | "imports" | "users" | "placements" | "predictions" | "training";

interface DashboardStats {
  totalColleges: number;
  totalBranches: number;
  totalCutoffs: number;
  totalUsers: number;
  totalPredictions: number;
  totalPlacements: number;
  totalCategories: number;
  importsByStatus: Record<string, number>;
  recentImports: Array<{
    _id: string;
    fileName: string;
    year: number;
    round: number;
    status: string;
    importedRows: number;
    failedRows: number;
    createdAt: string;
  }>;
  cutoffsByYear: Array<{ year: number; count: number }>;
  userGrowth: Array<{ month: string; count: number }>;
  topColleges: Array<{ _id: string; name: string; code: string; city: string; cutoffCount: number }>;
  topBranches: Array<{ _id: string; name: string; code: string; cutoffCount: number }>;
}

interface ImportLog {
  _id: string;
  fileName: string;
  originalName: string;
  year: number;
  round: number;
  roundLabel: string;
  status: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  duplicateRows: number;
  skippedRows: number;
  errors: Array<{ line: string; reason: string; timestamp: string }>;
  processingTimeMs: number;
  uploadedBy?: { name: string; email: string };
  createdAt: string;
}

interface College {
  _id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  website?: string;
  branchIds: Array<{ _id: string; code: string; name: string }>;
}

interface Branch {
  _id: string;
  code: string;
  name: string;
  aliases: string[];
}

interface Category {
  _id: string;
  code: string;
  name: string;
  group: string;
  tags: string[];
}

interface Cutoff {
  _id: string;
  collegeId: { _id: string; name: string; code: string; city: string };
  branchId: { _id: string; name: string; code: string };
  categoryCode: string;
  categoryName: string;
  year: number;
  round: number;
  roundLabel: string;
  rankOpen?: number;
  rankClose: number;
  percentile?: number;
  quota: string;
  seatType: string;
}

interface User {
  _id: string;
  name: string | null;
  email: string;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface Placement {
  _id: string;
  collegeId: { _id: string; name: string; code: string; city: string };
  branchId?: { _id: string; name: string; code: string };
  academicYear: string;
  medianPackageLpa?: number;
  averagePackageLpa?: number;
  highestPackageLpa?: number;
  placementRate?: number;
  recruiters: string[];
}

interface Prediction {
  _id: string;
  userId?: { _id: string; name: string | null; email: string };
  examRank: number;
  categoryCode: string;
  preferredCity?: string;
  branchCodes: string[];
  status: string;
  result: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const toast = useToastStore((state) => state.push);
  const { user, isLoading } = useProtectedRoute();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState("2025");
  const [uploadRound, setUploadRound] = useState("1");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [importLogs, setImportLogs] = useState<PaginatedResult<ImportLog> | null>(null);
  const [colleges, setColleges] = useState<PaginatedResult<College> | null>(null);
  const [branches, setBranches] = useState<PaginatedResult<Branch> | null>(null);
  const [categories, setCategories] = useState<PaginatedResult<Category> | null>(null);
  const [cutoffs, setCutoffs] = useState<PaginatedResult<Cutoff> | null>(null);
  const [users, setUsers] = useState<PaginatedResult<User> | null>(null);
  const [placements, setPlacements] = useState<PaginatedResult<Placement> | null>(null);
  const [predictions, setPredictions] = useState<PaginatedResult<Prediction> | null>(null);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [editingItem, setEditingItem] = useState<College | Branch | Placement | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Form states
  const [collegeForm, setCollegeForm] = useState({ code: "", name: "", city: "", state: "Karnataka", website: "" });
  const [branchForm, setBranchForm] = useState({ code: "", name: "", aliases: "" });
  const [placementForm, setPlacementForm] = useState({
    collegeId: "",
    branchId: "",
    academicYear: "2024-25",
    medianPackageLpa: "",
    averagePackageLpa: "",
    highestPackageLpa: "",
    placementRate: "",
    recruiters: ""
  });

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "Successfully logged out." });
    router.push("/login");
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === "imports") fetchImportLogs();
    if (activeTab === "colleges") fetchColleges();
    if (activeTab === "branches") fetchBranches();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "cutoffs") fetchCutoffs();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "placements") fetchPlacements();
    if (activeTab === "predictions") fetchPredictions();
  }, [activeTab, currentPage, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-r-transparent"></div>
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  async function fetchDashboardStats() {
    try {
      const data = await apiFetch<DashboardStats>("/api/admin/dashboard/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  }

  async function fetchImportLogs() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<ImportLog>>(
        `/api/admin/import-logs?page=${currentPage}&limit=10${searchQuery ? `&status=${searchQuery}` : ""}`
      );
      setImportLogs(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch import logs" });
    }
    setLoading(false);
  }

  async function fetchColleges() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<College>>(
        `/api/admin/colleges?page=${currentPage}&limit=10${searchQuery ? `&search=${searchQuery}` : ""}`
      );
      setColleges(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch colleges" });
    }
    setLoading(false);
  }

  async function fetchBranches() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<Branch>>(
        `/api/admin/branches?page=${currentPage}&limit=10${searchQuery ? `&search=${searchQuery}` : ""}`
      );
      setBranches(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch branches" });
    }
    setLoading(false);
  }

  async function fetchCategories() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<Category>>(
        `/api/admin/categories?page=${currentPage}&limit=50`
      );
      setCategories(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch categories" });
    }
    setLoading(false);
  }

  async function fetchCutoffs() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<Cutoff>>(
        `/api/admin/cutoffs?page=${currentPage}&limit=10${searchQuery ? `&categoryCode=${searchQuery}` : ""}`
      );
      setCutoffs(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch cutoffs" });
    }
    setLoading(false);
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<User>>(
        `/api/admin/users?page=${currentPage}&limit=10${searchQuery ? `&search=${searchQuery}` : ""}`
      );
      setUsers(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users" });
    }
    setLoading(false);
  }

  async function fetchPlacements() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<Placement>>(
        `/api/admin/placements?page=${currentPage}&limit=10`
      );
      setPlacements(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch placements" });
    }
    setLoading(false);
  }

  async function fetchPredictions() {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResult<Prediction>>(
        `/api/admin/predictions?page=${currentPage}&limit=10`
      );
      setPredictions(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch predictions" });
    }
    setLoading(false);
  }

  async function handleUploadPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", uploadFile);
      form.set("year", uploadYear);
      form.set("round", uploadRound);

      await apiFetch("/api/admin/upload-pdf", {
        method: "POST",
        data: form,
        headers: { "content-type": "multipart/form-data" }
      });

      toast({ title: "PDF Uploaded", description: "Cutoff data imported successfully" });
      setShowUploadModal(false);
      setUploadFile(null);
      fetchDashboardStats();
      fetchImportLogs();
    } catch (error) {
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "Failed to upload PDF" });
    }
    setUploading(false);
  }

  async function handleCreateCollege(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/colleges", {
        method: "POST",
        data: collegeForm
      });
      toast({ title: "College Created", description: `${collegeForm.name} has been added` });
      setShowCollegeModal(false);
      setCollegeForm({ code: "", name: "", city: "", state: "Karnataka", website: "" });
      fetchColleges();
      fetchDashboardStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create college" });
    }
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/branches", {
        method: "POST",
        data: {
          ...branchForm,
          aliases: branchForm.aliases.split(",").map((a) => a.trim().toUpperCase()).filter(Boolean)
        }
      });
      toast({ title: "Branch Created", description: `${branchForm.name} has been added` });
      setShowBranchModal(false);
      setBranchForm({ code: "", name: "", aliases: "" });
      fetchBranches();
      fetchDashboardStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create branch" });
    }
  }

  async function handleCreatePlacement(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/placements", {
        method: "POST",
        data: {
          ...placementForm,
          medianPackageLpa: Number(placementForm.medianPackageLpa) || undefined,
          averagePackageLpa: Number(placementForm.averagePackageLpa) || undefined,
          highestPackageLpa: Number(placementForm.highestPackageLpa) || undefined,
          placementRate: Number(placementForm.placementRate) || undefined,
          recruiters: placementForm.recruiters.split(",").map((r) => r.trim()).filter(Boolean)
        }
      });
      toast({ title: "Placement Created", description: "Placement data has been added" });
      setShowPlacementModal(false);
      setPlacementForm({
        collegeId: "",
        branchId: "",
        academicYear: "2024-25",
        medianPackageLpa: "",
        averagePackageLpa: "",
        highestPackageLpa: "",
        placementRate: "",
        recruiters: ""
      });
      fetchPlacements();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create placement" });
    }
  }

  async function handleDeleteCollege(id: string) {
    if (!confirm("Are you sure you want to delete this college?")) return;
    try {
      await apiFetch(`/api/admin/colleges/${id}`, { method: "DELETE" });
      toast({ title: "College Deleted", description: "College has been removed" });
      fetchColleges();
      fetchDashboardStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete college" });
    }
  }

  async function handleDeleteBranch(id: string) {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await apiFetch(`/api/admin/branches/${id}`, { method: "DELETE" });
      toast({ title: "Branch Deleted", description: "Branch has been removed" });
      fetchBranches();
      fetchDashboardStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete branch" });
    }
  }

  async function handleDeleteCutoff(id: string) {
    if (!confirm("Are you sure you want to delete this cutoff entry?")) return;
    try {
      await apiFetch(`/api/admin/cutoffs/${id}`, { method: "DELETE" });
      toast({ title: "Cutoff Deleted", description: "Cutoff entry has been removed" });
      fetchCutoffs();
      fetchDashboardStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete cutoff" });
    }
  }

  async function handleUpdateUserRole(id: string, role: string) {
    try {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        data: { role }
      });
      toast({ title: "Role Updated", description: `User role changed to ${role}` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user role" });
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "COMPLETED":
        return "text-[var(--success)] bg-[var(--success)]/10";
      case "PROCESSING":
        return "text-[var(--warning)] bg-[var(--warning)]/10";
      case "FAILED":
        return "text-[var(--danger)] bg-[var(--danger)]/10";
      case "PARTIAL":
        return "text-[var(--warning)] bg-[var(--warning)]/10";
      default:
        return "text-[var(--muted)] bg-[var(--muted)]/10";
    }
  }

  const navItems: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "imports", label: "Import Logs", icon: <Database className="h-4 w-4" />, badge: stats?.importsByStatus?.PROCESSING || 0 },
    { id: "colleges", label: "Colleges", icon: <Building2 className="h-4 w-4" /> },
    { id: "branches", label: "Branches", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "cutoffs", label: "Cutoffs", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <FileText className="h-4 w-4" /> },
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { id: "placements", label: "Placements", icon: <Activity className="h-4 w-4" /> },
    { id: "predictions", label: "Predictions", icon: <Eye className="h-4 w-4" /> },
    { id: "training", label: "SAM Training", icon: <GraduationCap className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || isLargeScreen) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r border-[var(--border)] lg:translate-x-0"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <span className="font-semibold">Admin Panel</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[var(--muted)] hover:text-[var(--foreground)]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                      setCurrentPage(1);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      activeTab === item.id
                        ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="rounded-full bg-[var(--danger)]/20 px-2 py-0.5 text-xs text-[var(--danger)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="border-t border-[var(--border)] p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
                <p className="text-sm text-[var(--muted)]">
                  {activeTab === "dashboard" && "Overview of your KCET counselling platform"}
                  {activeTab === "imports" && "Monitor PDF imports and processing status"}
                  {activeTab === "colleges" && "Manage engineering colleges"}
                  {activeTab === "branches" && "Manage engineering branches"}
                  {activeTab === "cutoffs" && "View and manage cutoff data"}
                  {activeTab === "categories" && "Manage KEA categories"}
                  {activeTab === "users" && "Manage platform users"}
                  {activeTab === "placements" && "Manage placement statistics"}
                  {activeTab === "predictions" && "Monitor user predictions"}
                  {activeTab === "training" && "Train SAM — manage knowledge base entries for the AI counsellor"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === "imports" && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
              )}
              {activeTab === "colleges" && (
                <Button onClick={() => setShowCollegeModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add College
                </Button>
              )}
              {activeTab === "branches" && (
                <Button onClick={() => setShowBranchModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Branch
                </Button>
              )}
              {activeTab === "placements" && (
                <Button onClick={() => setShowPlacementModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Placement
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Building2 className="h-5 w-5" />}
                  label="Total Colleges"
                  value={stats.totalColleges}
                  color="primary"
                />
                <StatCard
                  icon={<GraduationCap className="h-5 w-5" />}
                  label="Total Branches"
                  value={stats.totalBranches}
                  color="accent"
                />
                <StatCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Cutoff Entries"
                  value={stats.totalCutoffs}
                  color="success"
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Total Users"
                  value={stats.totalUsers}
                  color="warning"
                />
                <StatCard
                  icon={<Eye className="h-5 w-5" />}
                  label="Predictions"
                  value={stats.totalPredictions}
                  color="primary"
                />
                <StatCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Placements"
                  value={stats.totalPlacements}
                  color="success"
                />
                <StatCard
                  icon={<Database className="h-5 w-5" />}
                  label="Categories"
                  value={stats.totalCategories}
                  color="accent"
                />
                <StatCard
                  icon={<Upload className="h-5 w-5" />}
                  label="PDF Imports"
                  value={Object.values(stats.importsByStatus).reduce((a, b) => a + b, 0)}
                  color="warning"
                />
              </div>

              {/* Recent Imports */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Recent Imports</h2>
                </CardHeader>
                <CardContent>
                  {stats.recentImports.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm">No imports yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentImports.slice(0, 5).map((imp) => (
                        <div key={imp._id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--panel)]">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getStatusColor(imp.status)}`}>
                              {imp.status === "COMPLETED" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : imp.status === "FAILED" ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{imp.fileName}</p>
                              <p className="text-xs text-[var(--muted)]">
                                Round {imp.round} • {imp.year} • {formatDate(imp.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-[var(--success)]">{imp.importedRows}</span> imported
                            </p>
                            {imp.failedRows > 0 && (
                              <p className="text-xs text-[var(--danger)]">{imp.failedRows} failed</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Colleges and Branches */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Top Colleges by Cutoffs</h2>
                  </CardHeader>
                  <CardContent>
                    {stats.topColleges.length === 0 ? (
                      <p className="text-[var(--muted)] text-sm">No data available</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topColleges.map((college, index) => (
                          <div key={college._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--panel)]">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-[var(--muted)] w-5">{index + 1}</span>
                              <div>
                                <p className="text-sm font-medium">{college.name}</p>
                                <p className="text-xs text-[var(--muted)]">{college.code} • {college.city}</p>
                              </div>
                            </div>
                            <span className="text-sm text-[var(--primary)]">{college.cutoffCount} cutoffs</span>
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Top Branches by Cutoffs</h2>
                </CardHeader>
                <CardContent>
                  {stats.topBranches.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm">No data available</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topBranches.map((branch, index) => (
                        <div key={branch._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--panel)]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--muted)] w-5">{index + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{branch.name}</p>
                              <p className="text-xs text-[var(--muted)]">{branch.code}</p>
                            </div>
                          </div>
                          <span className="text-sm text-[var(--primary)]">{branch.cutoffCount} cutoffs</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Import Logs Tab */}
          {activeTab === "imports" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Import History</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : importLogs?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No import logs found</p>
                    <p className="text-sm text-[var(--muted)] mt-1">Upload a PDF to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">File</th>
                            <th className="text-left py-3 px-3 font-medium">Round</th>
                            <th className="text-left py-3 px-3 font-medium">Status</th>
                            <th className="text-left py-3 px-3 font-medium">Imported</th>
                            <th className="text-left py-3 px-3 font-medium">Failed</th>
                            <th className="text-left py-3 px-3 font-medium">Time</th>
                            <th className="text-left py-3 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importLogs?.data.map((log) => (
                            <tr key={log._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3">
                                <p className="font-medium">{log.originalName}</p>
                                <p className="text-xs text-[var(--muted)]">{log.fileName}</p>
                              </td>
                              <td className="py-3 px-3">Round {log.round} • {log.year}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(log.status)}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[var(--success)]">{log.importedRows}</td>
                              <td className="py-3 px-3">{log.failedRows > 0 ? <span className="text-[var(--danger)]">{log.failedRows}</span> : "-"}</td>
                              <td className="py-3 px-3 text-[var(--muted)]">{(log.processingTimeMs / 1000).toFixed(1)}s</td>
                              <td className="py-3 px-3 text-[var(--muted)]">{formatDate(log.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={importLogs?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Colleges Tab */}
          {activeTab === "colleges" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Colleges ({colleges?.total || 0})</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                    <Input
                      placeholder="Search colleges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : colleges?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No colleges found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">Code</th>
                            <th className="text-left py-3 px-3 font-medium">Name</th>
                            <th className="text-left py-3 px-3 font-medium">City</th>
                            <th className="text-left py-3 px-3 font-medium">Branches</th>
                            <th className="text-left py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {colleges?.data.map((college) => (
                            <tr key={college._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3 font-mono text-[var(--primary)]">{college.code}</td>
                              <td className="py-3 px-3 font-medium">{college.name}</td>
                              <td className="py-3 px-3">{college.city}</td>
                              <td className="py-3 px-3 text-[var(--muted)]">{college.branchIds?.length || 0} branches</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingItem(college)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--primary)]"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCollege(college._id)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--danger)]"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={colleges?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Branches Tab */}
          {activeTab === "branches" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Branches ({branches?.total || 0})</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                    <Input
                      placeholder="Search branches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : branches?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No branches found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">Code</th>
                            <th className="text-left py-3 px-3 font-medium">Name</th>
                            <th className="text-left py-3 px-3 font-medium">Aliases</th>
                            <th className="text-left py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branches?.data.map((branch) => (
                            <tr key={branch._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3 font-mono text-[var(--primary)]">{branch.code}</td>
                              <td className="py-3 px-3 font-medium">{branch.name}</td>
                              <td className="py-3 px-3 text-[var(--muted)] text-xs">
                                {branch.aliases?.slice(0, 3).join(", ")}
                                {branch.aliases?.length > 3 && ` +${branch.aliases.length - 3}`}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingItem(branch)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--primary)]"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBranch(branch._id)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--danger)]"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={branches?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cutoffs Tab */}
          {activeTab === "cutoffs" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Cutoff Entries ({cutoffs?.total || 0})</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                    <Input
                      placeholder="Search by category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : cutoffs?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No cutoff entries found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">College</th>
                            <th className="text-left py-3 px-3 font-medium">Branch</th>
                            <th className="text-left py-3 px-3 font-medium">Category</th>
                            <th className="text-left py-3 px-3 font-medium">Year</th>
                            <th className="text-left py-3 px-3 font-medium">Round</th>
                            <th className="text-left py-3 px-3 font-medium">Closing Rank</th>
                            <th className="text-left py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cutoffs?.data.map((cutoff) => (
                            <tr key={cutoff._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3">
                                <p className="font-medium">{cutoff.collegeId?.name}</p>
                                <p className="text-xs text-[var(--muted)]">{cutoff.collegeId?.city}</p>
                              </td>
                              <td className="py-3 px-3">
                                <p className="font-medium">{cutoff.branchId?.name}</p>
                                <p className="text-xs text-[var(--muted)]">{cutoff.branchId?.code}</p>
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
                                  {cutoff.categoryCode}
                                </span>
                              </td>
                              <td className="py-3 px-3">{cutoff.year}</td>
                              <td className="py-3 px-3">{cutoff.roundLabel}</td>
                              <td className="py-3 px-3 font-mono text-[var(--primary)]">{cutoff.rankClose.toLocaleString()}</td>
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleDeleteCutoff(cutoff._id)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--danger)]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={cutoffs?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">KEA Categories ({categories?.total || 0})</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : categories?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No categories found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories?.data.map((category) => (
                      <div key={category._id} className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[var(--primary)]/10 text-[var(--primary)]">
                              {category.code}
                            </span>
                            <p className="mt-2 font-medium">{category.name}</p>
                            <p className="text-xs text-[var(--muted)] mt-1">{category.group}</p>
                          </div>
                        </div>
                        {category.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {category.tags.map((tag, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)]/10 text-[var(--muted)]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Users ({users?.total || 0})</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : users?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No users found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">Name</th>
                            <th className="text-left py-3 px-3 font-medium">Email</th>
                            <th className="text-left py-3 px-3 font-medium">Role</th>
                            <th className="text-left py-3 px-3 font-medium">Last Login</th>
                            <th className="text-left py-3 px-3 font-medium">Joined</th>
                            <th className="text-left py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users?.data.map((user) => (
                            <tr key={user._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3 font-medium">{user.name || "-"}</td>
                              <td className="py-3 px-3">{user.email}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  user.role === "ADMIN"
                                    ? "bg-[var(--danger)]/10 text-[var(--danger)]"
                                    : "bg-[var(--primary)]/10 text-[var(--primary)]"
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[var(--muted)]">
                                {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                              </td>
                              <td className="py-3 px-3 text-[var(--muted)]">{formatDate(user.createdAt)}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  {user.role === "STUDENT" ? (
                                    <button
                                      onClick={() => handleUpdateUserRole(user._id, "ADMIN")}
                                      className="px-2 py-1 text-xs rounded bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20"
                                    >
                                      Make Admin
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateUserRole(user._id, "STUDENT")}
                                      className="px-2 py-1 text-xs rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                                    >
                                      Make Student
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={users?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placements Tab */}
          {activeTab === "placements" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Placements ({placements?.total || 0})</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : placements?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No placement data found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">College</th>
                            <th className="text-left py-3 px-3 font-medium">Branch</th>
                            <th className="text-left py-3 px-3 font-medium">Year</th>
                            <th className="text-left py-3 px-3 font-medium">Median</th>
                            <th className="text-left py-3 px-3 font-medium">Average</th>
                            <th className="text-left py-3 px-3 font-medium">Highest</th>
                            <th className="text-left py-3 px-3 font-medium">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {placements?.data.map((placement) => (
                            <tr key={placement._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3">
                                <p className="font-medium">{placement.collegeId?.name}</p>
                                <p className="text-xs text-[var(--muted)]">{placement.collegeId?.city}</p>
                              </td>
                              <td className="py-3 px-3">{placement.branchId?.name || "All Branches"}</td>
                              <td className="py-3 px-3">{placement.academicYear}</td>
                              <td className="py-3 px-3 font-mono">{placement.medianPackageLpa ? `₹${placement.medianPackageLpa} LPA` : "-"}</td>
                              <td className="py-3 px-3 font-mono">{placement.averagePackageLpa ? `₹${placement.averagePackageLpa} LPA` : "-"}</td>
                              <td className="py-3 px-3 font-mono text-[var(--success)]">{placement.highestPackageLpa ? `₹${placement.highestPackageLpa} LPA` : "-"}</td>
                              <td className="py-3 px-3">{placement.placementRate ? `${placement.placementRate}%` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={placements?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Predictions Tab */}
          {activeTab === "predictions" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">User Predictions ({predictions?.total || 0})</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : predictions?.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)]">No predictions found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-[var(--muted)]">
                            <th className="text-left py-3 px-3 font-medium">User</th>
                            <th className="text-left py-3 px-3 font-medium">Rank</th>
                            <th className="text-left py-3 px-3 font-medium">Category</th>
                            <th className="text-left py-3 px-3 font-medium">City</th>
                            <th className="text-left py-3 px-3 font-medium">Branches</th>
                            <th className="text-left py-3 px-3 font-medium">Status</th>
                            <th className="text-left py-3 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictions?.data.map((prediction) => (
                            <tr key={prediction._id} className="border-b border-[var(--border)] hover:bg-[var(--panel)]">
                              <td className="py-3 px-3">
                                <p className="font-medium">{prediction.userId?.name || "Anonymous"}</p>
                                <p className="text-xs text-[var(--muted)]">{prediction.userId?.email}</p>
                              </td>
                              <td className="py-3 px-3 font-mono">{prediction.examRank.toLocaleString()}</td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
                                  {prediction.categoryCode}
                                </span>
                              </td>
                              <td className="py-3 px-3">{prediction.preferredCity || "Any"}</td>
                              <td className="py-3 px-3 text-xs text-[var(--muted)]">
                                {prediction.branchCodes?.slice(0, 2).join(", ")}
                                {prediction.branchCodes?.length > 2 && ` +${prediction.branchCodes.length - 2}`}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  prediction.status === "SAVED"
                                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                                    : "bg-[var(--muted)]/10 text-[var(--muted)]"
                                }`}>
                                  {prediction.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[var(--muted)]">{formatDate(prediction.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={predictions?.totalPages || 1}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Training Tab */}
          {activeTab === "training" && <TrainingPanel />}
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Upload Cutoff PDF</h2>
              <form onSubmit={handleUploadPdf} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">PDF File</label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Year</label>
                    <Input
                      type="number"
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Round</label>
                    <select
                      value={uploadRound}
                      onChange={(e) => setUploadRound(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foreground)]"
                    >
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                      <option value="3">Extended Round</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading || !uploadFile} className="flex-1">
                    {uploading ? "Uploading..." : "Upload & Import"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add College Modal */}
      <AnimatePresence>
        {showCollegeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCollegeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Add New College</h2>
              <form onSubmit={handleCreateCollege} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">College Code</label>
                  <Input
                    placeholder="e.g., 101"
                    value={collegeForm.code}
                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">College Name</label>
                  <Input
                    placeholder="e.g., RV College of Engineering"
                    value={collegeForm.name}
                    onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">City</label>
                  <Input
                    placeholder="e.g., Bangalore"
                    value={collegeForm.city}
                    onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Website (Optional)</label>
                  <Input
                    placeholder="https://..."
                    value={collegeForm.website}
                    onChange={(e) => setCollegeForm({ ...collegeForm, website: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCollegeModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create College
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Branch Modal */}
      <AnimatePresence>
        {showBranchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBranchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Add New Branch</h2>
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Branch Code</label>
                  <Input
                    placeholder="e.g., CSE"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Branch Name</label>
                  <Input
                    placeholder="e.g., Computer Science and Engineering"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Aliases (comma-separated)</label>
                  <Input
                    placeholder="e.g., CS, COMP"
                    value={branchForm.aliases}
                    onChange={(e) => setBranchForm({ ...branchForm, aliases: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBranchModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Branch
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Placement Modal */}
      <AnimatePresence>
        {showPlacementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPlacementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Add Placement Data</h2>
              <form onSubmit={handleCreatePlacement} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">College ID</label>
                  <Input
                    placeholder="College MongoDB ID"
                    value={placementForm.collegeId}
                    onChange={(e) => setPlacementForm({ ...placementForm, collegeId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Branch ID (Optional)</label>
                  <Input
                    placeholder="Branch MongoDB ID or leave empty for all"
                    value={placementForm.branchId}
                    onChange={(e) => setPlacementForm({ ...placementForm, branchId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Academic Year</label>
                  <Input
                    placeholder="e.g., 2024-25"
                    value={placementForm.academicYear}
                    onChange={(e) => setPlacementForm({ ...placementForm, academicYear: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Median Package (LPA)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 8"
                      value={placementForm.medianPackageLpa}
                      onChange={(e) => setPlacementForm({ ...placementForm, medianPackageLpa: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Average Package (LPA)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      value={placementForm.averagePackageLpa}
                      onChange={(e) => setPlacementForm({ ...placementForm, averagePackageLpa: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Highest Package (LPA)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 50"
                      value={placementForm.highestPackageLpa}
                      onChange={(e) => setPlacementForm({ ...placementForm, highestPackageLpa: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-2">Placement Rate (%)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 85"
                      value={placementForm.placementRate}
                      onChange={(e) => setPlacementForm({ ...placementForm, placementRate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">Recruiters (comma-separated)</label>
                  <Input
                    placeholder="e.g., Google, Microsoft, Amazon"
                    value={placementForm.recruiters}
                    onChange={(e) => setPlacementForm({ ...placementForm, recruiters: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPlacementModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Placement
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "accent" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
    accent: "bg-[var(--accent)]/10 text-[var(--accent)]",
    success: "bg-[var(--success)]/10 text-[var(--success)]",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)]"
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">{label}</p>
              <p className="text-2xl font-semibold mt-1">{value.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-sm text-[var(--muted)]">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-[var(--muted)] px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
