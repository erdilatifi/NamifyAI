"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-zinc-600">
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
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
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
            className="h-11 w-full rounded-md bg-black text-sm font-medium text-white disabled:opacity-60"
            type="submit"
          >
            {isLoading ? "Sending..." : "Send reset link"}
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
