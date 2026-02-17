"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LayoutDashboard, Layers } from "lucide-react";
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
              className="brutal-input h-9 text-sm"
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
                      className="block rounded-lg border-[2px] px-2 py-1 text-sm font-medium shadow-[2px_2px_0_0_var(--border)]"
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
              {session?.user?.name ? `${session.user.name}'s Space` : "My Space"}
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
