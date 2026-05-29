"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { useAuthStore } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api/client";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: "STUDENT" | "ADMIN";
  };
};

export function AuthPanel() {
  const router = useRouter();
  const toast = useToastStore((state) => state.push);
  const { login: authLogin } = useAuthStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = mode === "signup" ? { name, email, password } : { email, password };
      const result = await apiFetch<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        data: payload
      });
      authLogin(result.token, result.user);
      toast({
        title: "Signed in",
        description: `${result.user.email} is connected to the API.`,
        type: "success"
      });
      router.push(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Please check your credentials.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="text-sm text-[var(--muted)]">JWT auth through the Express API</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {mode === "login" ? "Signup" : "Login"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={submit}>
          {mode === "signup" ? <Input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /> : null}
          <Input required placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            required
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
