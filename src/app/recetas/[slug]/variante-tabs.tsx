"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Etapa, Receta } from "@/lib/schema";
import { useEtapaActiva } from "@/lib/etapa-activa/context";

interface Props {
  receta: Receta;
  etapas: Etapa[];
}

export function RecetaVarianteTabs({ receta, etapas }: Props) {
  const { etapaId: etapaGlobal } = useEtapaActiva();
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const [tab, setTab] = useState<string>(etapaGlobal);

  useEffect(() => {
    setTab(etapaGlobal);
  }, [etapaGlobal, receta.id]);

  const etapaTab = ordenadas.find((e) => e.id === tab) ?? ordenadas[0];
  const variante = receta.variantes[etapaTab.id];
  const scoped: CSSProperties = {
    ["--etapa-primary" as string]: etapaTab.paleta.primary,
    ["--etapa-accent" as string]: etapaTab.paleta.accent,
    ["--etapa-soft" as string]: etapaTab.paleta.soft,
    ["--etapa-ink" as string]: etapaTab.paleta.ink,
  };

  return (
    <div style={scoped}>
      <div className="etapa-tabs" role="tablist" aria-label="Variante por etapa">
        {ordenadas.map((e) => {
          const active = e.id === tab;
          return (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(e.id)}
              className="etapa-tab"
              style={{
                background: active ? e.paleta.primary : "var(--color-surface)",
                color: active ? e.paleta.ink : "var(--color-ink-muted)",
                borderColor: active ? e.paleta.ink : "var(--color-border)",
              }}
            >
              {e.nombre} <span style={{ opacity: 0.7 }}>· {e.rango_edad}</span>
            </button>
          );
        })}
      </div>
      <div className="etapa-panel">
        <h3>Para {etapaTab.nombre.toLowerCase()} ({etapaTab.rango_edad})</h3>
        <div className="etapa-panel__row">
          <span>
            <strong>Textura:</strong> {variante.textura}
          </span>
          <span>
            <strong>Porción:</strong> {variante.porcion}
          </span>
        </div>
      </div>
    </div>
  );
}
