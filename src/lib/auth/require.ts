import "server-only";
import { NextResponse } from "next/server";
import {
  getSessionWithProfile,
  verifySession,
  type SessionUser,
  type SessionWithProfile,
} from "./session";

export class AuthError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await verifySession();
  if (!user) {
    throw new AuthError(401, "Debes iniciar sesión para realizar esta acción.");
  }
  if (!user.superadmin) {
    throw new AuthError(403, "Tu cuenta no tiene permisos de autoría.");
  }
  return user;
}

/**
 * Requires a logged-in user (any tier). Returns the session + profile + access
 * so callers can gate on subscription state without a second Firestore read.
 * Throws 401 when there is no session at all.
 */
export async function requireUser(): Promise<SessionWithProfile> {
  const ctx = await getSessionWithProfile();
  if (!ctx) {
    throw new AuthError(401, "Debes iniciar sesión para continuar.");
  }
  return ctx;
}

export function authErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
