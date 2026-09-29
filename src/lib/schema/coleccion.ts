import { z } from "zod";
import { slug } from "./common";

// A "colección" is a section of the library — a book (e.g. "Bocaditos del
// Corazón"), a batch-cooking plan ("Bocaditos de reserva: Pollo") or a
// standalone guide. The reader home lists these; the recipe browser can
// filter by them.

export const coleccionTipo = z.enum(["recetario", "plan", "guia"]);
export type ColeccionTipo = z.infer<typeof coleccionTipo>;

export const coleccionEstado = z.enum(["publicada", "proximamente", "oculta"]);
export type ColeccionEstado = z.infer<typeof coleccionEstado>;

export const coleccionEje = z.enum([
  "pollo",
  "pescado",
  "vacuno",
  "vegetal",
  "mixto",
]);
export type ColeccionEje = z.infer<typeof coleccionEje>;

export const coleccionSchema = z.object({
  id: slug,
  nombre: z.string().min(1),
  bajada: z.string().min(1),
  tipo: coleccionTipo,
  eje: coleccionEje.nullable().default(null),
  orden: z.number().int().nonnegative().default(0),
  estado: coleccionEstado.default("oculta"),
  portadaUrl: z.string().nullable().default(null),
  descripcionCorta: z.string().nullable().default(null),
});

export type Coleccion = z.infer<typeof coleccionSchema>;
