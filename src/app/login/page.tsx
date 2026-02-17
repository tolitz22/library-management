import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/library");
  }

  const { callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center px-2 py-4 sm:px-4">
      <section className="w-full max-w-md space-y-3">
        <div className="brutal-card playful-surface space-y-2 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-zinc-600">My Library</span>
            <span className="sticker-note">Reading mode</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight sm:text-2xl">Your personal library, always in sync.</h1>
          <p className="text-sm leading-6 text-zinc-700">
            Track books, update progress, and keep notes/highlights in one calm, bold space.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl ?? "/library"} />
      </section>
    </main>
  );
}
