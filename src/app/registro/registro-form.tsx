"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  afterLoginRedirect,
  postSession,
  translateAuthError,
} from "@/lib/auth/after-login";

let redirectHandled = false;

export function RegistroForm({ next }: { next?: string }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (redirectHandled) return;
    redirectHandled = true;
    (async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (!result) return;
        setLoading(true);
        const r = await postSession((force) => result.user.getIdToken(force));
        await new Promise((res) => setTimeout(res, 200));
        afterLoginRedirect(r, next);
      } catch (err) {
        setError(translateAuthError(err));
        setLoading(false);
      }
    })();
  }, [next]);

  async function handleGoogle() {
    setError(null);
    if (!consent) {
      setError("Debes aceptar el tratamiento de datos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Debes aceptar el tratamiento de datos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (nombre.trim()) {
        await updateProfile(cred.user, { displayName: nombre.trim() });
      }
      const r = await postSession((force) => cred.user.getIdToken(force));
      afterLoginRedirect(r, next);
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <button
        type="button"
        className="button button--primary"
        style={{ width: "100%" }}
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? "Un momento…" : "Continuar con Google"}
      </button>

      <div
        style={{
          textAlign: "center",
          margin: "1.25rem 0",
          color: "var(--color-ink-muted)",
          fontSize: "0.85rem",
        }}
      >
        — o crea tu cuenta con correo —
      </div>

      <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Tu nombre</span>
          <input
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ padding: "0.6rem 0.75rem" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Correo</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "0.6rem 0.75rem" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Contraseña (mínimo 6 caracteres)</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "0.6rem 0.75rem" }}
          />
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: "0.25rem", minWidth: 20, minHeight: 20 }}
          />
          <span style={{ fontSize: "0.9rem" }}>
            Autorizo el tratamiento de mis datos según la{" "}
            <Link href="/privacidad" target="_blank">política de privacidad</Link>.
          </span>
        </label>
        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Creando cuenta…" : "Crear mi cuenta gratis"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "var(--color-danger, #b3261e)", marginTop: "1rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
