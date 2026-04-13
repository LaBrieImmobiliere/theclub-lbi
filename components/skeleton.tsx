export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-100 divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-100 p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonList rows={4} />
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-6">
      {/* Header row */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`${r}-${c}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <Skeleton className="h-5 w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
