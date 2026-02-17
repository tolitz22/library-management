"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ callbackUrl = "/library" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);

    if (res?.error) {
      toast.error("Invalid email or password");
      return;
    }

    toast.success("Welcome back");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      className="w-full min-w-0 space-y-5 rounded-[24px] border-[2px] border-[#252525] bg-[#e6e6e6] p-5 shadow-[7px_7px_0_0_#252525] sm:p-6"
      onSubmit={onSubmit}
    >
      <h2 className="text-4xl font-extrabold tracking-tight text-[#111827]">Login</h2>

      <div className="space-y-4">
        <Input
          id="login-email"
          name="email"
          autoComplete="username"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-14 w-full rounded-[18px] border-[2px] border-[#252525] bg-white px-4 text-base shadow-[4px_4px_0_0_#252525] placeholder:text-[#94a3b8]"
        />

        <Input
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-14 w-full rounded-[18px] border-[2px] border-[#252525] bg-white px-4 text-base shadow-[4px_4px_0_0_#252525] placeholder:text-[#94a3b8]"
        />
      </div>

      <Button
        type="submit"
        className="h-14 w-full rounded-[18px] border-[2px] border-[#252525] bg-gradient-to-r from-[#5d5ce7] to-[#665ef0] text-xl font-semibold text-white shadow-[4px_4px_0_0_#252525] hover:opacity-95"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-[28px] leading-tight text-[#334155]">
        New here?{" "}
        <Link className="underline" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}
