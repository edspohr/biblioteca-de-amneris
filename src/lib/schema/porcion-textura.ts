import { z } from "zod";
import { slug } from "./common";

export const porcionTexturaSchema = z.object({
  etapa_id: slug,
  rango_edad: z.string().min(1, "El rango de edad es obligatorio"),
  porcion: z.string().min(1, "La porción es obligatoria"),
  textura: z.string().min(1, "La textura es obligatoria"),
});

export type PorcionTextura = z.infer<typeof porcionTexturaSchema>;
