"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function ShellGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (AUTH_ROUTES.has(pathname)) {
    return <main className="mx-auto max-w-7xl p-4">{children}</main>;
  }

  return <AppShell>{children}</AppShell>;
}
