import type { Coleccion, ColeccionTono, Guia, Menu, Plan, Receta } from "@/lib/schema";

// Presentation helpers for colecciones: cover palettes, the effective state
// (resolving `programada` against today's date) and the "Nuevo" window.
// Pure functions — callers pass in whatever data they already loaded.

export interface TonoPaleta {
  label: string;
  soft: string; // cover background
  primary: string; // decorative shapes
  accent: string; // numbers, badges
  ink: string; // title text
}

export const TONOS: Record<ColeccionTono, TonoPaleta> = {
  terracota: { label: "Terracota", soft: "#fdf0e8", primary: "#f5c4a8", accent: "#c45e32", ink: "#7a2f0f" },
  mostaza: { label: "Mostaza", soft: "#fbf3dc", primary: "#f2d48a", accent: "#a87a0a", ink: "#5e4300" },
  mar: { label: "Mar", soft: "#e8f1f6", primary: "#b5d3e6", accent: "#3a7ca5", ink: "#1f4a66" },
  salvia: { label: "Salvia", soft: "#edf5ed", primary: "#b8d8b8", accent: "#3d7a3d", ink: "#2f5d46" },
  lavanda: { label: "Lavanda", soft: "#f3eef9", primary: "#d4b8e8", accent: "#6b3fa0", ink: "#4a3771" },
  rosa: { label: "Rosa", soft: "#fbecea", primary: "#f3c2bb", accent: "#b8505f", ink: "#6e2733" },
};

export const TONO_IDS = Object.keys(TONOS) as ColeccionTono[];

export function tonoDe(c: Pick<Coleccion, "tono" | "eje" | "tipo">): ColeccionTono {
  if (c.tono) return c.tono;
  switch (c.eje) {
    case "pollo":
      return "mostaza";
    case "pescado":
      return "mar";
    case "vegetal":
      return "salvia";
    case "vacuno":
      return "rosa";
    default:
      return c.tipo === "guia" ? "lavanda" : "terracota";
  }
}

export function iconoDe(c: Pick<Coleccion, "icono" | "eje" | "tipo">): string {
  if (c.icono) return c.icono;
  switch (c.eje) {
    case "pollo":
      return "🐔";
    case "pescado":
      return "🐟";
    case "vegetal":
      return "🥕";
    case "vacuno":
      return "🥩";
    default:
      return c.tipo === "plan" ? "🍲" : c.tipo === "guia" ? "📖" : "🧡";
  }
}

/** CSS custom properties to theme any collection surface. */
export function tonoStyle(c: Pick<Coleccion, "tono" | "eje" | "tipo">): Record<string, string> {
  const p = TONOS[tonoDe(c)];
  return {
    "--col-soft": p.soft,
    "--col-primary": p.primary,
    "--col-accent": p.accent,
    "--col-ink": p.ink,
  };
}

export const TIPO_LABEL: Record<Coleccion["tipo"], string> = {
  recetario: "Recetario",
  plan: "Plan de cocina",
  guia: "Guía",
};

// -- Dates ------------------------------------------------------------------

const TZ = "America/Santiago";

/** Today as YYYY-MM-DD in Chile's timezone. */
export function hoyISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

function diffDias(desde: string, hasta: string): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10));
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** "5 de octubre" (adds the year when it isn't the current one). */
export function formatFecha(iso: string, hoy: string = hoyISO()): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", timeZone: "UTC" };
  if (iso.slice(0, 4) !== hoy.slice(0, 4)) opts.year = "numeric";
  return new Intl.DateTimeFormat("es-CL", opts).format(d);
}

// -- State ------------------------------------------------------------------

export type EstadoEfectivo = "publicada" | "proximamente" | "oculta";

export function estadoEfectivo(c: Coleccion, hoy: string = hoyISO()): EstadoEfectivo {
  if (c.estado === "programada") {
    return c.fechaLanzamiento && c.fechaLanzamiento <= hoy ? "publicada" : "proximamente";
  }
  return c.estado;
}

/** Days a published collection keeps its "Nuevo" badge. */
export const DIAS_NUEVO = 30;

export function esNueva(c: Coleccion, hoy: string = hoyISO()): boolean {
  if (estadoEfectivo(c, hoy) !== "publicada" || !c.fechaLanzamiento) return false;
  const d = diffDias(c.fechaLanzamiento, hoy);
  return d >= 0 && d < DIAS_NUEVO;
}

/** Days until launch (0 = today), or null if no future date. */
export function diasParaLanzamiento(c: Coleccion, hoy: string = hoyISO()): number | null {
  if (!c.fechaLanzamiento) return null;
  const d = diffDias(hoy, c.fechaLanzamiento);
  return d >= 0 ? d : null;
}

/** Human line for upcoming collections: "Llega en 6 días · 5 de octubre". */
export function lineaLanzamiento(c: Coleccion, hoy: string = hoyISO()): string | null {
  const dias = diasParaLanzamiento(c, hoy);
  if (dias == null || !c.fechaLanzamiento) return null;
  const fecha = formatFecha(c.fechaLanzamiento, hoy);
  if (dias === 0) return `Llega hoy · ${fecha}`;
  if (dias === 1) return `Llega mañana · ${fecha}`;
  if (dias <= 45) return `Llega en ${dias} días · ${fecha}`;
  return `Llega el ${fecha}`;
}

// -- Stats ------------------------------------------------------------------

export interface ColeccionDato {
  valor: string;
  label: string;
}

interface Contenido {
  colecciones: Coleccion[];
  recetas: Receta[];
  menus: Menu[];
  guias: Guia[];
  planes: Plan[];
}

export function recetasDeColeccion(id: string, recetas: Receta[]): Receta[] {
  return recetas.filter((r) => (r.coleccionIds ?? []).includes(id));
}

/**
 * Which colección a menu belongs to. Plan menus carry `planId`; the original
 * weekly menus predate colecciones and belong to the first recetario.
 */
export function coleccionDeMenu(m: Menu, colecciones: Coleccion[]): string | null {
  if (m.planId) return m.planId;
  const recetario = [...colecciones]
    .filter((c) => c.tipo === "recetario")
    .sort((a, b) => a.orden - b.orden)[0];
  return recetario?.id ?? null;
}

/** Week number: `semana` on plan menus, parsed from "Semana N" on older ones. */
export function numeroSemana(m: Menu): number | null {
  if (m.semana != null) return m.semana;
  const n = m.nombre.match(/^Semana\s+(\d+)/i)?.[1];
  return n ? Number(n) : null;
}

export function menusDeColeccion(c: Coleccion, menus: Menu[], colecciones: Coleccion[]): Menu[] {
  return menus.filter((m) => coleccionDeMenu(m, colecciones) === c.id);
}

/** Headline figure + supporting figures for covers and heroes. */
export function datosColeccion(c: Coleccion, data: Contenido): ColeccionDato[] {
  const recetas = recetasDeColeccion(c.id, data.recetas).length;
  const menus = menusDeColeccion(c, data.menus, data.colecciones).length;
  const guias = data.guias.filter((g) => g.coleccionId === c.id).length;
  const plan = data.planes.find((p) => p.coleccionId === c.id);

  const out: ColeccionDato[] = [];
  if (c.tipo === "plan") {
    out.push({ valor: String(plan?.diasCubiertos ?? 30), label: "días resueltos" });
    out.push({ valor: `${Math.round((plan?.duracionTotalMin ?? 240) / 60)} h`, label: "de cocina" });
    if (menus) out.push({ valor: String(menus), label: menus === 1 ? "menú semanal" : "menús semanales" });
    if (recetas) out.push({ valor: String(recetas), label: "recetas" });
    if (guias) out.push({ valor: String(guias), label: guias === 1 ? "guía" : "guías" });
  } else if (c.tipo === "recetario") {
    out.push({ valor: String(recetas), label: "recetas" });
    if (menus) out.push({ valor: String(menus), label: menus === 1 ? "menú semanal" : "menús semanales" });
    out.push({ valor: "3", label: "etapas" });
    if (guias) out.push({ valor: String(guias), label: guias === 1 ? "guía" : "guías" });
  } else {
    out.push({ valor: String(guias), label: guias === 1 ? "guía" : "guías" });
  }
  return out;
}

// -- Novedades --------------------------------------------------------------

/**
 * Recipes added in the last `DIAS_NUEVO` days whose collection is out
 * (recipes without a collection count too). Newest first.
 */
export function recetasNuevas(
  recetas: Receta[],
  colecciones: Coleccion[],
  hoy: string = hoyISO()
): Receta[] {
  const publicadas = new Set(
    colecciones.filter((c) => estadoEfectivo(c, hoy) === "publicada").map((c) => c.id)
  );
  return recetas
    .filter((r) => {
      if (!r.publicadaEn) return false;
      const d = diffDias(r.publicadaEn, hoy);
      if (d < 0 || d >= DIAS_NUEVO) return false;
      const ids = r.coleccionIds ?? [];
      return ids.length === 0 || ids.some((id) => publicadas.has(id));
    })
    .sort((a, b) => (b.publicadaEn ?? "").localeCompare(a.publicadaEn ?? "") || a.titulo.localeCompare(b.titulo));
}

// -- Admin wording ----------------------------------------------------------

/** Plain-language names for the stored states, as the author sees them. */
export const ESTADO_ADMIN: Record<Coleccion["estado"], { label: string; hint: string }> = {
  oculta: { label: "Borrador", hint: "Solo tú la ves. Nadie más sabe que existe." },
  proximamente: {
    label: "Anunciada",
    hint: "Aparece en la biblioteca como «Próximamente», sin contenido.",
  },
  programada: {
    label: "Programada",
    hint: "Se ve como «Próximamente» y se publica sola el día elegido.",
  },
  publicada: { label: "Publicada", hint: "Todas las lectoras pueden abrirla." },
};

export const ESTADOS_ORDEN: Coleccion["estado"][] = ["oculta", "proximamente", "programada", "publicada"];
