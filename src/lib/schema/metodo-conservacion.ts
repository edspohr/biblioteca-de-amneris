import { z } from "zod";
import { slug } from "./common";

// Closed catalog: refrigerado, congelado, ambiente today. The catalog exists
// so future methods (vacío, salado, deshidratado) can be added without a
// schema change.

export const metodoConservacionSchema = z.object({
  id: slug,
  nombre: z.string().min(1),
  descripcion: z.string().nullable().default(null),
  temperaturaC: z
    .object({ min: z.number(), max: z.number() })
    .nullable()
    .default(null),
});

export type MetodoConservacion = z.infer<typeof metodoConservacionSchema>;
