"use client";

import { Eye, EyeOff, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { useAuthStore } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToastStore((state) => state.push);
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiFetch<{
        token: string;
        user: User;
      }>("/api/auth/login", {
        method: "POST",
        data: { email, password }
      });

      if (result.user.role !== "ADMIN") {
        toast({
          title: "Access Denied",
          description: "Admin access is required."
        });
        setLoading(false);
        return;
      }

      login(result.token, result.user);
      toast({
        title: "Admin Access Granted",
        description: `Welcome to the Admin Dashboard, ${result.user.email}.`
      });
      router.push("/admin");
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Please check your credentials."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-lg p-6">
        <div className="mb-6">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(101,228,255,0.13)] text-[var(--primary)]">
            <Lock />
          </div>
          <h1 className="text-3xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Secure access to the KCET Admin Dashboard. Admin credentials required.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="relative">
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              required
            />
            <span className="absolute left-3 top-2.5 text-[var(--muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 pl-9 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              required
            />
            <span className="absolute left-3 top-2.5 text-[var(--muted)]">
              <Lock className="h-4 w-4" />
            </span>
            <button
              aria-label="Toggle password visibility"
              className="absolute right-3 top-2.5 text-[var(--muted)]"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button className="mt-5 w-full" disabled={loading}>
          {loading ? "Authenticating..." : "Login to Admin Dashboard"}
          <LogIn className="h-4 w-4" />
        </Button>

        <div className="mt-5 text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            Student Login
          </Link>
        </div>
      </form>
    </main>
  );
}
