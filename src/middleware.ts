import { NextResponse, type NextRequest } from "next/server";
import {
  decidePreview,
  PREVIEW_COOKIE_NAME,
  PREVIEW_TTL_SECONDS,
} from "@/lib/auth/preview-gate";

// This middleware runs on the Edge runtime, where firebase-admin cannot run.
// It only checks for the *presence* of the session cookie and short-circuits
// obviously unauthenticated requests. Every /admin page and every mutating
// API route still calls requireSuperadmin() server-side, which is what
// actually verifies the cookie and the superadmin claim.

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "__biblioteca_session";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PROTECTED_API_PREFIXES = [
  "/api/recetas",
  "/api/ingredientes",
  "/api/alergenos",
  "/api/tecnicas",
  "/api/menus",
  "/api/usuarios",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Guard /admin/**
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Soft gate: anonymous visitors can open 3 recipe detail pages before we
  // ask them to create an account. Logged-in users (session cookie present)
  // bypass the gate entirely.
  const recipeMatch = pathname.match(/^\/recetas\/([^/]+)\/?$/);
  if (recipeMatch && req.method === "GET" && !hasSession) {
    const slug = decodeURIComponent(recipeMatch[1]);
    const cookieValue = req.cookies.get(PREVIEW_COOKIE_NAME)?.value;
    const decision = decidePreview(cookieValue, slug);
    if (decision.action === "gate") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}&reason=preview`;
      return NextResponse.redirect(url);
    }
    if (decision.action === "allow-and-record") {
      const res = NextResponse.next();
      res.cookies.set(PREVIEW_COOKIE_NAME, decision.nextValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: PREVIEW_TTL_SECONDS,
      });
      return res;
    }
    // decision.action === "allow" — fall through
  }

  // Guard mutating API routes.
  if (MUTATING_METHODS.has(req.method)) {
    const isProtected = PROTECTED_API_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isProtected && !hasSession) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar esta acción." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/recetas/:slug",
    "/api/recetas/:path*",
    "/api/ingredientes/:path*",
    "/api/alergenos/:path*",
    "/api/tecnicas/:path*",
    "/api/menus/:path*",
    "/api/usuarios/:path*",
  ],
};
