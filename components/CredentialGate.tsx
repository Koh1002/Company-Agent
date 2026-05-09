"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/credentials";

export function CredentialGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const c = loadCredentials();
    if (!c) {
      router.replace("/");
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[var(--color-fg-muted)]">
        資格情報を確認しています...
      </div>
    );
  }
  return <>{children}</>;
}
