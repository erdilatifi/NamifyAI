"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[140px]" />
        <div className="absolute -right-48 top-1/4 h-[520px] w-[520px] rounded-full bg-[#0b2a3a]/25 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-6 pb-16 pt-6 sm:min-h-[calc(100vh-6rem)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-zinc-50 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Enter your email and we&apos;ll send you a reset link.
          </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            try {
              const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              if (!res.ok) {
                setError("Unable to request reset link");
                return;
              }
              setDone(true);
            } catch {
              setError("Unable to request reset link");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="h-11 w-full rounded-md border border-white/15 bg-white/90 px-3 text-sm text-black outline-none placeholder:text-zinc-500 focus:border-white/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {done ? (
            <p className="text-sm text-green-700">
              If an account exists, a reset link has been sent.
            </p>
          ) : null}

          <button
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-white/10 text-sm font-medium text-zinc-50 hover:bg-white/15 disabled:opacity-60"
            type="submit"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-300">
          <Link className="font-medium text-zinc-50" href="/login">
            Back to login
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
