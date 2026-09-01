"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Etapa, Paleta } from "@/lib/schema";
import { ETAPA_IDS } from "@/lib/schema";
import { computeEtapaFromBirthdate } from "./age";

export const ETAPA_STORAGE_KEY = "boc.etapaActiva";
export const OVERRIDE_STORAGE_KEY = "boc.etapaManualOverride";
const DEFAULT_ETAPA_ID = ETAPA_IDS[0];

interface EtapaActivaValue {
  etapaId: string;
  setEtapaId: (id: string) => void;
  etapas: Etapa[];
  paleta: Paleta;
  // Etapa que corresponde a la edad del bebé según su fecha de nacimiento
  // (null si no hay fecha registrada).
  autoEtapaId: string | null;
  // True cuando el usuario eligió manualmente una etapa distinta a la
  // sugerida por edad.
  manualOverride: boolean;
  // Vuelve al modo auto-seguir (borra el override).
  resetToAuto: () => void;
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

interface ProviderProps {
  etapas: Etapa[];
  children: ReactNode;
  initialBirthdate?: string | null;
  initialManualOverride?: { etapaId: string; setAt: string } | null;
}

export function EtapaActivaProvider({
  etapas,
  children,
  initialBirthdate = null,
  initialManualOverride = null,
}: ProviderProps) {
  const autoEtapaId = useMemo(() => {
    if (!initialBirthdate) return null;
    const e = computeEtapaFromBirthdate(initialBirthdate, etapas);
    return e?.id ?? null;
  }, [initialBirthdate, etapas]);

  const [etapaId, setEtapaIdState] = useState<string>(
    initialManualOverride?.etapaId && isValidEtapaId(initialManualOverride.etapaId, etapas)
      ? initialManualOverride.etapaId
      : autoEtapaId ?? DEFAULT_ETAPA_ID
  );
  const [manualOverride, setManualOverride] = useState<boolean>(
    Boolean(initialManualOverride)
  );

  // Ignore effects during the very first render burst so we don't race the
  // localStorage read + auto-follow logic.
  const hydrated = useRef(false);

  // Hydrate: reconcile server-provided override with localStorage. Server
  // profile takes precedence for logged-in users; localStorage is the source
  // for anons.
  useEffect(() => {
    const lsOverride = localStorage.getItem(OVERRIDE_STORAGE_KEY);
    const lsEtapa = localStorage.getItem(ETAPA_STORAGE_KEY);

    if (initialManualOverride?.etapaId && isValidEtapaId(initialManualOverride.etapaId, etapas)) {
      setEtapaIdState(initialManualOverride.etapaId);
      setManualOverride(true);
    } else if (initialBirthdate && autoEtapaId) {
      // Logged-in without override → auto-seguir la edad del bebé.
      setEtapaIdState(autoEtapaId);
      setManualOverride(false);
    } else if (lsOverride === "true" && lsEtapa && isValidEtapaId(lsEtapa, etapas)) {
      setEtapaIdState(lsEtapa);
      setManualOverride(true);
    } else if (lsEtapa && isValidEtapaId(lsEtapa, etapas)) {
      setEtapaIdState(lsEtapa);
    }
    hydrated.current = true;
  }, [initialBirthdate, initialManualOverride, autoEtapaId, etapas]);

  // Persist to localStorage + apply paleta on every change.
  useEffect(() => {
    localStorage.setItem(ETAPA_STORAGE_KEY, etapaId);
    document.documentElement.dataset.etapa = etapaId;
    const etapa = etapas.find((e) => e.id === etapaId);
    if (etapa) applyPaletaToRoot(etapa.paleta);
  }, [etapaId, etapas]);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(OVERRIDE_STORAGE_KEY, manualOverride ? "true" : "false");
  }, [manualOverride]);

  const setEtapaId = useCallback(
    (id: string) => {
      if (!isValidEtapaId(id, etapas)) return;
      setEtapaIdState(id);
      // Clicar una etapa cuenta como override solo si es distinta a la que
      // el sistema habría elegido automáticamente. Si el usuario elige la
      // misma que le tocaba, volvemos a modo auto.
      const isSameAsAuto = autoEtapaId !== null && id === autoEtapaId;
      const nextOverride = !isSameAsAuto && autoEtapaId !== null;
      setManualOverride(autoEtapaId === null ? false : nextOverride);
      if (initialBirthdate !== null) {
        void syncOverrideToServer(nextOverride ? { etapaId: id, setAt: new Date().toISOString() } : null);
      }
    },
    [autoEtapaId, etapas, initialBirthdate]
  );

  const resetToAuto = useCallback(() => {
    if (autoEtapaId) {
      setEtapaIdState(autoEtapaId);
      setManualOverride(false);
      void syncOverrideToServer(null);
    }
  }, [autoEtapaId]);

  const paleta = (etapas.find((e) => e.id === etapaId) ?? etapas[0]).paleta;

  return (
    <Ctx.Provider
      value={{
        etapaId,
        setEtapaId,
        etapas,
        paleta,
        autoEtapaId,
        manualOverride,
        resetToAuto,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useEtapaActiva(): EtapaActivaValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEtapaActiva debe usarse dentro de <EtapaActivaProvider>");
  return v;
}

async function syncOverrideToServer(
  override: { etapaId: string; setAt: string } | null
): Promise<void> {
  try {
    await fetch("/api/usuarios/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualEtapaOverride: override }),
    });
  } catch {
    // Non-fatal — el override sigue vivo en localStorage.
  }
}
