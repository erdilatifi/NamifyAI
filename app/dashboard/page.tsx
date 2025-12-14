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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Generate new business names, save favorites, and manage your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/generate">Generate names</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
            <CardDescription>Credits remaining this month</CardDescription>
          </CardHeader>
          <CardContent>
            {usageQuery.isError ? (
              <p className="text-sm text-zinc-500">Unable to load usage.</p>
            ) : (
              <>
                <div className="text-2xl font-semibold">
                  {usageQuery.isLoading ? "…" : remaining ?? "—"}
                </div>
                <div className="mt-3">
                  <Progress value={usageQuery.isLoading ? 0 : usedPct} />
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  {usageQuery.data
                    ? `${usageQuery.data.usedCredits} used / ${usageQuery.data.limit} this month`
                    : ""}
                </div>
                {usageQuery.data?.plan === "FREE" && remaining !== null && remaining <= 0 ? (
                  <div className="mt-4">
                    <Button asChild size="sm">
                      <Link href="/dashboard/billing">Upgrade to Pro</Link>
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan</CardTitle>
            <CardDescription>Your current subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {usageQuery.data?.plan === "PRO" ? "Pro subscription active" : "Free tier"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent saved names</CardTitle>
            <CardDescription>Your latest saved ideas</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/generate">Generate more</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {namesQuery.isError ? (
            <p className="text-sm text-zinc-500">Unable to load saved names.</p>
          ) : namesQuery.isLoading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : namesQuery.data?.items?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {namesQuery.data.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={favoriteMutation.isPending}
                      onClick={() => {
                        favoriteMutation.mutate({ id: item.id, favorite: !item.isFavorite });
                      }}
                      type="button"
                    >
                      {item.isFavorite ? "Unfavorite" : "Favorite"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 p-6">
              <div className="text-sm font-medium">No saved names yet</div>
              <div className="mt-1 text-sm text-zinc-600">
                Generate a few ideas and save the ones you like.
              </div>
              <div className="mt-4">
                <Button asChild>
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
