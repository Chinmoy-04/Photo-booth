"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch("/api/gate", { method: "DELETE" });
    } catch {
      /* still send them to the gate */
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleLogout();
      }}
      disabled={isLoggingOut}
      className={
        className ??
        "cursor-pointer text-xs uppercase tracking-[0.15em] text-secondary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
      }
    >
      {isLoggingOut ? "Signing out…" : "Lock site"}
    </button>
  );
}
