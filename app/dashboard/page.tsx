"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
    isFavorite: boolean;
  }>;
};

export default function DashboardHomePage() {
  const queryClient = useQueryClient();

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
      const res = await fetch("/api/names?limit=8", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (input: { id: string; favorite: boolean }) => {
      const res = await fetch("/api/names/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedNameId: input.id, favorite: input.favorite }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["names"] });
    },
  });

  const remaining =
    usageQuery.data ? Math.max(0, usageQuery.data.limit - usageQuery.data.usedCredits) : null;

  const usedPct = usageQuery.data
    ? usageQuery.data.limit > 0
      ? (usageQuery.data.usedCredits / usageQuery.data.limit) * 100
      : 0
    : 0;

  const savedCount = namesQuery.data?.items?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-300">Usage remaining</CardTitle>
            <CardDescription className="text-xs text-zinc-400">Credits left this month</CardDescription>
          </CardHeader>
          <CardContent>
            {usageQuery.isError ? (
              <p className="text-sm text-zinc-400">Unable to load usage.</p>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold tracking-tight text-zinc-50">
                    {usageQuery.isLoading ? "…" : remaining ?? "—"}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {usageQuery.data ? `${usageQuery.data.usedCredits} / ${usageQuery.data.limit}` : ""}
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={usageQuery.isLoading ? 0 : usedPct} />
                </div>
                {usageQuery.data?.plan === "FREE" && remaining !== null && remaining <= 0 ? (
                  <div className="mt-4">
                    <Button asChild size="sm" className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
                      <Link href="/dashboard/billing">Upgrade to Pro</Link>
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-300">Plan</CardTitle>
            <CardDescription className="text-xs text-zinc-400">Current subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-zinc-50">
              {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              {usageQuery.data?.plan === "PRO" ? "Pro active" : "Free tier"}
            </div>
            <div className="mt-4">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
              >
                <Link href="/dashboard/billing">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-300">Saved</CardTitle>
            <CardDescription className="text-xs text-zinc-400">Recent names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-zinc-50">
              {namesQuery.isLoading ? "…" : savedCount}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Last 8 saved names</div>
            <div className="mt-4">
              <Button asChild size="sm" className="w-full bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
                <Link href="/dashboard/generate">Generate</Link>
              </Button>
            </div>
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
            <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
              {namesQuery.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-50">{item.name}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                    disabled={favoriteMutation.isPending}
                    onClick={() => {
                      favoriteMutation.mutate({ id: item.id, favorite: !item.isFavorite });
                    }}
                    type="button"
                  >
                    {item.isFavorite ? "Unfavorite" : "Favorite"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-medium text-zinc-50">No saved names yet</div>
              <div className="mt-1 text-sm text-zinc-300">Generate a few ideas and save the ones you like.</div>
              <div className="mt-4">
                <Button asChild className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
                  <Link href="/dashboard/generate">Generate names</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
