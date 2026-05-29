"use client";

import { Eye, EyeOff, Lock, LogIn, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { useAuthStore } from "@/components/auth-provider";
import { api, apiFetch } from "@/lib/api/client";

type AuthMode = "login" | "signup" | "forgot";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: "STUDENT" | "ADMIN";
  };
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const toast = useToastStore((state) => state.push);
  const { login } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "forgot") {
      toast({
        title: "Recovery flow ready",
        description: "Connect an email provider to send secure password reset links.",
        type: "info"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        data: mode === "signup" ? { name, email, password } : { email, password }
      });
      login(result.token, result.user);
      toast({ title: "Session active", description: `Welcome to KCET counselling, ${result.user.email}.`, type: "success" });
      router.push(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Please retry.",
        type: "error"
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
            {mode === "signup" ? <UserPlus /> : <Lock />}
          </div>
          <h1 className="text-3xl font-semibold">
            {mode === "login" ? "Login to GradifyAI" : mode === "signup" ? "Create your KCET account" : "Recover password"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Secure JWT session for Karnataka KCET predictions, saved simulations, and admin tools.
          </p>
        </div>

        <div className="grid gap-3">
          {mode === "signup" ? <Input required placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} /> : null}
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
            <Input className="pl-9" required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          {mode !== "forgot" ? (
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
              <Input
                className="pl-9 pr-10"
                required
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label="Toggle password visibility"
                className="absolute right-3 top-2.5 text-[var(--muted)]"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </div>

        <Button className="mt-5 w-full" disabled={loading}>
          {loading ? "Working..." : mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send recovery link"}
          {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        </Button>

        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-[var(--muted)]">
          <Link href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create account" : "Back to login"}</Link>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
