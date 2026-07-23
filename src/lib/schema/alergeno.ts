import { z } from "zod";
import { slug } from "./common";

export const alergenoSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre del alérgeno es obligatorio"),
});

export type Alergeno = z.infer<typeof alergenoSchema>;
