"use client";

import { useEffect, useState } from "react";
import {
  getRedirectResult,
  GoogleAuthProvider,
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Al volver de Google, recupera el resultado guardado en sessionStorage,
  // pide la cookie de sesión al servidor y redirige según needsOnboarding.
  // signInWithPopup no funciona con este backend (COOP + postMessage entre
  // popup y opener queda bloqueado), por eso vamos por redirect.
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
        afterLoginRedirect(r, next);
      } catch (err) {
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
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
      <button
        type="button"
        className="button button--primary"
        style={{ width: "100%", minHeight: 44 }}
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? "Un momento…" : "Continuar con Google"}
      </button>

      {error && (
        <p role="alert" style={{ color: "var(--color-danger, #b3261e)", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
