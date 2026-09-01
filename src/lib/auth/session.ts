import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp, getAdminAuth } from "@/lib/firebase/admin";
import { usuarioSchema, type Usuario } from "@/lib/schema";
import { computeAccess, type Access } from "./access";

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

export interface SessionWithProfile {
  session: SessionUser;
  usuario: Usuario | null;
  access: Access;
}

// End-to-end auth is on. To temporarily walk the app as a superadmin without
// logging in (only useful during isolated local debugging), flip to true —
// but keep it false in every branch that gets deployed.
export const AUTH_BYPASS_ENABLED = false;

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

export const verifySession = cache(async (): Promise<SessionUser | null> => {
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
});

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

/**
 * Reads the profile doc for the current session (usuarios/{uid}) and returns
 * it together with the computed access tier. Cached per-request via React
 * `cache()` so multiple server components can call it without hitting
 * Firestore repeatedly. Returns null if there is no session.
 *
 * When AUTH_BYPASS_ENABLED is on, returns the mock superadmin with a
 * synthetic "activa" access so admin surfaces stay open.
 */
export const getSessionWithProfile = cache(
  async (): Promise<SessionWithProfile | null> => {
    const session = await verifySession();
    if (!session) return null;
    if (AUTH_BYPASS_ENABLED && session.uid === MOCK_SUPERADMIN.uid) {
      return {
        session,
        usuario: null,
        access: {
          tier: "activa",
          daysLeft: null,
          hasFullAccess: true,
          endsAt: null,
        },
      };
    }
    const usuario = await readUsuario(session.uid);
    return {
      session,
      usuario,
      access: computeAccess(
        usuario ?? { subscription: { state: "vencida" } as never, superadmin: session.superadmin }
      ),
    };
  }
);

async function readUsuario(uid: string): Promise<Usuario | null> {
  try {
    const snap = await getFirestore(getAdminApp())
      .collection("usuarios")
      .doc(uid)
      .get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (!data) return null;
    // The mirror doc may be missing fields during the first-signin transient;
    // Zod would throw. Parse loosely and return null if invalid — callers
    // treat that as "profile not ready yet".
    const parsed = usuarioSchema.safeParse({ uid, ...data });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
