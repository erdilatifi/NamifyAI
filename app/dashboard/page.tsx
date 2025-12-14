"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Generate new business names, save favorites, and manage your subscription.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white"
            href="/dashboard/generate"
          >
            Generate names
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">Usage</div>
          <div className="mt-2 text-2xl font-semibold">
            {usageQuery.isLoading ? "…" : remaining ?? "—"}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {usageQuery.data
              ? `${usageQuery.data.usedCredits} used / ${usageQuery.data.limit} this month`
              : "Credits remaining"}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">Plan</div>
          <div className="mt-2 text-2xl font-semibold">
            {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {usageQuery.data?.plan === "PRO"
              ? "Pro subscription active"
              : "Free tier"}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Recent saved names</div>
            <div className="mt-1 text-sm text-zinc-500">Your latest saved ideas</div>
          </div>
          <Link className="text-sm font-medium text-black" href="/dashboard/generate">
            Generate more
          </Link>
        </div>

        {namesQuery.isLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : namesQuery.data?.items?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {namesQuery.data.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{item.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm"
                    disabled={favoriteMutation.isPending}
                    onClick={() => {
                      favoriteMutation.mutate({ id: item.id, favorite: !item.isFavorite });
                    }}
                    type="button"
                  >
                    {item.isFavorite ? "Unfavorite" : "Favorite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No saved names yet.</p>
        )}
      </div>
    </div>
  );
}
