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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm text-zinc-600">Set a new password for your account.</p>

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
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
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
            className="h-11 w-full rounded-md bg-black text-sm font-medium text-white disabled:opacity-60"
            type="submit"
          >
            {isLoading ? "Saving..." : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          <Link className="font-medium text-black" href="/login">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
            <p className="text-sm text-zinc-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
