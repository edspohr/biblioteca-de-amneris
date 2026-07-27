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
// whole app without fighting the login flow. Mutating API routes still
// require a real session cookie — no one can persist changes.
// Re-enable once auth flow is validated end-to-end.
const READER_GATE_ENABLED = false;
// When true, /admin also opens up (verifySession returns a mock superadmin;
// see src/lib/auth/session.ts AUTH_BYPASS_ENABLED). Keep both flags in sync.
const ADMIN_GATE_ENABLED = false;

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
    if (ADMIN_GATE_ENABLED && !hasSession) {
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
