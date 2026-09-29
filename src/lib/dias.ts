import type { MenuCeldaDia } from "@/lib/schema";

// Weekday names appear in three spellings across menus: "Lunes" (original
// menus), "LUN" (imported plan menus' menu_recetas) and "lun" (plan celdas).
// Everything user-facing uses the long form.

export const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export type DiaLargo = (typeof DIAS_LARGOS)[number];

const CORTOS: MenuCeldaDia[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "LUN" | "lun" | "Lunes" | "miercoles" → "Lunes" | "Miércoles"; unknown → null. */
export function normalizarDia(dia: string | null | undefined): DiaLargo | null {
  if (!dia) return null;
  const k = sinTildes(dia.trim()).slice(0, 3);
  const i = CORTOS.indexOf(k as MenuCeldaDia);
  return i >= 0 ? DIAS_LARGOS[i] : null;
}

export function diaCorto(dia: DiaLargo): MenuCeldaDia {
  return CORTOS[DIAS_LARGOS.indexOf(dia)];
}
