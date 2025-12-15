import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] bg-background pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/35 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto w-full max-w-xl px-6 py-20 text-center">
        <div className="text-sm text-zinc-400">Payment successful</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">You’re all set</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Your subscription will be reflected in your dashboard shortly.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
            <Link href="/dashboard/billing">Go to billing</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-zinc-50 hover:bg-white/10">
            <Link href="/dashboard/generate">Start generating</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
