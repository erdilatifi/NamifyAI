import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import SignOutButton from "@/app/dashboard/_components/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-8 px-6 py-8">
        <aside className="w-56">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">NamifyAI</div>
            <div className="mt-1 text-xs text-zinc-500">{session?.user?.email ?? ""}</div>
            <nav className="mt-6 space-y-2 text-sm">
              <Link className="block rounded-md px-3 py-2 hover:bg-zinc-50" href="/dashboard">
                Overview
              </Link>
              <Link className="block rounded-md px-3 py-2 hover:bg-zinc-50" href="/dashboard/generate">
                Generate
              </Link>
              <Link className="block rounded-md px-3 py-2 hover:bg-zinc-50" href="/dashboard/billing">
                Billing
              </Link>
            </nav>

            <SignOutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
