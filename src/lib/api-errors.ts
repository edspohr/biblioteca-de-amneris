import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/require";
import { RepoWriteError } from "@/lib/repo/errors";

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 409 });
}

export function serverError(message = "Error interno del servidor") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function serviceUnavailable(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

export function handleZodError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return badRequest("Los datos no son válidos", details);
  }
  if (err instanceof RepoWriteError) {
    // Log the underlying cause server-side so we can debug without leaking
    // the raw SDK error to the browser.
    // eslint-disable-next-line no-console
    console.error("[repo-write]", err.cause);
    return serviceUnavailable(err.message);
  }
  return serverError((err as Error)?.message ?? "Error desconocido");
}
