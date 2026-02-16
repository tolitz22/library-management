export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/library/:path*", "/collections/:path*", "/settings/:path*", "/billing/:path*"],
};
