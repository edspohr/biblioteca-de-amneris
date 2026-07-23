import { z } from "zod";
import { slug } from "./common";

export const tecnicaSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre de la técnica es obligatorio"),
  descripcion: z.string().nullable(),
  seccion_origen: z.string().nullable(),
});

export type Tecnica = z.infer<typeof tecnicaSchema>;
