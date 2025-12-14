"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <Card>
          <CardHeader>
            <CardTitle>Create your NamifyAI account</CardTitle>
            <CardDescription>Start generating brandable names in seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            try {
              const created = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
              });

              if (!created.ok) {
                const json = await created.json().catch(() => null);
                setError(json?.error ?? "Unable to sign up");
                return;
              }

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
              setError("Unable to sign up");
            } finally {
              setIsLoading(false);
            }
          }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  required
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button disabled={isLoading} className="w-full" type="submit">
                {isLoading ? "Creating account..." : "Create account"}
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

            <div className="mt-4 text-sm text-zinc-600">
              Already have an account?{" "}
              <Link className="font-medium text-black" href="/login">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
