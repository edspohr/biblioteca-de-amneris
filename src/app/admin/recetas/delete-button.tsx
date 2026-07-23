"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id, titulo }: { id: string; titulo: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!confirm(`¿Eliminar la receta "${titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/recetas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`No se pudo eliminar: ${err.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        background: "transparent",
        color: "#a83030",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textDecoration: "underline",
        font: "inherit",
      }}
    >
      {busy ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
