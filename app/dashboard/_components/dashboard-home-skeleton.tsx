"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-3 w-56" />
              <div className="mt-5 flex items-end justify-between gap-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="px-4 pb-4">
                  <Skeleton className="h-[180px] w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
              <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2">
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-24" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-16" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <div className="bg-white/[0.04] px-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
              <div className="h-px bg-white/10" />
              <div className="bg-white/[0.03] px-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-44" />
              </div>
              <div className="h-px bg-white/10" />
              <div className="bg-white/[0.03] px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-44" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-6 w-14" />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-14" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
