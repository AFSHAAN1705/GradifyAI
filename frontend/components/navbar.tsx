"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/components/auth-provider";
import { useToastStore } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/api/client";

export function NavBar() {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await apiFetch<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" }); } catch { /* best-effort */ }
    logout();
    toast({ title: "Logged out", type: "info" });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="text-sm font-bold">GradifyAI</Link>
        <div className="flex items-center gap-3 text-xs">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)]">
                <LayoutDashboard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
              </Link>
              {user.role === "ADMIN" && <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--foreground)]">Admin</Link>}
              <span className="text-[var(--muted)]">{user.name || user.email}</span>
              <button onClick={handleLogout} className="text-[var(--muted)] hover:text-[var(--foreground)]"><LogOut className="h-3.5 w-3.5" /></button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)]">Login</Link>
              <Link href="/signup" className="text-[var(--muted)] hover:text-[var(--foreground)]">Signup</Link>
              <Link href="/admin/login" className="text-[var(--muted)] hover:text-[var(--foreground)]">Admin</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
