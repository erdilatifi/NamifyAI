"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      type="button"
      disabled={isLoading}
      variant="outline"
      className="mt-4 w-full justify-start"
      onClick={async () => {
        setIsLoading(true);
        try {
          await signOut({ redirect: false });
        } finally {
          router.push("/login");
          router.refresh();
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
