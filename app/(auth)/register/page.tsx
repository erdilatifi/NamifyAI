"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

function GoogleIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.49 12.27c0-.82-.07-1.61-.2-2.37H12v4.48h6.46a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.55-5.17 3.55-8.78Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.37-2.29v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.1Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.07 15.23 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[140px]" />
        <div className="absolute -left-48 top-1/4 h-[520px] w-[520px] rounded-full bg-[#0b2a3a]/25 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-6 pb-16 pt-6 sm:min-h-[calc(100vh-6rem)]">
        <Card className="border-white/10 bg-white/[0.06] text-zinc-50 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
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
                  className="border-white/15 bg-white/90 text-black placeholder:text-zinc-500"
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
                  className="border-white/15 bg-white/90 text-black placeholder:text-zinc-500"
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
                  className="border-white/15 bg-white/90 text-black placeholder:text-zinc-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                disabled={isLoading}
                className="w-full bg-[#6b2a8f] text-white shadow-lg shadow-[#2b0a3d]/40 hover:bg-[#7b34a5]"
                type="submit"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>

              <Button
                type="button"
                disabled={isLoading}
                variant="outline"
                className="w-full border-white/15 bg-white/90 text-black hover:bg-white"
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
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
            </form>

            <div className="mt-4 text-sm text-zinc-300">
              Already have an account?{" "}
              <Link className="font-medium text-zinc-50" href="/login">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
