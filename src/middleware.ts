import nextAuthMiddleware from "next-auth/middleware";

export default function middleware(...args: Parameters<typeof nextAuthMiddleware>) {
  return nextAuthMiddleware(...args);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
