"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

function titleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.startsWith("/dashboard/generate")) return "Generate";
  if (pathname.startsWith("/dashboard/billing")) return "Billing";
  return "Dashboard";
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-lg font-semibold tracking-tight">{title}</div>
        <div className="mt-1 text-sm text-zinc-600">
          {title === "Overview" ? "Your usage, plan, and saved names." : null}
          {title === "Generate" ? "Create and save new name ideas." : null}
          {title === "Billing" ? "Upgrade or manage your subscription." : null}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/generate">Generate</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard/billing">Billing</Link>
        </Button>
      </div>
    </div>
  );
}
