"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";

type UsageResponse = {
  usedCredits: number;
  limit: number;
  plan: "FREE" | "PRO";
};

export default function BillingPage() {
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-zinc-600">Upgrade to Pro or manage your subscription.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 p-4">
            <div className="text-sm font-medium">Current plan</div>
            <div className="mt-2 text-2xl font-semibold">
              {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {usageQuery.data ? `${usageQuery.data.usedCredits} used / ${usageQuery.data.limit} limit` : ""}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 p-4">
            <div className="text-sm font-medium">Actions</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
                disabled={checkoutMutation.isPending || usageQuery.data?.plan === "PRO"}
                onClick={() => checkoutMutation.mutate()}
                type="button"
              >
                Upgrade to Pro
              </button>
              <button
                className="h-10 rounded-md border border-zinc-200 px-4 text-sm font-medium disabled:opacity-60"
                disabled={portalMutation.isPending}
                onClick={() => portalMutation.mutate()}
                type="button"
              >
                Manage billing
              </button>
              <Link className="h-10 inline-flex items-center rounded-md border border-zinc-200 px-4 text-sm font-medium" href="/dashboard">
                Back
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-zinc-500">
          Webhooks update your plan automatically after payment.
        </div>
      </div>
    </div>
  );
}
