"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import SignOutButton from "@/app/dashboard/_components/sign-out-button";

type UsageResponse = {
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
};

export default function DashboardSidebar({ email }: { email: string }) {
  const pathname = usePathname();

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

  const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/history", label: "History" },
    { href: "/dashboard/generate", label: "Generate" },
    { href: "/dashboard/billing", label: "Billing" },
  ];

  const status = usageQuery.data?.status ?? null;
  const needsAttention = status === "PAST_DUE" || status === "UNPAID" || status === "INCOMPLETE";

  return (
    <div className="h-full w-full border-r border-white/10 bg-white/[0.03] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      <div className="flex h-full flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-50">NamifyAI</div>
            <div className="mt-1 truncate text-xs text-zinc-400">{email}</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Plan</div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">
                {usageQuery.isLoading ? "…" : usageQuery.data?.plan ?? "—"}
              </div>
            </div>
            <div
              className={
                needsAttention
                  ? "rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-200"
                  : usageQuery.data?.plan === "PRO"
                    ? "rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                    : "rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200"
              }
            >
              {needsAttention ? "Action" : usageQuery.data?.plan === "PRO" ? "Paid" : "Free"}
            </div>
          </div>
          <div className="mt-3">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
            >
              <Link href="/dashboard/billing">Manage</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Workspace
          </div>
          <nav className="mt-2 grid gap-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={
                    isActive
                      ? "w-full justify-start bg-white/10 text-zinc-50 hover:bg-white/12"
                      : "w-full justify-start text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                  }
                  size="sm"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto pt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
