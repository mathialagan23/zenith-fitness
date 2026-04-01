import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "page" | "form";
  count?: number;
}

export function LoadingSkeleton({ type = "card", count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl space-y-4">
            <Skeleton className="h-6 w-1/2 bg-secondary" />
            <Skeleton className="h-20 w-full bg-secondary" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-secondary" />
              <Skeleton className="h-4 w-3/4 bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="glass-card p-4 rounded-xl flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg bg-secondary" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-secondary" />
              <Skeleton className="h-3 w-1/2 bg-secondary" />
            </div>
            <Skeleton className="h-8 w-20 bg-secondary" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "form") {
    return (
      <div className="space-y-6">
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
        ))}
        <Skeleton className="h-10 w-full bg-secondary" />
      </div>
    );
  }

  // Page skeleton
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-secondary" />
        <Skeleton className="h-4 w-64 bg-secondary" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto bg-secondary" />
            <Skeleton className="h-4 w-1/2 mx-auto bg-secondary" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl space-y-4">
            <Skeleton className="h-6 w-1/3 bg-secondary" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full bg-secondary" />
              <Skeleton className="h-16 w-full bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
