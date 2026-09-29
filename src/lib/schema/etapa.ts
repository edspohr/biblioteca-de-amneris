import { z } from "zod";
import { slug } from "./common";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hex de 6 dígitos (ej. #B8E0C8)");

export const paletaSchema = z.object({
  primary: hex,
  accent: hex,
  soft: hex,
  ink: hex,
});
export type Paleta = z.infer<typeof paletaSchema>;

// Grams-per-portion by meal type. Populated for the reserva plan (E1/E2/E3
// have specific values); optional to keep the reader working before the
// backfill migration.
export const porcionPorComidaSchema = z.object({
  desayuno: z.number().int().positive(),
  almuerzo: z.number().int().positive(),
  cena: z.number().int().positive(),
});
export type PorcionPorComida = z.infer<typeof porcionPorComidaSchema>;

// Kilograms produced per month for the batch-cooking plan (from B3-P8).
export const rendimientoMensualKgSchema = z.object({
  desayunos: z.number().nonnegative(),
  almuerzos: z.number().nonnegative(),
  cenas: z.number().nonnegative(),
  total: z.number().nonnegative(),
});
export type RendimientoMensualKg = z.infer<typeof rendimientoMensualKgSchema>;

export const etapaSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre de la etapa es obligatorio"),
  textura: z.string().min(1, "La textura es obligatoria"),
  rango_edad: z.string().min(1, "El rango de edad es obligatorio"),
  edad_min_meses: z.number().int().nonnegative().default(0),
  edad_max_meses: z.number().int().nonnegative().default(999),
  orden: z.number().int().min(1, "El orden debe ser un entero positivo"),
  paleta: paletaSchema,
  descripcion: z.string().nullable().optional(),
  // New (Bocaditos de reserva). Optional until the etapa backfill runs.
  porcionPorComida: porcionPorComidaSchema.nullable().optional(),
  rendimientoMensualKg: rendimientoMensualKgSchema.nullable().optional(),
});

export type Etapa = z.infer<typeof etapaSchema>;
