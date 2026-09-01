"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      // Drop the server session cookie first so subsequent SSR renders see
      // an anonymous user. Firebase client sign-out clears the ID token
      // cache. Order matters: if we sign out client-side first, a race with
      // an in-flight fetch could refresh the cookie.
      await fetch("/api/session", { method: "DELETE" });
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // App Check init errors during SSR-to-CSR handoff can crash getAuth
        // in edge cases; swallow — the cookie is already cleared.
      }
      window.location.assign("/");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="button button--ghost"
      onClick={handleLogout}
      disabled={loading}
      style={{ minHeight: 44 }}
    >
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
