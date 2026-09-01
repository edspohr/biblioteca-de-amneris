"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  afterLoginRedirect,
  postSession,
  translateAuthError,
} from "@/lib/auth/after-login";

export function RegistroForm({ next }: { next?: string }) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    if (!consent) {
      setError("Debes aceptar el tratamiento de datos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      // Popup avoids the cross-origin storage issues that break
      // signInWithRedirect on Firebase Hosting (authDomain
      // *.firebaseapp.com ≠ app domain *.web.app).
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const r = await postSession((force) => result.user.getIdToken(force));
      afterLoginRedirect(r, next);
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
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
        type="button"
        className="button button--primary"
        style={{ width: "100%", minHeight: 44 }}
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? "Un momento…" : "Continuar con Google"}
      </button>

      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", margin: 0, textAlign: "center" }}>
        30 días gratis · sin tarjeta · cancela cuando quieras
      </p>

      {error && (
        <p role="alert" style={{ color: "var(--color-danger, #b3261e)", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
