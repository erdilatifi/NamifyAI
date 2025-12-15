import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-6 pb-16 pt-6 sm:min-h-[calc(100vh-6rem)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-zinc-50 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-3 h-4 w-72" />

          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
