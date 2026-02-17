"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LayoutDashboard, Layers, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/collections", label: "Collections", icon: Layers },
];

type ThemeTemplate =
  | "classic-neo"
  | "jake"
  | "spongebob"
  | "naruto"
  | "demonslayer"
  | "onepiece";
type ThemeMode = "light" | "dark";

type SidebarBook = {
  id: string;
  title: string;
  author: string;
};

const TEMPLATE_KEY = "library_theme_template_v1";
const MODE_KEY = "library_theme_mode_v1";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [themeTemplate, setThemeTemplate] = useState<ThemeTemplate>("classic-neo");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<SidebarBook[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);

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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!session?.user?.id) {
      setBookResults([]);
      return;
    }

    const q = bookQuery.trim();
    if (q.length < 2) {
      setBookResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSearchingBooks(true);
        const res = await fetch(`/api/books/user-search?q=${encodeURIComponent(q)}&limit=8`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setBookResults([]);
          return;
        }

        const data = (await res.json()) as { books: SidebarBook[] };
        setBookResults(data.books ?? []);
      } catch {
        setBookResults([]);
      } finally {
        setSearchingBooks(false);
      }
    }, 280);

    return () => clearTimeout(t);
  }, [bookQuery, session?.user?.id, pathname]);

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

  function SidebarContent({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
    return (
      <div className={cn("min-w-0", mobile && "flex h-full flex-col")}>
        <h1 className="mb-4 text-xl font-bold">My Library</h1>
        <nav className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border-[2px] px-3 py-2 font-medium shadow-[2px_2px_0_0_var(--border)]",
                  active ? "-rotate-1" : "hover:-rotate-1",
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

        {session?.user && (
          <section className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Owned books</p>
            <input
              className="brutal-input h-11 text-sm"
              placeholder="Search title/author"
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
            />

            {bookQuery.trim().length >= 2 ? (
              <div className="max-h-56 space-y-1 overflow-auto pr-1">
                {searchingBooks ? (
                  <p className="text-xs text-zinc-500">Searching...</p>
                ) : bookResults.length ? (
                  bookResults.map((book) => (
                    <Link
                      key={book.id}
                      href={`/library/${book.id}`}
                      onClick={onNavigate}
                      className="block rounded-lg border-[2px] px-2 py-2 text-sm font-medium shadow-[2px_2px_0_0_var(--border)]"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
                    >
                      <span className="line-clamp-1">{book.title}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No matching books.</p>
                )}
              </div>
            ) : null}
          </section>
        )}

        {mobile ? (
          <section className="mt-auto space-y-2 border-t-[2px] pt-3" style={{ borderColor: "var(--border)" }}>
            {session?.user ? (
              <button
                className="brutal-btn mt-2 min-h-11 w-full text-sm"
                onClick={() => {
                  onNavigate?.();
                  signOut({ callbackUrl: "/login" });
                }}
              >
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link href="/login" onClick={onNavigate} className="brutal-btn min-h-11 text-sm">
                  Login
                </Link>
                <Link href="/register" onClick={onNavigate} className="brutal-btn min-h-11 text-sm">
                  Register
                </Link>
              </div>
            )}
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-2 pt-2 sm:px-4 lg:hidden">
        <div className="brutal-card playful-surface sticky top-2 z-30 flex items-center justify-between px-3 py-2">
          <p className="text-base font-bold">My Library</p>
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="brutal-btn flex min-h-11 min-w-11 items-center justify-center p-2"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="brutal-card playful-surface absolute bottom-2 left-2 top-2 w-[min(86vw,320px)] overflow-auto p-4">
            <SidebarContent mobile onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-3 p-2 sm:gap-4 sm:p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="brutal-card playful-surface hidden h-fit min-w-0 lg:sticky lg:top-4 lg:block">
          <SidebarContent />
        </aside>

        <div className="min-w-0 space-y-4">
          <header className="brutal-card playful-surface flex min-w-0 flex-col justify-between gap-3 sm:gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-zinc-500">Personal reading companion</p>
              <h2 className="text-2xl font-bold">Stay close to your books</h2>
            </div>

            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <span className="sticker-note">Reading mode</span>

              <select
                className="brutal-input h-11 w-full min-w-0 sm:w-[180px]"
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
                className="brutal-input h-11 w-full min-w-0 sm:w-[110px]"
                value={themeMode}
                onChange={(e) => onChangeMode(e.target.value as ThemeMode)}
                aria-label="Theme mode"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>

              <div
                className="hidden rounded-xl border-[2px] px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_0_var(--border)] lg:block"
                style={{ borderColor: "var(--border)", background: "var(--highlight)", color: "var(--highlight-contrast)" }}
              >
                {session?.user?.name ? `${session.user.name}'s Space` : "My Space"}
              </div>

              {session?.user ? (
                <button className="brutal-btn hidden min-h-11 text-sm lg:inline-flex" onClick={() => signOut({ callbackUrl: "/login" })}>
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login" className="brutal-btn hidden min-h-11 text-sm lg:inline-flex">
                    Login
                  </Link>
                  <Link href="/register" className="brutal-btn hidden min-h-11 text-sm lg:inline-flex">
                    Register
                  </Link>
                </>
              )}
            </div>
          </header>
          {children}
        </div>
      </div>
    </>
  );
}
