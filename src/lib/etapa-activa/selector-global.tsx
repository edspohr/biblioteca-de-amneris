"use client";

import { useEtapaActiva } from "./context";

export function EtapaSelectorGlobal() {
  const { etapaId, setEtapaId, etapas } = useEtapaActiva();
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="etapa-selector-global" role="radiogroup" aria-label="Etapa activa">
      <span className="etapa-selector-global__label">Etapa:</span>
      {ordenadas.map((e) => {
        const active = e.id === etapaId;
        return (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setEtapaId(e.id)}
            className="etapa-selector-global__chip"
            style={{
              background: active ? e.paleta.primary : "white",
              borderColor: active ? e.paleta.accent : "var(--border)",
              color: active ? e.paleta.ink : "var(--muted)",
            }}
            title={`${e.nombre} · ${e.rango_edad}`}
          >
            {e.orden}
          </button>
        );
      })}
    </div>
  );
}
