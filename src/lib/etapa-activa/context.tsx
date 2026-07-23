"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Etapa, Paleta } from "@/lib/schema";
import { ETAPA_IDS } from "@/lib/schema";

export const ETAPA_STORAGE_KEY = "boc.etapaActiva";
const DEFAULT_ETAPA_ID = ETAPA_IDS[0];

interface EtapaActivaValue {
  etapaId: string;
  setEtapaId: (id: string) => void;
  etapas: Etapa[];
  paleta: Paleta;
}

const Ctx = createContext<EtapaActivaValue | null>(null);

function isValidEtapaId(id: string, etapas: Etapa[]): boolean {
  return etapas.some((e) => e.id === id);
}

function applyPaletaToRoot(paleta: Paleta): void {
  const s = document.documentElement.style;
  s.setProperty("--etapa-primary", paleta.primary);
  s.setProperty("--etapa-accent", paleta.accent);
  s.setProperty("--etapa-soft", paleta.soft);
  s.setProperty("--etapa-ink", paleta.ink);
}

export function EtapaActivaProvider({
  etapas,
  children,
}: {
  etapas: Etapa[];
  children: ReactNode;
}) {
  const [etapaId, setEtapaIdState] = useState<string>(DEFAULT_ETAPA_ID);

  useEffect(() => {
    const stored = localStorage.getItem(ETAPA_STORAGE_KEY);
    if (stored && isValidEtapaId(stored, etapas)) setEtapaIdState(stored);
  }, [etapas]);

  useEffect(() => {
    localStorage.setItem(ETAPA_STORAGE_KEY, etapaId);
    document.documentElement.dataset.etapa = etapaId;
    const etapa = etapas.find((e) => e.id === etapaId);
    if (etapa) applyPaletaToRoot(etapa.paleta);
  }, [etapaId, etapas]);

  const setEtapaId = useCallback((id: string) => {
    if (isValidEtapaId(id, etapas)) setEtapaIdState(id);
  }, [etapas]);

  const paleta = (etapas.find((e) => e.id === etapaId) ?? etapas[0]).paleta;

  return <Ctx.Provider value={{ etapaId, setEtapaId, etapas, paleta }}>{children}</Ctx.Provider>;
}

export function useEtapaActiva(): EtapaActivaValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEtapaActiva debe usarse dentro de <EtapaActivaProvider>");
  return v;
}
