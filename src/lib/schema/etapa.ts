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

export const etapaSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre de la etapa es obligatorio"),
  textura: z.string().min(1, "La textura es obligatoria"),
  rango_edad: z.string().min(1, "El rango de edad es obligatorio"),
  orden: z.number().int().min(1, "El orden debe ser un entero positivo"),
  paleta: paletaSchema,
  descripcion: z.string().nullable().optional(),
});

export type Etapa = z.infer<typeof etapaSchema>;
