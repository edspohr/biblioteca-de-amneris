import { NextResponse, type NextRequest } from "next/server";

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

// Reader hard-gate is TEMPORARILY DISABLED so Amneris can walk through the
// whole app without fighting the login flow. /admin still requires session,
// and mutating API routes still require session — only READ access to the
// reader (/libro, /recetas, /menus, /tecnicas, /etapas) is open.
// Re-enable once auth flow is validated end-to-end.
const READER_GATE_ENABLED = false;

const READER_PREFIXES = [
  "/libro",
  "/recetas",
  "/menus",
  "/tecnicas",
  "/etapas",
];

function isReaderPath(pathname: string): boolean {
  return READER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

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

  // Reader hard gate. Currently disabled — see READER_GATE_ENABLED above.
  if (
    READER_GATE_ENABLED &&
    req.method === "GET" &&
    isReaderPath(pathname) &&
    !hasSession
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}&reason=reader`;
    return NextResponse.redirect(url);
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
    "/libro",
    "/libro/:path*",
    "/recetas",
    "/recetas/:path*",
    "/menus",
    "/menus/:path*",
    "/tecnicas",
    "/tecnicas/:path*",
    "/etapas/:path*",
    "/api/recetas/:path*",
    "/api/ingredientes/:path*",
    "/api/alergenos/:path*",
    "/api/tecnicas/:path*",
    "/api/menus/:path*",
    "/api/usuarios/:path*",
  ],
};
