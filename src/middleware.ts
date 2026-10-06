export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tutor/:path*",
    "/settings/:path*",
    "/api/chat/:path*",
    "/api/progress/:path*",
    "/api/settings/:path*",
  ],
};
