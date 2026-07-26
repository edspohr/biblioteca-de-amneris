"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/site";

const GOOGLE_POPUP_TIMEOUT_MS = 45_000;
const CUSTOM_CLAIM_REFRESH_DELAY_MS = 1_500;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

type Mode = "signin" | "signup";

export function LoginForm({
  next,
  initialMode = "signin",
}: {
  next?: string;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    router.push(target);
    router.refresh();
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
      const cred = await withTimeout(
        signInWithPopup(auth, new GoogleAuthProvider()),
        GOOGLE_POPUP_TIMEOUT_MS,
        "google-popup-timeout"
      );
      const { superadmin } = await postSession((force) =>
        cred.user.getIdToken(force)
      );
      afterLogin(superadmin);
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
  if (code.includes("auth/popup-closed-by-user") || code.includes("auth/cancelled-popup-request"))
    return "Cerraste la ventana de Google antes de terminar. Vuelve a intentarlo.";
  if (code.includes("auth/popup-blocked"))
    return "Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio y reintenta.";
  if (code.includes("auth/unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase. Escríbenos para arreglarlo.";
  if (code.includes("auth/account-exists-with-different-credential"))
    return "Ya existe una cuenta con ese correo usando otro método. Entra con correo y contraseña.";
  if (code.includes("auth/network-request-failed"))
    return "Hubo un problema de conexión. Intenta de nuevo.";
  if (code === "google-popup-timeout")
    return "La ventana de Google no respondió. Asegúrate de que no esté bloqueada, prueba en otra pestaña, o entra con tu correo abajo.";
  return typeof code === "string" && code
    ? code
    : "No se pudo iniciar la sesión.";
}
