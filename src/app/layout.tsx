import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ShellGate } from "@/components/shell-gate";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Personal Library SaaS",
  description: "A calm, bold reading companion with neo-brutalist character.",
  manifest: "/manifest.webmanifest",
  applicationName: "Personal Library",
  appleWebApp: {
    capable: true,
    title: "Personal Library",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#6c63ff",
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
