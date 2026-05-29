"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useProtectedRoute();
  return <>{children}</>;
}
