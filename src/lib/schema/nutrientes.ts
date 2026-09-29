import { z } from "zod";

// Per-portion nutritional values as declared by the author on each recipe
// card. Values are declared "aproximados" until reviewed by a nutritionist —
// the reader must always render that caveat when this block is present.

export const nutrientesSchema = z.object({
  energiaKcal: z.number().nonnegative(),
  proteinasG: z.number().nonnegative(),
  carbohidratosG: z.number().nonnegative(),
  grasasG: z.number().nonnegative(),
  hierroMg: z.number().nonnegative(),
  calcioMg: z.number().nonnegative(),
  fibraG: z.number().nonnegative(),
  sodioMg: z.number().nonnegative(),
  aproximado: z.boolean().default(true),
  fuente: z.string().nullable().default(null),
});

export type Nutrientes = z.infer<typeof nutrientesSchema>;
