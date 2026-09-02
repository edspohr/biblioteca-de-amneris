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

const DEBUG = process.env.NODE_ENV !== "production";
const LOOP_GUARD_KEY = "biblioteca:login-attempts";
const LOOP_GUARD_MAX = 3;

function debug(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

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

    // Diagnosis auxiliar (solo en dev): getRedirectResult loguea si el
    // resultado llegó o si Firebase falló durante el bounce. No es la
    // fuente de verdad.
    if (DEBUG) {
      getRedirectResult(auth)
        .then((r) => {
          debug(
            "[login] getRedirectResult:",
            r ? `user=${r.user.email}` : "null"
          );
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[login] getRedirectResult error:", err);
        });
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      debug(
        "[login] onAuthStateChanged:",
        user ? `user=${user.email}` : "null"
      );
      if (!user || handled.current) return;

      // Loop guard: si ya intentamos crear sesión N veces en esta pestaña sin
      // éxito, dejamos de reintentar y mostramos error. Evita que un cookie
      // stripped o un endpoint roto entren en bucle infinito entre /ingresar
      // y la ruta destino.
      const attempts = readAttempts();
      if (attempts >= LOOP_GUARD_MAX) {
        setError(
          "No pudimos crear tu sesión después de varios intentos. " +
            "Recarga la página o escríbenos si el problema persiste."
        );
        return;
      }
      writeAttempts(attempts + 1);

      handled.current = true;
      setLoading(true);
      try {
        const r = await postSession((force) => user.getIdToken(force));
        clearAttempts();
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
    clearAttempts();
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

function readAttempts(): number {
  if (typeof sessionStorage === "undefined") return 0;
  const raw = sessionStorage.getItem(LOOP_GUARD_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function writeAttempts(n: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(LOOP_GUARD_KEY, String(n));
}

function clearAttempts(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(LOOP_GUARD_KEY);
}
