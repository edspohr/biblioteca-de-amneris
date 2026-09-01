"use client";

import { useEffect, useRef, useState } from "react";
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  afterLoginRedirect,
  postSession,
  translateAuthError,
} from "@/lib/auth/after-login";

export function IngresarForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handled = useRef(false);

  // Al volver de Google, Firebase restaura el usuario desde IndexedDB y
  // dispara onAuthStateChanged. Usamos ese hook (en vez de getRedirectResult,
  // que a veces devuelve null en Chrome por storage partitioning) para
  // agarrar la sesión, pedir cookie al servidor y redirigir.
  useEffect(() => {
    const auth = getFirebaseAuth();

    // Diagnosis auxiliar: getRedirectResult loguea si el resultado llegó
    // o si Firebase falló durante el bounce. No es la fuente de verdad.
    getRedirectResult(auth)
      .then((r) => {
        // eslint-disable-next-line no-console
        console.log(
          "[login] getRedirectResult:",
          r ? `user=${r.user.email}` : "null"
        );
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[login] getRedirectResult error:", err);
      });

    const unsub = onAuthStateChanged(auth, async (user) => {
      // eslint-disable-next-line no-console
      console.log(
        "[login] onAuthStateChanged:",
        user ? `user=${user.email}` : "null"
      );
      if (!user || handled.current) return;
      handled.current = true;
      setLoading(true);
      try {
        const r = await postSession((force) => user.getIdToken(force));
        afterLoginRedirect(r, next);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[login] postSession failed:", err);
        setError(translateAuthError(err));
        setLoading(false);
        handled.current = false;
      }
    });

    return () => unsub();
  }, [next]);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[login] signInWithRedirect error:", err);
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
