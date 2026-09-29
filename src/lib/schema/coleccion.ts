import { z } from "zod";
import { slug } from "./common";

// A "colección" is a section of the library — a book (e.g. "Bocaditos del
// Corazón"), a batch-cooking plan ("Bocaditos de reserva: Pollo") or a
// standalone guide. The reader home lists these; the recipe browser can
// filter by them.

export const coleccionTipo = z.enum(["recetario", "plan", "guia"]);
export type ColeccionTipo = z.infer<typeof coleccionTipo>;

// `programada` behaves like `proximamente` until `fechaLanzamiento` arrives,
// then like `publicada` — no cron needed, it's resolved on read (see
// `estadoEfectivo` in src/lib/colecciones.ts).
export const coleccionEstado = z.enum(["publicada", "programada", "proximamente", "oculta"]);
export type ColeccionEstado = z.infer<typeof coleccionEstado>;

export const coleccionEje = z.enum([
  "pollo",
  "pescado",
  "vacuno",
  "vegetal",
  "mixto",
]);
export type ColeccionEje = z.infer<typeof coleccionEje>;

// Preset palettes for the typographic covers. Kept as a closed list so the
// author picks from combinations that already fit the book's design; the
// actual hex values live in src/lib/colecciones.ts.
export const coleccionTono = z.enum([
  "terracota",
  "mostaza",
  "mar",
  "salvia",
  "lavanda",
  "rosa",
]);
export type ColeccionTono = z.infer<typeof coleccionTono>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD");

export const coleccionSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre es obligatorio"),
  bajada: z.string().min(1, "La bajada es obligatoria"),
  tipo: coleccionTipo,
  eje: coleccionEje.nullable().default(null),
  orden: z.number().int().nonnegative().default(0),
  estado: coleccionEstado.default("oculta"),
  portadaUrl: z.string().nullable().default(null),
  descripcionCorta: z.string().nullable().default(null),
  // Cover design (Fase 1 UI). Null falls back to a default derived from the
  // collection's id / eje.
  tono: coleccionTono.nullable().default(null),
  icono: z.string().max(8).nullable().default(null),
  // Launch day: shown as "llega el …" while upcoming, drives the "Nuevo"
  // badge after release, and flips `programada` to published.
  fechaLanzamiento: isoDate.nullable().default(null),
});

export type Coleccion = z.infer<typeof coleccionSchema>;
