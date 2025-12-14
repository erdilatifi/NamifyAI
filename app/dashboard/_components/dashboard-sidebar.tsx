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
    <Card>
      <CardContent className="p-4">
        <div className="text-sm font-semibold">NamifyAI</div>
        <div className="mt-1 text-xs text-zinc-500 truncate">{email}</div>

        <nav className="mt-6 grid gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={isActive ? "w-full justify-start" : "w-full justify-start"}
                size="sm"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>

        <SignOutButton />
      </CardContent>
    </Card>
  );
}
