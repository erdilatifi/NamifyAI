import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/35 blur-[170px]" />
        <div className="absolute -right-56 top-1/3 h-[620px] w-[620px] rounded-full bg-[#0b2a3a]/18 blur-[190px]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:260px_260px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.72)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-6 pt-28">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-44" />
              <div className="mt-6 grid gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="mt-4 h-9 w-full" />
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:col-span-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
                <div className="mt-5 flex items-end justify-between gap-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="mt-4 h-2 w-full rounded-full" />
                <Skeleton className="mt-4 h-8 w-28" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-2 h-3 w-28" />
                <Skeleton className="mt-5 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-24" />
                <Skeleton className="mt-4 h-8 w-full" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-2 h-3 w-28" />
                <Skeleton className="mt-5 h-8 w-14" />
                <Skeleton className="mt-2 h-3 w-28" />
                <Skeleton className="mt-4 h-8 w-full" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="mt-2 h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-32" />
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
                <div className="space-y-0">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-4 py-3 last:border-b-0">
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
          </main>
        </div>
      </div>
    </div>
  );
}
