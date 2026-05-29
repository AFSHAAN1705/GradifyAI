"use client";

import { useProtectedRoute } from "@/lib/use-protected-route";
import { AdmissionsDashboard } from "@/features/admissions/admissions-dashboard";
import { PdfUploadPanel } from "@/features/admin/pdf-upload-panel";
import { SamFloatingButton } from "@/features/ai-chat/chat-panel";
import { AuthPanel } from "@/features/auth/auth-panel";
import { TrendsPanel } from "@/features/trends/trends-panel";

export default function HomePage() {
  const { isLoading } = useProtectedRoute();

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

  return (
    <>
      <AdmissionsDashboard />
      <SamFloatingButton />
      <section id="admin" className="mx-auto grid max-w-7xl gap-6 px-6 pb-8 lg:grid-cols-3">
        <AuthPanel />
        <PdfUploadPanel />
        <TrendsPanel />
      </section>
    </>
  );
}
