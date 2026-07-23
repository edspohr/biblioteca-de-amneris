"use client";

import { useEtapaActiva } from "./context";

/**
 * Global etapa selector.
 *
 * Rendered once in the root layout inside a fixed container. On mobile it
 * sits at the bottom of the viewport (thumb-reachable) with safe-area
 * padding; on wider viewports it becomes a compact pill floating in the
 * top-right corner. All positioning lives in CSS — this component only
 * knows about the radio group.
 */
export function EtapaSelectorGlobal() {
  const { etapaId, setEtapaId, etapas } = useEtapaActiva();
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const activa = ordenadas.find((e) => e.id === etapaId) ?? ordenadas[0];

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
      </div>
    </div>
  );
}
