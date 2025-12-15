"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[140px]" />
        <div className="absolute -left-48 top-1/4 h-[520px] w-[520px] rounded-full bg-[#0b2a3a]/25 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-zinc-50 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-2 text-sm text-zinc-300">Set a new password for your account.</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            try {
              const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, password }),
              });
              if (!res.ok) {
                const json = await res.json().catch(() => null);
                setError(json?.error ?? "Unable to reset password");
                return;
              }
              router.push("/login");
            } catch {
              setError("Unable to reset password");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <input type="hidden" value={email} readOnly />
          <input type="hidden" value={token} readOnly />

          <div className="space-y-2">
            <label className="text-sm font-medium">New password</label>
            <input
              className="h-11 w-full rounded-md border border-white/15 bg-white/90 px-3 text-sm text-black outline-none placeholder:text-zinc-500 focus:border-white/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-white/10 text-sm font-medium text-zinc-50 hover:bg-white/15 disabled:opacity-60"
            type="submit"
          >
            {isLoading ? "Saving..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen overflow-hidden bg-background">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[140px]" />
            <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>
          <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-zinc-50 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <p className="text-sm text-zinc-300">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
