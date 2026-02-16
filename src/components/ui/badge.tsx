import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className={cn("brutal-badge", className)} style={style}>
      {children}
    </span>
  );
}
