"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

function titleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.startsWith("/dashboard/history")) return "History";
  if (pathname.startsWith("/dashboard/generate")) return "Generate";
  if (pathname.startsWith("/dashboard/billing")) return "Billing";
  return "Dashboard";
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  const tabs = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/history", label: "History" },
    { href: "/dashboard/generate", label: "Generate" },
    { href: "/dashboard/billing", label: "Billing" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-50">{title}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {title === "Overview" ? "Your usage, plan, and saved names." : null}
            {title === "History" ? "Browse all your saved generated names." : null}
            {title === "Generate" ? "Create and save new name ideas." : null}
            {title === "Billing" ? "Upgrade or manage your subscription." : null}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
          >
            <Link href="/dashboard/generate">Generate</Link>
          </Button>
          <Button asChild size="sm" className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
            <Link href="/dashboard/billing">Upgrade</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                active
                  ? "whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-50"
                  : "whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/8 hover:text-zinc-50"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
