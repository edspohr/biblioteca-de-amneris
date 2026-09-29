import { z } from "zod";
import { slug } from "./common";

// Embedded on Receta (root or per Variante). One recipe can list several
// conservation methods; the reader picks the best one to highlight per
// context (e.g. congelado for the reserva plan, refrigerado for fresh
// preparations).
//
// Techniques referenced here (freezing method, thawing, revive) live in the
// Tecnica catalog with fase='congelacion' or 'regeneracion'.

export const conservacionSchema = z.object({
  metodoId: slug,
  duracionDias: z.number().int().positive().nullable().default(null),
  envaseUtensilioId: slug.nullable().default(null),
  tecnicaEnfriadoId: slug.nullable().default(null),
  tecnicaCongeladoId: slug.nullable().default(null),
  tecnicaRegeneracionId: slug.nullable().default(null),
  nota: z.string().nullable().default(null),
});

export type Conservacion = z.infer<typeof conservacionSchema>;
