"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/components/auth-provider";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/admin/login"];
const ADMIN_ROUTES = ["/admin"];

export function useProtectedRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const init = async () => {
      await checkAuth();
    };

    init();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && !isPublicRoute;

    // Admin routes: must be authenticated as ADMIN
    if (isAdminRoute) {
      if (!isAuthenticated) {
        router.push("/admin/login");
        return;
      }
      if (user && user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      return;
    }

    // Public routes: if already authenticated, redirect to dashboard
    if (isPublicRoute && isAuthenticated && user) {
      router.push(user.role === "ADMIN" ? "/admin" : "/dashboard");
      return;
    }

    if (isPublicRoute) {
      return;
    }

    // Protected routes: must be authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  return { user, isLoading, isAuthenticated };
}
