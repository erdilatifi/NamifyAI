"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <Card>
          <CardHeader>
            <CardTitle>Log in to NamifyAI</CardTitle>
            <CardDescription>Welcome back. Generate and save brandable names.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            try {
              const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
              });
              if (res?.error) {
                setError(res.error ?? "Unable to sign in");
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
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button disabled={isLoading} className="w-full" type="submit">
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <Button
                type="button"
                disabled={isLoading}
                variant="outline"
                className="w-full"
                onClick={async () => {
                  setError(null);
                  setIsLoading(true);
                  try {
                    await signIn("google", { callbackUrl: "/dashboard" });
                  } catch {
                    setError("Unable to sign in with Google");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Continue with Google
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-600">
              <Link className="font-medium text-black" href="/forgot-password">
                Forgot your password?
              </Link>
              <div>
                Don&apos;t have an account?{" "}
                <Link className="font-medium text-black" href="/register">
                  Create one
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
