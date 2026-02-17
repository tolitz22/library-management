"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      {children}
    </SessionProvider>
  );
}
