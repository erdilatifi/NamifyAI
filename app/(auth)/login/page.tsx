"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Log in to NamifyAI</h1>
        <p className="mt-2 text-sm text-zinc-600">Welcome back. Generate and save brandable names.</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            try {
              const res = await signIn.email({
                email,
                password,
              });
              if (res?.error) {
                setError(res.error.message ?? "Unable to sign in");
                return;
              }
              router.push("/dashboard");
            } catch {
              setError("Unable to sign in");
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-black text-sm font-medium text-white disabled:opacity-60"
            type="submit"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-black" href="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
