import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import DashboardHeader from "@/app/dashboard/_components/dashboard-header";
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
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <header className="mb-6">
          <DashboardHeader />
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <DashboardSidebar email={session?.user?.email ?? ""} />
          </aside>

          <main className="min-w-0">{children}</main>
        </div>

        <div className="mt-6 lg:hidden">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">NamifyAI</div>
              <div className="mt-1 text-xs text-zinc-500">{session?.user?.email ?? ""}</div>

              <nav className="mt-4 grid gap-2">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/dashboard">Overview</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/dashboard/generate">Generate</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
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
