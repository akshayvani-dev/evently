import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-[#1A1713]/10', className)}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-[#1A1713]/12 bg-white/55 backdrop-blur-md p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <div className="mt-2.5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-5 space-y-2.5 border-t border-[#1A1713]/10 pt-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="mt-4 h-11 w-full rounded-xl" />
    </div>
  );
}
