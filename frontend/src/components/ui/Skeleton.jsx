export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className={`w-full ${height}`} />
    </div>
  );
}

export function ProductRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 border border-gray-100 bg-white">
      <div className="flex flex-col flex-1 gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-10 shrink-0" />
      <Skeleton className="h-7 w-16 rounded-md shrink-0" />
    </div>
  );
}

export function HistoryRowSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}
