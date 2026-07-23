"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      try {
        await getFirebaseAuth().signOut();
      } catch {
        // Client SDK may not be initialized yet; server cookie is already gone.
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="button button--ghost"
      onClick={handleLogout}
      disabled={loading}
      style={{ fontSize: "0.85rem", padding: "0.3rem 0.75rem" }}
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
