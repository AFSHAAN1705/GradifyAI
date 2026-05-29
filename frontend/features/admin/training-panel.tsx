"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Plus, Search, Edit2, Trash2, RefreshCw,
  BookOpen, TrendingUp, Star, MapPin, Lightbulb,
  MessageSquare, FileText, Shield, X, Check, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";

type Category = "counselling_tip" | "placement_insight" | "college_review" | "branch_advice" | "district_info" | "strategy" | "faq" | "system_prompt";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "counselling_tip", label: "Counselling Tips", icon: <Lightbulb className="h-4 w-4" /> },
  { value: "placement_insight", label: "Placement Insights", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "college_review", label: "College Reviews", icon: <BookOpen className="h-4 w-4" /> },
  { value: "branch_advice", label: "Branch Advice", icon: <Star className="h-4 w-4" /> },
  { value: "district_info", label: "District Info", icon: <MapPin className="h-4 w-4" /> },
  { value: "strategy", label: "Strategies", icon: <Shield className="h-4 w-4" /> },
  { value: "faq", label: "FAQs", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "system_prompt", label: "System Prompts", icon: <FileText className="h-4 w-4" /> },
];

interface KnowledgeEntry {
  _id: string;
  category: Category;
  title: string;
  content: string;
  tags: string[];
  priority: number;
  isActive: boolean;
}

const defaultForm = { category: "counselling_tip" as Category, title: "", content: "", tags: "", priority: 0 };

export function TrainingPanel() {
  const toast = useToastStore((s) => s.push);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (search.trim()) params.set("search", search.trim());
      const res = await apiFetch<{ items: KnowledgeEntry[] }>(`/api/ai/knowledge?${params.toString()}`);
          setEntries(res.items);
    } catch {
      toast({ title: "Failed to load training data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filterCategory, search, toast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const resetForm = () => { setForm(defaultForm); setEditingId(null); setShowForm(false); };

  const handleEdit = (entry: KnowledgeEntry) => {
    setForm({ category: entry.category, title: entry.title, content: entry.content, tags: entry.tags.join(", "), priority: entry.priority });
    setEditingId(entry._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and content are required", type: "error" });
      return;
    }
    const body = {
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      priority: form.priority,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/ai/knowledge/${editingId}`, { method: "PUT", data: body });
        toast({ title: "Entry updated", type: "success" });
      } else {
        await apiFetch("/api/ai/knowledge", { method: "POST", data: body });
        toast({ title: "Entry created", type: "success" });
      }
      resetForm();
      fetchEntries();
    } catch {
      toast({ title: editingId ? "Failed to update" : "Failed to create", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge entry?")) return;
    try {
      await apiFetch(`/api/ai/knowledge/${id}`, { method: "DELETE" });
      toast({ title: "Entry deleted", type: "success" });
      fetchEntries();
    } catch {
      toast({ title: "Failed to delete", type: "error" });
    }
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    try {
      await apiFetch(`/api/ai/knowledge/${entry._id}`, { method: "PUT", data: { isActive: !entry.isActive } });
      fetchEntries();
    } catch {
      toast({ title: "Failed to toggle status", type: "error" });
    }
  };

  const filteredEntries = filterCategory === "all"
    ? entries
    : entries.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition ${
              filterCategory === cat.value
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]/50"
            }`}
          >
            {cat.icon}
            <span className="font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{editingId ? "Edit Entry" : "New Knowledge Entry"}</h3>
                    <button type="button" onClick={resetForm} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--muted)] mb-1.5">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted)] mb-1.5">Priority</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1.5">Title</label>
                    <Input
                      placeholder="Entry title..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1.5">Content</label>
                    <textarea
                      placeholder="Knowledge content. Markdown supported."
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      rows={6}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1.5">Tags (comma-separated)</label>
                    <Input
                      placeholder="e.g., cse, bangalore, placement, top-college"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Knowledge Base ({filteredEntries.length})</h2>
            <button onClick={fetchEntries} className="text-[var(--muted)] hover:text-[var(--foreground)]">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
              <p className="text-[var(--muted)]">No knowledge entries found</p>
              <p className="text-xs text-[var(--muted)] mt-1">Add entries to train SAM's knowledge base</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div key={entry._id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--panel)] transition">
                  <div className="shrink-0 mt-0.5">
                    {CATEGORIES.find((c) => c.value === entry.category)?.icon || <FileText className="h-4 w-4 text-[var(--muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{entry.title}</span>
                      <span className="shrink-0 rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--primary)]">
                        {CATEGORIES.find((c) => c.value === entry.category)?.label || entry.category}
                      </span>
                      {entry.priority > 0 && (
                        <span className="shrink-0 text-[9px] text-[var(--muted)]">P{entry.priority}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">{entry.content}</p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="rounded bg-[var(--background)] px-1.5 py-0.5 text-[9px] text-[var(--muted)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(entry)}
                      className={`rounded p-1.5 transition ${entry.isActive ? "text-[var(--success)]" : "text-[var(--muted)]"}`}
                      title={entry.isActive ? "Active" : "Inactive"}
                    >
                      {entry.isActive ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(entry)} className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--primary)] transition">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(entry._id)} className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--danger)] transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
