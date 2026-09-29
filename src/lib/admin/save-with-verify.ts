"use client";

// Client-side save helper for admin forms.
//
// Contract: every mutation call goes through this. It awaits the response,
// parses the body (never fire-and-forget), and returns a discriminated union
// the caller can pattern-match on. When {ok: true}, `data` is what the API
// re-read from the store after writing (see src/lib/repo/verify.ts on the
// server), so a success here means the write is confirmed persisted — not
// just accepted.
//
// Root cause it addresses: the 2025-09-19 incident where admin forms did
// `router.push()` on an HTTP 200 that echoed the input back without proving
// the Firestore write happened.

export type FieldError = { field: string; message: string };

export type SaveResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; details?: FieldError[] };

export async function saveWithVerify<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<SaveResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body != null ? { "content-type": "application/json" } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error:
        (err as Error)?.message ??
        "No hubo conexión con el servidor. Revisa tu internet y reintenta.",
    };
  }

  const contentType = res.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (contentType.includes("application/json")) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const p = (payload ?? {}) as { error?: string; details?: FieldError[] };
    return {
      ok: false,
      status: res.status,
      error: p.error ?? `Error ${res.status} al guardar`,
      details: Array.isArray(p.details) ? p.details : undefined,
    };
  }

  if (payload == null) {
    return {
      ok: false,
      status: res.status,
      error:
        "El servidor respondió sin cuerpo. No se pudo verificar el guardado.",
    };
  }

  return { ok: true, data: payload as T };
}
