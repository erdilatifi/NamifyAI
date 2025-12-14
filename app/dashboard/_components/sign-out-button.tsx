"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={isLoading}
      className="mt-4 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-60"
      onClick={async () => {
        setIsLoading(true);
        try {
          await signOut();
        } finally {
          router.push("/login");
          router.refresh();
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
