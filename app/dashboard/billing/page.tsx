"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UsageResponse = {
  usedCredits: number;
  limit: number;
  plan: "FREE" | "PRO";
  status?:
    | "ACTIVE"
    | "TRIALING"
    | "PAST_DUE"
    | "CANCELED"
    | "INCOMPLETE"
    | "INCOMPLETE_EXPIRED"
    | "UNPAID"
    | null;
  periodStart?: string;
  periodEnd?: string;
};

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

export default function BillingPage() {
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const body = (await res.json()) as unknown;
      if (body && typeof body === "object" && "ok" in body && (body as { ok?: unknown }).ok === true) {
        return body as unknown as UsageResponse;
      }
      return body as UsageResponse;
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

  const usedPct = usageQuery.data
    ? usageQuery.data.limit > 0
      ? (usageQuery.data.usedCredits / usageQuery.data.limit) * 100
      : 0
    : 0;

  const range = formatRange(usageQuery.data?.periodStart, usageQuery.data?.periodEnd);

  const plan = usageQuery.data?.plan;
  const isPro = plan === "PRO";
  const status = usageQuery.data?.status ?? null;
  const needsAttention = status === "PAST_DUE" || status === "UNPAID" || status === "INCOMPLETE";
  const canceled = status === "CANCELED" || status === "INCOMPLETE_EXPIRED";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-zinc-50">Billing</CardTitle>
            <CardDescription>Manage your plan, usage, and subscription settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {checkoutMutation.isError ? (
              <p className="mb-3 text-sm text-red-600">{(checkoutMutation.error as Error).message}</p>
            ) : null}
            {portalMutation.isError ? (
              <p className="mb-3 text-sm text-red-600">{(portalMutation.error as Error).message}</p>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-200">Current plan</div>
                  <div className="mt-2 flex min-w-0 items-center gap-2">
                    <div className="truncate text-2xl font-semibold text-zinc-50">
                      {usageQuery.isLoading ? "…" : plan ?? "—"}
                    </div>
                    <div
                      className={
                        isPro
                          ? "shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                          : "shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200"
                      }
                    >
                      {isPro ? "Paid" : "Free"}
                    </div>
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-400">{range ? range : "This month"}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-300">
                {needsAttention
                  ? "Your subscription needs attention. Update your payment details in the billing portal to restore Pro access."
                  : canceled
                    ? "Your subscription is inactive. Upgrade again any time to restore Pro access."
                    : plan === "PRO"
                      ? "You’re on Pro. Enjoy higher limits and priority generation."
                      : "You’re on Free. Upgrade any time to unlock higher limits."}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                  <span>Monthly usage</span>
                  <span className="shrink-0">{usageQuery.data ? `${usageQuery.data.usedCredits} / ${usageQuery.data.limit}` : ""}</span>
                </div>
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#6b2a8f]"
                      style={{ width: `${usageQuery.isLoading ? 0 : Math.min(100, Math.max(0, usedPct))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button
                  disabled={checkoutMutation.isPending || isPro}
                  onClick={() => checkoutMutation.mutate()}
                  className="h-9 w-full bg-[#6b2a8f] px-3 text-white hover:bg-[#7b34a5]"
                  type="button"
                >
                  {isPro ? "Pro active" : "Upgrade to Pro"}
                </Button>
                <Button
                  variant="outline"
                  disabled={portalMutation.isPending}
                  onClick={() => portalMutation.mutate()}
                  className="h-9 w-full border-white/15 bg-white/[0.04] px-3 text-zinc-50 hover:bg-white/10"
                  type="button"
                >
                  {needsAttention ? "Fix payment / subscription" : "Manage subscription"}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 w-full border-white/15 bg-white/[0.04] px-3 text-zinc-50 hover:bg-white/10"
                >
                  <Link href="/dashboard">Back to overview</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-zinc-200">What happens after payment?</div>
              <div className="mt-2 text-sm text-zinc-300">
                Your plan updates automatically via Stripe webhooks. If you don’t see changes right away, wait a minute and refresh.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Pro highlights</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Why teams upgrade</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-zinc-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">Higher monthly generation limit</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">Priority generation</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">Manage subscription in Stripe portal</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Help</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="font-medium text-zinc-200">Can I cancel anytime?</div>
                <div className="mt-1 text-xs text-zinc-400">Yes, cancel from the billing portal.</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="font-medium text-zinc-200">Do you offer refunds?</div>
                <div className="mt-1 text-xs text-zinc-400">Contact support and we’ll help depending on the case.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
