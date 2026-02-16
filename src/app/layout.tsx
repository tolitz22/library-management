import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ShellGate } from "@/components/shell-gate";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Personal Library SaaS",
  description: "A calm, bold reading companion with neo-brutalist character.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ShellGate>{children}</ShellGate>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
