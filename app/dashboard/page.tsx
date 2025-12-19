"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import DashboardHomeSkeleton from "@/app/dashboard/_components/dashboard-home-skeleton";

type UsageResponse = {
  periodStart: string;
  periodEnd: string;
  usedCredits: number;
  limit: number;
  plan: "FREE" | "PRO";
};

type NamesResponse = {
  items: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
};

type WeeklyUsageResponse = {
  days: Array<{ date: string; count: number }>;
};


function WeeklyProgressChart({ days }: { days: WeeklyUsageResponse["days"] }) {
  const labels = days.map((d) => {
    try {
      return new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short" });
    } catch {
      return "";
    }
  });

  const max = Math.max(1, ...days.map((d) => d.count));
  const values = days.map((d) => (d.count / max) * 100);

  const width = 560;
  const height = 180;
  const padL = 44;
  const padR = 14;
  const padT = 18;
  const padB = 34;

  const xStep = (width - padL - padR) / (values.length - 1);
  const yToPx = (v: number) => {
    const y = padT + ((100 - v) / 100) * (height - padT - padB);
    return Math.max(padT, Math.min(height - padB, y));
  };

  const points = values.map((v, i) => {
    const x = padL + i * xStep;
    const y = yToPx(v);
    return { x, y, v };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const area = `${path} L ${(padL + (values.length - 1) * xStep).toFixed(2)} ${(height - padB).toFixed(2)} L ${padL.toFixed(2)} ${(height - padB).toFixed(2)} Z`;

  const gridY = [0, 25, 50, 75, 100];
  const labelY = (v: number) => yToPx(v);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-50">Weekly progress</div>
        <div className="text-xs text-zinc-400">Last 7 days</div>
      </div>
      <div className="px-4 pb-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[180px] w-full"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <filter id="weeklyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gridY.map((v) => (
            <g key={v}>
              <line
                x1={padL}
                x2={width - padR}
                y1={labelY(v)}
                y2={labelY(v)}
                stroke="rgba(255,255,255,0.10)"
                strokeDasharray="4 6"
              />
              <text
                x={padL - 10}
                y={labelY(v) + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(255,255,255,0.45)"
              >
                {v}%
              </text>
            </g>
          ))}

          {labels.map((d, i) => (
            <text
              key={d}
              x={padL + i * xStep}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(255,255,255,0.55)"
            >
              {d}
            </text>
          ))}

          <path d={area} fill="url(#weeklyFill)" />
          <path d={path} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" filter="url(#weeklyGlow)" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={6} fill="#0b0b10" stroke="#a855f7" strokeWidth={2} />
              <circle cx={p.x} cy={p.y} r={2.25} fill="#a855f7" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function formatRange(start?: string, end?: string) {
  if (!start || !end) return null;
  try {
    const s = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const e = new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${s} – ${e}`;
  } catch {
    return null;
  }
}

export default function DashboardHomePage() {
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const namesQuery = useQuery({
    queryKey: ["names"],
    queryFn: async (): Promise<NamesResponse> => {
      const res = await fetch("/api/names?limit=3", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const weeklyUsageQuery = useQuery({
    queryKey: ["usage-weekly"],
    queryFn: async (): Promise<WeeklyUsageResponse> => {
      const res = await fetch("/api/usage/weekly", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isDashboardLoading =
    usageQuery.isLoading ||
    namesQuery.isLoading ||
    weeklyUsageQuery.isLoading;

  if (isDashboardLoading) {
    return <DashboardHomeSkeleton />;
  }

  const remaining =
    usageQuery.data ? Math.max(0, usageQuery.data.limit - usageQuery.data.usedCredits) : null;

  const usedPct = usageQuery.data
    ? usageQuery.data.limit > 0
      ? (usageQuery.data.usedCredits / usageQuery.data.limit) * 100
      : 0
    : 0;

  const savedCount = namesQuery.data?.items?.length ?? 0;

  const billingRange = formatRange(usageQuery.data?.periodStart, usageQuery.data?.periodEnd);

  const emptyWeeklyDays: WeeklyUsageResponse["days"] = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - idx));
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
    return { date: key, count: 0 };
  });

  const weeklyDays = weeklyUsageQuery.data?.days ?? emptyWeeklyDays;
  const weeklyTotal = weeklyDays.reduce((sum, d) => sum + d.count, 0);
  const bestDay = weeklyDays.reduce(
    (best, d) => (d.count > best.count ? d : best),
    weeklyDays[0] ?? { date: "", count: 0 }
  );

  const bestDayLabel = (() => {
    if (!bestDay?.date) return "—";
    try {
      return new Date(bestDay.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short" });
    } catch {
      return "—";
    }
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="grid gap-4">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-300">Usage</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  {billingRange ? `Billing period: ${billingRange}` : "Credits used this month"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageQuery.isError ? (
                  <p className="text-sm text-zinc-400">Unable to load usage.</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="text-3xl font-semibold tracking-tight text-zinc-50">
                        {usageQuery.isLoading ? "…" : remaining ?? "—"}
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-xs text-zinc-400">
                          {usageQuery.data ? `${usageQuery.data.usedCredits} / ${usageQuery.data.limit}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={usageQuery.isLoading ? 0 : usedPct} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
                        <Link href="/dashboard/generate">Generate names</Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                      >
                        <Link href="/dashboard/billing">Manage billing</Link>
                      </Button>
                    </div>

                    {weeklyUsageQuery.isError ? (
                      <p className="mt-4 text-sm text-zinc-400">Unable to load weekly progress.</p>
                    ) : (
                      <WeeklyProgressChart days={weeklyUsageQuery.data?.days ?? emptyWeeklyDays} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base text-zinc-50">Recent saved names</CardTitle>
                <CardDescription className="text-zinc-400">Your latest saved ideas</CardDescription>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
              >
                <Link href="/dashboard/generate">Generate more</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {namesQuery.isError ? (
                <p className="text-sm text-zinc-400">Unable to load saved names.</p>
              ) : namesQuery.isLoading ? (
                <p className="text-sm text-zinc-400">Loading…</p>
              ) : namesQuery.data?.items?.length ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-300">
                    <div>Name</div>
                    <div>Action</div>
                  </div>
                  <div className="divide-y divide-white/10">
                    {namesQuery.data.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 bg-white/[0.03] px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-50">{item.name}</div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10">
                          <Link href="/dashboard/history">View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-sm font-medium text-zinc-50">No saved names yet</div>
                  <div className="mt-1 text-sm text-zinc-300">Generate a few ideas and save the ones you like.</div>
                  <div className="mt-4">
                    <Button asChild size="sm" className="h-8 w-fit bg-[#6b2a8f] px-3 text-white hover:bg-[#7b34a5]">
                      <Link href="/dashboard/generate">Generate names</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Quick actions</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Move faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">This week</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-50">
                    {weeklyUsageQuery.isLoading ? "…" : `${weeklyTotal} saved`}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {weeklyUsageQuery.isLoading ? "" : `Best day: ${bestDayLabel} (${bestDay.count})`}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Recent saves</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-50">
                    {namesQuery.isLoading ? "…" : savedCount}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">Your latest saved ideas</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <Link
                  href="/dashboard/generate"
                  className="flex items-center justify-between gap-4 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">Generate names</div>
                    <div className="truncate text-xs text-zinc-400">Start a new brainstorm</div>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.22 4.22a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L11.69 10 7.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                <div className="h-px bg-white/10" />

                <Link
                  href="/dashboard"
                  className="flex items-center justify-between gap-4 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">Review saved ideas</div>
                    <div className="truncate text-xs text-zinc-400">Favorite, refine, or regenerate</div>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.22 4.22a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L11.69 10 7.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                <div className="h-px bg-white/10" />

                <Link
                  href="/dashboard/billing"
                  className="flex items-center justify-between gap-4 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">Manage billing</div>
                    <div className="truncate text-xs text-zinc-400">Upgrade, limits, and subscription</div>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.22 4.22a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L11.69 10 7.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Saved this view</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Saved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs text-zinc-400">Recently saved</div>
                  <div className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
                    {namesQuery.isLoading ? "…" : savedCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
