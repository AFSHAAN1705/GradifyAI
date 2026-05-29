import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}
