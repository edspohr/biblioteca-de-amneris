"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  afterLoginRedirect,
  postSession,
  translateAuthError,
} from "@/lib/auth/after-login";

export function IngresarForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
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
