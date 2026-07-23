import { z } from "zod";
import { slug } from "./common";
import { tipoComida } from "./receta";

export const menuRecetaSchema = z.object({
  receta_id: slug,
  momento: tipoComida,
  dia: z.string().nullable(),
});

export const menuSchema = z.object({
  id: slug,
  etapa_id: slug,
  nombre: z.string().min(1, "El nombre del menú es obligatorio"),
  dia: z.string().nullable(),
  menu_recetas: z.array(menuRecetaSchema),
});

export type Menu = z.infer<typeof menuSchema>;
export type MenuReceta = z.infer<typeof menuRecetaSchema>;
