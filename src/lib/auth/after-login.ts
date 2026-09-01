"use client";

export type PostSessionResult =
  | {
      superadmin: boolean;
      needsOnboarding: boolean;
      refreshRequired?: false;
    }
  | { refreshRequired: true; superadmin?: undefined; needsOnboarding?: undefined };

/**
 * Common client-side post-login navigation. Superadmins → /admin.
 * Users who haven't completed onboarding → /registro/bienvenida.
 * Everyone else → the `next` param or /libro.
 *
 * Uses a hard navigation so middleware and RSC see the fresh cookie.
 */
export function afterLoginRedirect(
  result: { superadmin: boolean; needsOnboarding: boolean },
  next: string | undefined
): void {
  if (result.needsOnboarding) {
    window.location.assign("/registro/bienvenida");
    return;
  }
  const target = next || (result.superadmin ? "/admin" : "/libro");
  window.location.assign(target);
}

/**
 * Posts the ID token to /api/session. If the server granted a fresh custom
 * claim, retries after waiting for propagation.
 */
export async function postSession(
  getIdToken: (force: boolean) => Promise<string>
): Promise<{ superadmin: boolean; needsOnboarding: boolean }> {
  const CLAIM_REFRESH_DELAY_MS = 1_500;
  const first = await callSession(await getIdToken(true));
  if (!("refreshRequired" in first) || !first.refreshRequired) {
    return {
      superadmin: first.superadmin,
      needsOnboarding: first.needsOnboarding,
    };
  }
  await new Promise((r) => setTimeout(r, CLAIM_REFRESH_DELAY_MS));
  const second = await callSession(await getIdToken(true));
  if ("refreshRequired" in second && second.refreshRequired) {
    throw new Error(
      "No se pudo aplicar el rol de editor. Cierra sesión y vuelve a intentar."
    );
  }
  return {
    superadmin: second.superadmin,
    needsOnboarding: second.needsOnboarding,
  };
}

async function callSession(idToken: string): Promise<PostSessionResult> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "No se pudo iniciar la sesión.");
  }
  return (await res.json()) as PostSessionResult;
}

export function translateAuthError(err: unknown): string {
  const code =
    (err as { code?: string })?.code ??
    (err as { message?: string })?.message ??
    "";
  if (typeof code !== "string") return "No se pudo iniciar la sesión.";
  if (code.includes("auth/unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase. Escríbenos para arreglarlo.";
  if (code.includes("auth/popup-blocked"))
    return "Tu navegador bloqueó la ventana de Google. Habilita los popups para este sitio e intenta de nuevo.";
  if (code.includes("auth/popup-closed-by-user") || code.includes("auth/cancelled-popup-request"))
    return "Cerraste la ventana antes de terminar. Vuelve a intentar cuando quieras.";
  if (code.includes("auth/network-request-failed"))
    return "Hubo un problema de conexión. Intenta de nuevo.";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password"))
    return "Correo o contraseña incorrectos.";
  if (code.includes("auth/user-not-found"))
    return "No encontramos una cuenta con ese correo.";
  if (code.includes("auth/email-already-in-use"))
    return "Ya existe una cuenta con ese correo. Usa 'ingresar' en vez de 'registrarme'.";
  if (code.includes("auth/weak-password"))
    return "La contraseña es muy corta (mínimo 6 caracteres).";
  if (code.includes("auth/invalid-email"))
    return "El correo no tiene un formato válido.";
  if (code.includes("auth/too-many-requests"))
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  return code || "No se pudo iniciar la sesión.";
}
