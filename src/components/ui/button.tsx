import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border-[2px] px-4 py-2 font-semibold shadow-[4px_4px_0_0_var(--border)] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_0_var(--border)]",
        variant === "default" && "text-[var(--primary-contrast)]",
        variant === "secondary" && "text-[var(--fg)]",
        variant === "ghost" && "text-[var(--fg)]",
        className,
      )}
      style={{
        borderColor: "var(--border)",
        background:
          variant === "default"
            ? "var(--primary)"
            : variant === "secondary"
              ? "var(--highlight)"
              : "var(--surface)",
      }}
      {...props}
    />
  );
}
