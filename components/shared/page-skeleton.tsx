import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Layout-matched page loading placeholders.
 * Use these instead of spinners for page-level data fetching so the
 * layout doesn't jump when content arrives.
 */
export function PageSkeleton({
  variant = "list",
  className,
}: {
  /** metrics: header + 4 stat cards + list · list: header + stacked rows · dashboard: header + 2-col grid */
  variant?: "metrics" | "list" | "dashboard";
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("space-y-6 p-6 md:p-8", className)}
    >
      {/* Header block */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {variant === "metrics" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          ))}
        </div>
      )}

      {variant === "dashboard" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          ))}
        </div>
      )}

      {/* List rows */}
      <div className="space-y-3">
        {Array.from({ length: variant === "metrics" ? 3 : 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4" style={{ width: `${70 - i * 8}%` }} />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
