"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as null | { error?: string };
        throw new Error(body?.error || "Failed");
      }
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as null | { error?: string };
        throw new Error(body?.error || "Failed");
      }
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-50">Billing</CardTitle>
          <CardDescription>Upgrade to Pro or manage your subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkoutMutation.isError ? (
            <p className="mb-3 text-sm text-red-600">{(checkoutMutation.error as Error).message}</p>
          ) : null}
          {portalMutation.isError ? (
            <p className="mb-3 text-sm text-red-600">{(portalMutation.error as Error).message}</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-zinc-200">Current plan</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-50">
                {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {usageQuery.data ? `${usageQuery.data.usedCredits} used / ${usageQuery.data.limit} limit` : ""}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-zinc-200">Actions</div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  disabled={checkoutMutation.isPending || usageQuery.data?.plan === "PRO"}
                  onClick={() => checkoutMutation.mutate()}
                  className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]"
                  type="button"
                >
                  Upgrade to Pro
                </Button>
                <Button
                  variant="outline"
                  disabled={portalMutation.isPending}
                  onClick={() => portalMutation.mutate()}
                  className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                  type="button"
                >
                  Manage billing
                </Button>
                <Button asChild variant="outline" className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10">
                  <Link href="/dashboard">Back</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-zinc-400">
            Webhooks update your plan automatically after payment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
