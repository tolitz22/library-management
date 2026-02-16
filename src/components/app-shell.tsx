"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LayoutDashboard, Layers, Settings, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/collections", label: "Collections", icon: Layers },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

type ThemeTemplate =
  | "classic-neo"
  | "jake"
  | "spongebob"
  | "naruto"
  | "demonslayer"
  | "onepiece";
type ThemeMode = "light" | "dark";

const TEMPLATE_KEY = "library_theme_template_v1";
const MODE_KEY = "library_theme_mode_v1";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [themeTemplate, setThemeTemplate] = useState<ThemeTemplate>("classic-neo");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTemplate = localStorage.getItem(TEMPLATE_KEY) as ThemeTemplate | null;
    const savedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;

    const template = savedTemplate ?? "classic-neo";
    const mode = savedMode ?? "light";

    setThemeTemplate(template);
    setThemeMode(mode);
    document.documentElement.setAttribute("data-theme-template", template);
    document.documentElement.setAttribute("data-theme-mode", mode);
  }, []);

  function onChangeTemplate(next: ThemeTemplate) {
    setThemeTemplate(next);
    localStorage.setItem(TEMPLATE_KEY, next);
    document.documentElement.setAttribute("data-theme-template", next);
  }

  function onChangeMode(next: ThemeMode) {
    setThemeMode(next);
    localStorage.setItem(MODE_KEY, next);
    document.documentElement.setAttribute("data-theme-mode", next);
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[240px_1fr]">
      <aside className="brutal-card playful-surface h-fit lg:sticky lg:top-4">
        <h1 className="mb-4 text-xl font-bold">My Library</h1>
        <nav className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-[2px] px-3 py-2 font-medium shadow-[2px_2px_0_0_var(--border)]",
                  active
                    ? "-rotate-1"
                    : "hover:-rotate-1",
                )}
                style={{
                  borderColor: "var(--border)",
                  background: active ? "var(--primary)" : "var(--surface)",
                  color: active ? "var(--primary-contrast)" : "var(--fg)",
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="space-y-4">
        <header className="brutal-card playful-surface flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-zinc-500">Personal reading companion</p>
            <h2 className="text-2xl font-bold">Stay close to your books</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="sticker-note">Reading mode</span>

            <select
              className="brutal-input h-10 w-[180px]"
              value={themeTemplate}
              onChange={(e) => onChangeTemplate(e.target.value as ThemeTemplate)}
              aria-label="Design template"
            >
              <option value="classic-neo">Classic Neo</option>
              <option value="jake">Jake Adventure Time</option>
              <option value="spongebob">SpongeBob</option>
              <option value="naruto">Naruto</option>
              <option value="demonslayer">Demon Slayer</option>
              <option value="onepiece">One Piece</option>
            </select>

            <select
              className="brutal-input h-10 w-[110px]"
              value={themeMode}
              onChange={(e) => onChangeMode(e.target.value as ThemeMode)}
              aria-label="Theme mode"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <div
              className="rounded-xl border-[2px] px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_0_var(--border)]"
              style={{ borderColor: "var(--border)", background: "var(--highlight)", color: "var(--highlight-contrast)" }}
            >
              Angelito&apos;s Space
            </div>

            {session?.user ? (
              <button className="brutal-btn text-sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="brutal-btn text-sm">
                  Login
                </Link>
                <Link href="/register" className="brutal-btn text-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
