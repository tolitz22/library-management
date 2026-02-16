import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  iconPath?: string;
};

export function Button({ className, variant = "default", iconPath, children, ...props }: ButtonProps) {
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
    >
      {iconPath ? (
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-sm"
          style={{
            backgroundImage: `url(${iconPath})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
