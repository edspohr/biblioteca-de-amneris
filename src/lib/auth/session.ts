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
