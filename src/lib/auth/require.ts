import "server-only";
import { NextResponse } from "next/server";
import { verifySession, type SessionUser } from "./session";

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

export function authErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
