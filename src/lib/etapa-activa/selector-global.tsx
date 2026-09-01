"use client";

import { usePathname } from "next/navigation";
import { useEtapaActiva } from "./context";

/**
 * Global etapa selector.
 *
 * Rendered once in the root layout inside a fixed container. On mobile it
 * sits at the bottom of the viewport (thumb-reachable) with safe-area
 * padding; on wider viewports it becomes a compact pill floating in the
 * top-right corner. All positioning lives in CSS — this component only
 * knows about the radio group.
 *
 * Hidden on the landing page (/) and inside /admin — those surfaces don't
 * carry per-recipe content, so the selector would be a decoration.
 */
export function EtapaSelectorGlobal() {
  const pathname = usePathname();
  const {
    etapaId,
    setEtapaId,
    etapas,
    autoEtapaId,
    manualOverride,
    resetToAuto,
  } = useEtapaActiva();
  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/ingresar") ||
    pathname.startsWith("/registro") ||
    pathname === "/sin-permiso"
  ) {
    return null;
  }
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const activa = ordenadas.find((e) => e.id === etapaId) ?? ordenadas[0];
  const showResetChip =
    manualOverride && autoEtapaId !== null && autoEtapaId !== etapaId;

  return (
    <div className="etapa-bar" role="region" aria-label="Etapa activa">
      <div className="etapa-bar__inner">
        <div className="etapa-bar__label" aria-hidden="true">
          Viendo para
          <strong>{activa.rango_edad}</strong>
        </div>
        <div className="etapa-bar__chips" role="radiogroup" aria-label="Cambiar etapa">
          {ordenadas.map((e) => {
            const active = e.id === etapaId;
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setEtapaId(e.id)}
                className="etapa-bar__chip"
                data-active={active}
                style={{
                  background: active ? e.paleta.primary : "var(--color-surface)",
                  borderColor: active ? e.paleta.ink : "var(--color-border)",
                  color: active ? e.paleta.ink : "var(--color-ink-muted)",
                }}
                title={`${e.nombre} · ${e.rango_edad}`}
              >
                <span className="etapa-bar__chip-num">{e.orden}</span>
                <span className="etapa-bar__chip-age">{e.rango_edad}</span>
              </button>
            );
          })}
        </div>
        {showResetChip && (
          <button
            type="button"
            onClick={resetToAuto}
            className="etapa-bar__reset"
            style={{
              background: "transparent",
              border: "1px dashed var(--color-ink-muted)",
              borderRadius: 999,
              padding: "0.25rem 0.75rem",
              fontSize: "0.85rem",
              color: "var(--color-ink-muted)",
              cursor: "pointer",
              marginLeft: "0.5rem",
            }}
            title="Volver a la etapa que corresponde a la edad de mi bebé"
          >
            ↺ Volver a la etapa de mi bebé
          </button>
        )}
      </div>
    </div>
  );
}
