import { z } from "zod";
import { slug } from "./common";

export const ingredienteSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre del ingrediente es obligatorio"),
  categoria: z.string().min(1, "La categoría es obligatoria"),
});

export type Ingrediente = z.infer<typeof ingredienteSchema>;
