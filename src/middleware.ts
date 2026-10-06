export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/tutor/:path*", "/api/chat/:path*", "/api/progress/:path*"],
};
