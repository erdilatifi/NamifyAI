import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import SignOutButton from "@/app/dashboard/_components/sign-out-button";

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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-8 px-6 py-8">
        <aside className="w-56">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">NamifyAI</div>
              <div className="mt-1 text-xs text-zinc-500">{session?.user?.email ?? ""}</div>

              <nav className="mt-6 grid gap-2">
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

              <SignOutButton />
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
