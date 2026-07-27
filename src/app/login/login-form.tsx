"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/site";

const CUSTOM_CLAIM_REFRESH_DELAY_MS = 1_500;
const SESSION_CONFIRM_MAX_ATTEMPTS = 10;
const SESSION_CONFIRM_DELAY_MS = 250;

// Guards against React strict-mode double-mount consuming the redirect
// result twice. getRedirectResult() only returns the pending result on the
// first call per page load; a second call returns null.
let redirectHandled = false;

export function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, check whether we just came back from a Google redirect.
  useEffect(() => {
    if (redirectHandled) return;
    redirectHandled = true;
    (async () => {
      // eslint-disable-next-line no-console
      console.log("[login] checking redirect result…");
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (!result) {
          // eslint-disable-next-line no-console
          console.log("[login] no pending redirect");
          return;
        }
        // eslint-disable-next-line no-console
        console.log("[login] redirect result ok, uid:", result.user.uid);
        setLoading(true);
        const { superadmin } = await postSession((force) =>
          result.user.getIdToken(force)
        );
        // eslint-disable-next-line no-console
        console.log("[login] session minted, superadmin:", superadmin);
        await confirmSessionOrThrow();
        afterLogin(superadmin, next);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error("[login] redirect finish failed:", err);
        setError(translateAuthError(err));
        setLoading(false);
      }
    })();
  }, [next]);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      // Redirect flow (not popup). Popup depends on window.closed which
      // browsers block under Cross-Origin-Opener-Policy and hangs the SDK.
      // The result is picked up by the useEffect above on return.
      await signInWithRedirect(auth, new GoogleAuthProvider());
      // Execution stops here; the page navigates away.
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("[login] signInWithRedirect failed:", err);
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <button
        type="button"
        className="button button--primary"
        style={{ width: "100%" }}
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? "Un momento…" : "Continuar con Google"}
      </button>

      <p
        style={{
          textAlign: "center",
          color: "var(--color-ink-muted)",
          fontSize: "0.85rem",
          margin: "1rem 0 0",
        }}
      >
        Usamos tu cuenta de Google para no pedirte otra contraseña.
      </p>

      {error && (
        <div role="alert" style={{ marginTop: "1rem" }}>
          <p style={{ color: "var(--color-danger)", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
          <HelpLink />
        </div>
      )}
    </div>
  );
}

async function callSession(idToken: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "No se pudo iniciar la sesión.");
  }
  return (await res.json()) as
    | { superadmin: boolean; refreshRequired?: false }
    | { refreshRequired: true; superadmin?: undefined };
}

async function postSession(
  getIdToken: (force: boolean) => Promise<string>
): Promise<{ superadmin: boolean }> {
  const first = await callSession(await getIdToken(true));
  if (!("refreshRequired" in first) || !first.refreshRequired) {
    return { superadmin: first.superadmin };
  }
  // Server granted a fresh custom claim. Firebase Auth propagates custom
  // claims asynchronously — an immediate getIdToken(true) often still
  // returns the old (cached) token. Wait a beat before forcing refresh.
  await new Promise((r) => setTimeout(r, CUSTOM_CLAIM_REFRESH_DELAY_MS));
  const second = await callSession(await getIdToken(true));
  if ("refreshRequired" in second && second.refreshRequired) {
    throw new Error(
      "No se pudo aplicar el rol de editor. Cierra sesión y vuelve a intentar."
    );
  }
  return { superadmin: second.superadmin };
}

/**
 * Poll GET /api/session until the server confirms the cookie is visible +
 * verifiable. Without this, the hard-navigation after POST can race the
 * browser's Set-Cookie application and land on /libro without a cookie,
 * getting bounced by middleware back to /login (visible as an empty /login).
 */
async function confirmSessionOrThrow(): Promise<void> {
  for (let i = 0; i < SESSION_CONFIRM_MAX_ATTEMPTS; i++) {
    const res = await fetch("/api/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { authenticated?: boolean };
      if (data.authenticated) {
        // eslint-disable-next-line no-console
        console.log("[login] session confirmed after", i + 1, "attempt(s)");
        return;
      }
    }
    await new Promise((r) => setTimeout(r, SESSION_CONFIRM_DELAY_MS));
  }
  throw new Error(
    "No pudimos confirmar la sesión. Recarga la página e intenta de nuevo."
  );
}

function afterLogin(superadmin: boolean, next: string | undefined) {
  const target = next || (superadmin ? "/admin" : "/libro");
  // Hard navigation so middleware and RSC see the fresh cookie on a real
  // HTTP request. router.push can race with cookie propagation.
  window.location.assign(target);
}

function HelpLink() {
  const waDigits = CONTACT_WHATSAPP?.replace(/[^\d]/g, "");
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
  const mailUrl = CONTACT_EMAIL
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        "No puedo entrar a Bocaditos del Corazón"
      )}`
    : null;
  if (!waUrl && !mailUrl) return null;
  return (
    <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
      ¿Sigue fallando? Escríbenos por{" "}
      {waUrl ? <a href={waUrl} target="_blank" rel="noreferrer noopener">WhatsApp</a> : null}
      {waUrl && mailUrl ? " o " : ""}
      {mailUrl ? <a href={mailUrl}>correo</a> : null}
      .
    </p>
  );
}

function translateAuthError(err: unknown): string {
  const code =
    (err as { code?: string })?.code ??
    (err as { message?: string })?.message ??
    "";
  if (code.includes("auth/unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase. Escríbenos para arreglarlo.";
  if (code.includes("auth/network-request-failed"))
    return "Hubo un problema de conexión. Intenta de nuevo.";
  return typeof code === "string" && code
    ? code
    : "No se pudo iniciar la sesión.";
}
