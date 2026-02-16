"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setLoading(false);
      toast.error(data.error ?? "Registration failed");
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    toast.success("Account created");
    router.push("/library");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-md">
      <form className="brutal-card space-y-4" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold">Register</h1>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-sm text-zinc-600">
          Already have an account? <Link className="underline" href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
