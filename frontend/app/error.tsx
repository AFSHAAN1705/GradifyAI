"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-[var(--danger)]" aria-hidden />
      <div>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error.message}</p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden />
        Retry
      </Button>
    </main>
  );
}
