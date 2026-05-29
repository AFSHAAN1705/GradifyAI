import { apiFetch } from "./api/client";

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "ADMIN";
};

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("gradify_ai_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("gradify_ai_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("gradify_ai_token");
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  // Skip API call if no token exists — avoids spurious Network Error on fresh loads
  const token = typeof window !== "undefined" ? window.localStorage.getItem("gradify_ai_token") : null;
  if (!token) {
    return null;
  }

  try {
    const user = await apiFetch<User>("/api/auth/me", {
      method: "GET"
    });
    return user;
  } catch (err) {
    console.error("[Auth] fetchCurrentUser failed:", err instanceof Error ? err.message : String(err));
    clearAuthToken();
    return null;
  }
}
