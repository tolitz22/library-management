import nextAuthMiddleware from "next-auth/middleware";

export default function middleware(...args: Parameters<typeof nextAuthMiddleware>) {
  return nextAuthMiddleware(...args);
}

export const config = {
  matcher: ["/library/:path*", "/collections/:path*", "/settings/:path*", "/billing/:path*"],
};
