"use client";

import { useEffect, useState } from "react";
import {
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  afterLoginRedirect,
  postSession,
  translateAuthError,
} from "@/lib/auth/after-login";

let redirectHandled = false;

export function IngresarForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
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
    setInfo(null);
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
    setInfo(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const r = await postSession((force) => cred.user.getIdToken(force));
      afterLoginRedirect(r, next);
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  async function handleReset() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Escribe tu correo primero para enviarte el enlace.");
      return;
    }
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Te enviamos un correo para reestablecer tu contraseña.");
    } catch (err) {
      setError(translateAuthError(err));
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
        — o entra con correo —
      </div>

      <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: "0.75rem" }}>
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
          <span>Contraseña</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "0.6rem 0.75rem" }}
          />
        </label>
        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="button button--ghost"
          style={{ fontSize: "0.9rem" }}
        >
          Olvidé mi contraseña
        </button>
      </form>

      {info && (
        <p style={{ color: "var(--color-ink)", marginTop: "1rem" }}>{info}</p>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--color-danger, #b3261e)", marginTop: "1rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
