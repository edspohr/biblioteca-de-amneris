import type { Etapa } from "@/lib/schema";

const SANTIAGO_TZ = "America/Santiago";

/**
 * Calcula meses completos entre `birthdate` (YYYY-MM-DD) y `now` (Date),
 * usando el calendario de America/Santiago para no perder días por DST.
 */
export function monthsSince(birthdate: string, now: Date = new Date()): number {
  const parts = parseIsoDate(birthdate);
  if (!parts) return 0;
  const nowInTz = nowPartsInTz(now, SANTIAGO_TZ);
  let months =
    (nowInTz.year - parts.year) * 12 + (nowInTz.month - parts.month);
  if (nowInTz.day < parts.day) months -= 1;
  return Math.max(0, months);
}

/**
 * Devuelve la etapa cuyo rango numérico contiene la edad en meses, con clamps
 * a la primera/última etapa cuando la edad está fuera de rango. Cae al orden
 * más bajo (o al primer resultado) si dos etapas se solapan.
 */
export function computeEtapaFromBirthdate(
  birthdate: string,
  etapas: Etapa[],
  now: Date = new Date()
): Etapa | null {
  if (etapas.length === 0) return null;
  const months = monthsSince(birthdate, now);
  const sorted = [...etapas].sort((a, b) => a.orden - b.orden);
  const match = sorted.find(
    (e) => months >= e.edad_min_meses && months <= e.edad_max_meses
  );
  if (match) return match;
  // Fuera de rango: si es muy joven, primera etapa; si es muy grande, última.
  if (months < sorted[0].edad_min_meses) return sorted[0];
  return sorted[sorted.length - 1];
}

function parseIsoDate(
  s: string
): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
}

function nowPartsInTz(
  now: Date,
  tz: string
): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
