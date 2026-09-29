import { z } from "zod";
import { slug } from "./common";
import { tipoComida } from "./receta";
import { lineaCompraSchema } from "./plan";

export const menuRecetaSchema = z.object({
  receta_id: slug,
  momento: tipoComida,
  dia: z.string().nullable(),
});

// One cell of the 7×3 weekly grid (used by the reserva plan menus).
export const menuCeldaDia = z.enum([
  "lun",
  "mar",
  "mie",
  "jue",
  "vie",
  "sab",
  "dom",
]);
export type MenuCeldaDia = z.infer<typeof menuCeldaDia>;

export const menuCeldaSchema = z.object({
  dia: menuCeldaDia,
  tipoComida,
  recetaId: slug,
});
export type MenuCelda = z.infer<typeof menuCeldaSchema>;

export const menuSchema = z.object({
  id: slug,
  etapa_id: slug,
  nombre: z.string().min(1, "El nombre del menú es obligatorio"),
  dia: z.string().nullable(),
  menu_recetas: z.array(menuRecetaSchema),
  // New (Bocaditos de reserva). All optional; existing menus remain valid.
  planId: slug.optional(),
  semana: z.number().int().min(1).max(4).optional(),
  codigo: z.string().nullable().optional(),
  celdas: z.array(menuCeldaSchema).optional(),
  listaCompras: z.array(lineaCompraSchema).optional(),
  tip: z.string().nullable().optional(),
  advertencia: z.string().nullable().optional(),
});

export type Menu = z.infer<typeof menuSchema>;
export type MenuReceta = z.infer<typeof menuRecetaSchema>;
