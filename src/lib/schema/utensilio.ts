import { z } from "zod";
import { slug } from "./common";

// Cooking-day utensils, containers and small appliances. Referenced from
// Plan.utensilioIds and from Conservacion.envaseUtensilioId (the fridge/
// freezer container the portion is stored in).

export const utensilioTipo = z.enum([
  "envase",
  "herramienta",
  "electrodomestico",
  "consumible",
]);
export type UtensilioTipo = z.infer<typeof utensilioTipo>;

export const utensilioSchema = z.object({
  id: slug,
  nombre: z.string().min(1),
  tipo: utensilioTipo,
  paraQue: z.string().min(1),
  aptoCongelador: z.boolean().default(false),
  capacidad: z.string().nullable().default(null),
});

export type Utensilio = z.infer<typeof utensilioSchema>;
