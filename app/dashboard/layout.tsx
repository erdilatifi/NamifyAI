import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import DashboardSidebar from "@/app/dashboard/_components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/35 blur-[170px]" />
        <div className="absolute -right-56 top-1/3 h-[620px] w-[620px] rounded-full bg-[#0b2a3a]/18 blur-[190px]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:260px_260px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.72)_100%)]" />
      </div>

      <aside className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-40 w-[280px]">
          <DashboardSidebar email={session?.user?.email ?? ""} />
        </div>
      </aside>

      <div className="relative w-full px-6 py-8 lg:pl-[304px] lg:pr-10">
        <div className="mx-auto w-full max-w-7xl">
          <main className="min-w-0">{children}</main>
        </div>

        <div className="mt-6 lg:hidden">
          <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-zinc-50">NamifyAI</div>
              <div className="mt-1 text-xs text-zinc-400">{session?.user?.email ?? ""}</div>

              <nav className="mt-4 grid gap-2">
                <Button asChild variant="ghost" className="w-full justify-start text-zinc-300 hover:bg-white/5 hover:text-zinc-50">
                  <Link href="/dashboard">Overview</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start text-zinc-300 hover:bg-white/5 hover:text-zinc-50">
                  <Link href="/dashboard/generate">Generate</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start text-zinc-300 hover:bg-white/5 hover:text-zinc-50">
                  <Link href="/dashboard/billing">Billing</Link>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
