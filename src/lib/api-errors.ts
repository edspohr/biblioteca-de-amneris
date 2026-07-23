import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

export function handleZodError(err: unknown) {
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return badRequest("Los datos no son válidos", details);
  }
  return serverError((err as Error)?.message ?? "Error desconocido");
}
