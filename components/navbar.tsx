"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        scrolled ? "top-0 w-full" : "top-4 w-[90%]"
      }`}
    >
      <div
        className={`border border-white/10 bg-white/[0.06] backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "rounded-none border-t-0 border-x-0" : "rounded-2xl"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-50">
            NamifyAI
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className={
                isActive("/")
                  ? "text-sm font-semibold text-zinc-50"
                  : "text-sm font-semibold text-zinc-300 hover:text-zinc-50"
              }
            >
              Home
            </Link>
            <Link
              href="/#pricing"
              className={
                pathname === "/"
                  ? "text-sm font-semibold text-zinc-300 hover:text-zinc-50"
                  : "text-sm font-semibold text-zinc-300 hover:text-zinc-50"
              }
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className={
                pathname.startsWith("/dashboard")
                  ? "text-sm font-semibold text-zinc-50"
                  : "text-sm font-semibold text-zinc-300 hover:text-zinc-50"
              }
            >
              Dashboard
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {status === "loading" ? (
              <div className="text-sm text-zinc-400">Loading...</div>
            ) : session?.user ? (
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={async () => {
                  await signOut({ redirect: false });
                  router.push("/login");
                  router.refresh();
                }}
              >
                Sign out
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-zinc-200 hover:bg-white/10 hover:text-zinc-50">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="bg-[#2b0a3d] text-white hover:bg-[#3a0f55]">
                  <Link href="/register">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
