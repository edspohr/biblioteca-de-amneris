import { z } from "zod";
import { slug } from "./common";

// Stage suitability. Used for the seasonings table (B3-P6) and any
// ingredient where quantity or usage changes materially by baby age.
// "pizca" means allowed only in trace amounts.
export const aptoEtapaValor = z.enum(["si", "no", "pizca"]);
export type AptoEtapaValor = z.infer<typeof aptoEtapaValor>;

export const ingredienteSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre del ingrediente es obligatorio"),
  categoria: z.string().min(1, "La categoría es obligatoria"),
  // New (Bocaditos de reserva). Optional; when absent the ingredient is
  // treated as apto for all etapas (the current default for the 100+ existing
  // ingredients).
  aptoPorEtapa: z.record(slug, aptoEtapaValor).optional(),
  notaEtapa: z.string().nullable().optional(),
});

export type Ingrediente = z.infer<typeof ingredienteSchema>;
