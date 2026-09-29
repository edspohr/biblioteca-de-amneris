"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Coleccion, ColeccionEstado } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

interface Props {
  initial: Coleccion[];
}

const ESTADOS: { value: ColeccionEstado; label: string; hint: string }[] = [
  { value: "publicada", label: "Publicada", hint: "Visible en /libro" },
  { value: "proximamente", label: "Próximamente", hint: "Card visible, sin link" },
  { value: "oculta", label: "Oculta", hint: "Solo visible a superadmin" },
];

export function ColeccionesEditor({ initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  async function updateEstado(c: Coleccion, estado: ColeccionEstado) {
    if (c.estado === estado) return;
    const res = await runSave(() =>
      saveWithVerify<Coleccion>(`/api/colecciones/${c.id}`, "PUT", {
        ...c,
        estado,
      })
    );
    if (!res.ok) return;
    setItems((cur) => cur.map((x) => (x.id === c.id ? res.data : x)));
    router.refresh();
  }

  const sorted = [...items].sort((a, b) => a.orden - b.orden);

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      {sorted.length === 0 && (
        <p className="muted">
          Sin colecciones. Corre <code>npm run seed:colecciones -- --apply</code>.
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {sorted.map((c) => (
          <article
            key={c.id}
            style={{
              border: "1px solid var(--border, #e0d5c8)",
              borderRadius: 8,
              padding: "0.9rem 1rem",
              background: "var(--panel, white)",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>{c.nombre}</h2>
                <p className="muted" style={{ margin: "0.2rem 0 0.5rem 0" }}>
                  <code>{c.id}</code> · tipo: {c.tipo}
                  {c.eje ? ` · eje: ${c.eje}` : ""} · orden: {c.orden}
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 4,
                  fontWeight: 600,
                  background:
                    c.estado === "publicada"
                      ? "#eaf7ef"
                      : c.estado === "proximamente"
                      ? "#fff4e5"
                      : "#f1ebfa",
                  color:
                    c.estado === "publicada"
                      ? "#2f5d46"
                      : c.estado === "proximamente"
                      ? "#7a4321"
                      : "#4a3771",
                }}
              >
                {c.estado}
              </span>
            </header>

            <p style={{ margin: "0 0 0.5rem 0" }}>{c.bajada}</p>
            {c.descripcionCorta && (
              <p className="muted" style={{ margin: "0 0 0.8rem 0", fontSize: "0.9rem" }}>
                {c.descripcionCorta}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginTop: "0.5rem",
              }}
              role="group"
              aria-label="Estado"
            >
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => updateEstado(c, e.value)}
                  disabled={busy || c.estado === e.value}
                  title={e.hint}
                  style={{
                    padding: "0.35rem 0.7rem",
                    border: "1px solid var(--border, #e0d5c8)",
                    borderRadius: 4,
                    background: c.estado === e.value ? "var(--accent, #7a3e3e)" : "transparent",
                    color: c.estado === e.value ? "white" : "inherit",
                    cursor: c.estado === e.value ? "default" : "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
