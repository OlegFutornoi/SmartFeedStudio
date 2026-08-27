import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div
      data-testid="admin-dashboard-loading"
      className="space-y-6 animate-pulse max-w-7xl mx-auto"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-muted rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded-full" />
            </div>
            <div className="h-7 w-20 bg-muted/80 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border/40">
          <div className="h-5 w-36 bg-muted rounded" />
          <div className="h-8 w-48 bg-muted rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
