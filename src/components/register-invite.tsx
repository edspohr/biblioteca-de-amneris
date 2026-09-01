"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Props {
  open: boolean;
  onClose: () => void;
  returnTo?: string;
  message?: string;
}

export function RegisterInvite({ open, onClose, returnTo, message }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const registro = returnTo
    ? `/registro?next=${encodeURIComponent(returnTo)}`
    : "/registro";
  const ingresar = returnTo
    ? `/ingresar?next=${encodeURIComponent(returnTo)}`
    : "/ingresar";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      style={{
        border: "none",
        borderRadius: 16,
        maxWidth: 380,
        padding: 0,
        background: "var(--color-cream, #FDF6EE)",
        color: "var(--color-ink, #3a2814)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      }}
    >
      <form method="dialog" style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-title)" }}>Regístrate gratis</h2>
        <p style={{ margin: 0, color: "var(--color-ink-muted)" }}>
          {message ??
            "Prueba 30 días gratis, sin tarjeta. Encuentra la receta adecuada para tu bebé en 15 a 20 segundos, con menú semanal y lista de compras."}
        </p>

        <Link
          href={registro}
          className="button button--primary"
          style={{ textAlign: "center", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          Crear cuenta gratis
        </Link>
        <Link
          href={ingresar}
          className="button button--ghost"
          style={{ textAlign: "center", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          Ya tengo cuenta
        </Link>

        <button
          type="submit"
          className="button button--ghost"
          style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)" }}
        >
          Ahora no
        </button>
      </form>
    </dialog>
  );
}
