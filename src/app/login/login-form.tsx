"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/site";

const CUSTOM_CLAIM_REFRESH_DELAY_MS = 1_500;

// Guards against React strict-mode double-mount consuming the redirect
// result twice. getRedirectResult() only returns the pending result on the
// first call per page load; a second call returns null.
let redirectHandled = false;

type Mode = "signin" | "signup";

export function LoginForm({
  next,
  initialMode = "signin",
}: {
  next?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // On mount, check whether we just came back from a Google redirect.
  // If yes, finish the session mint here — same postSession() path as email.
  // The module-level flag guards against React strict mode double-mount
  // (getRedirectResult only returns the pending result on the *first* call
  // per page load; the second call returns null and would silently no-op).
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
        afterLogin(superadmin);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error("[login] redirect finish failed:", err);
        setError(translateAuthError(err));
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // returns the old (cached) token. Wait a beat before forcing refresh so
    // the second attempt sees the new claim.
    await new Promise((r) => setTimeout(r, CUSTOM_CLAIM_REFRESH_DELAY_MS));
    const second = await callSession(await getIdToken(true));
    if ("refreshRequired" in second && second.refreshRequired) {
      throw new Error(
        "No se pudo aplicar el rol de editor. Cierra sesión y vuelve a intentar."
      );
    }
    return { superadmin: second.superadmin };
  }

  function afterLogin(superadmin: boolean) {
    const target = next || (superadmin ? "/admin" : "/libro");
    // Hard navigation, not router.push. The freshly-set session cookie needs
    // to travel with a real HTTP request so the middleware and RSC can see
    // it; a client-side navigation can race with cookie propagation.
    window.location.assign(target);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      if (mode === "signup" && displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const { superadmin } = await postSession((force) =>
        cred.user.getIdToken(force)
      );
      afterLogin(superadmin);
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      // Redirect flow (not popup) — the popup path relies on window.closed,
      // which modern browsers block under Cross-Origin-Opener-Policy and hangs
      // the SDK forever. The redirect result is picked up by the useEffect
      // above when the browser returns to /login.
      await signInWithRedirect(auth, new GoogleAuthProvider());
      // Execution stops here; the page navigates away.
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div
        role="tablist"
        aria-label="Modo de acceso"
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`button ${mode === "signin" ? "button--primary" : "button--ghost"}`}
          onClick={() => setMode("signin")}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`button ${mode === "signup" ? "button--primary" : "button--ghost"}`}
          onClick={() => setMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <button
        type="button"
        className="button button--ghost"
        style={{ width: "100%", marginBottom: "1rem" }}
        onClick={handleGoogle}
        disabled={loading}
      >
        Continuar con Google
      </button>

      <div
        style={{
          textAlign: "center",
          color: "var(--color-ink-muted)",
          margin: "0.75rem 0",
          fontSize: "0.85rem",
        }}
      >
        o con tu correo
      </div>

      <form onSubmit={handleEmailSubmit}>
        {mode === "signup" && (
          <label className="field">
            <span>Tu nombre</span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="María"
            />
          </label>
        )}
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <div role="alert" style={{ marginTop: "0.75rem" }}>
            <p
              style={{
                color: "var(--color-danger)",
                margin: 0,
                fontSize: "0.9rem",
              }}
            >
              {error}
            </p>
            <HelpLink />
          </div>
        )}

        <button
          type="submit"
          className="button button--primary"
          style={{ width: "100%", marginTop: "0.75rem" }}
          disabled={loading}
        >
          {loading
            ? "Un momento…"
            : mode === "signin"
            ? "Entrar"
            : "Crear mi cuenta"}
        </button>
      </form>
    </div>
  );
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
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password"))
    return "Correo o contraseña incorrectos.";
  if (code.includes("auth/user-not-found"))
    return "No encontramos una cuenta con ese correo.";
  if (code.includes("auth/email-already-in-use"))
    return "Ya existe una cuenta con ese correo. Prueba iniciando sesión.";
  if (code.includes("auth/weak-password"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (code.includes("auth/invalid-email"))
    return "El correo no tiene un formato válido.";
  if (code.includes("auth/unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase. Escríbenos para arreglarlo.";
  if (code.includes("auth/account-exists-with-different-credential"))
    return "Ya existe una cuenta con ese correo usando Google. Entra con «Continuar con Google» arriba.";
  if (code.includes("auth/network-request-failed"))
    return "Hubo un problema de conexión. Intenta de nuevo.";
  return typeof code === "string" && code
    ? code
    : "No se pudo iniciar la sesión.";
}
