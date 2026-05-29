import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-[var(--muted)]">The route you opened does not exist.</p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b2]"
      >
        Open GradifyAI
      </Link>
    </main>
  );
}
