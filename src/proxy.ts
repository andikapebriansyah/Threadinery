import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Halaman landing (/) bebas diakses publik
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Jika mengakses /login lama, arahkan ke landing page dengan query ?auth=login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/?auth=login", req.url));
  }

  // Rute terlindungi (Dashboard & Project Workspace)
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/project");

  if (isProtectedPath) {
    const sessionToken =
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    // Jika sesi habis / sudah terlogout / belum pernah login -> redirect kembali ke landing page (/)
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
