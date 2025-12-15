"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SignOutButton from "@/app/dashboard/_components/sign-out-button";

export default function DashboardSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/generate", label: "Generate" },
    { href: "/dashboard/billing", label: "Billing" },
  ];

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-50">NamifyAI</div>
            <div className="mt-1 text-xs text-zinc-400 truncate">{email}</div>
          </div>
        </div>

        <nav className="mt-6 grid gap-1">
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

        <div className="mt-4">
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
