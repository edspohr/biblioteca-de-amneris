import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "__biblioteca_session";

// 5 days, in milliseconds. Firebase caps session cookies at 14 days.
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  superadmin: boolean;
}

// TEMPORARY: while the login flow is being polished, verifySession() returns
// a mock superadmin so Amneris can walk the entire app (including /admin)
// without seeing a login screen. Middleware still guards mutating API routes
// by checking the real cookie, so no one can persist changes without a real
// session. Flip to false once auth is re-enabled end-to-end.
export const AUTH_BYPASS_ENABLED = true;

const MOCK_SUPERADMIN: SessionUser = {
  uid: "mock-superadmin",
  email: "amnerispinto@gmail.com",
  name: "Amneris (modo demo)",
  superadmin: true,
};

export async function createSessionCookie(idToken: string): Promise<{
  cookie: string;
  maxAgeSeconds: number;
}> {
  const auth = getAdminAuth();
  const cookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
  return { cookie, maxAgeSeconds: SESSION_MAX_AGE_MS / 1000 };
}

export async function verifySession(): Promise<SessionUser | null> {
  if (AUTH_BYPASS_ENABLED) return MOCK_SUPERADMIN;
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      superadmin: decoded.superadmin === true,
    };
  } catch {
    return null;
  }
}

export async function verifySessionCookieValue(
  cookie: string
): Promise<SessionUser | null> {
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      superadmin: decoded.superadmin === true,
    };
  } catch {
    return null;
  }
}
