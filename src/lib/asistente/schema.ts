import { z } from "zod";
import { ETAPA_IDS, tipoComida } from "@/lib/schema/receta";

/**
 * Argument schemas for every tool the model can call. Kept separate from
 * the tool implementations so the same schema drives validation *and* the
 * Gemini tool declaration.
 */

export const buscarRecetasSchema = z.object({
  texto: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Palabra libre — coincide contra el título de la receta O contra el nombre de cualquiera de sus ingredientes. Ej. 'pollo' encuentra tanto recetas con 'pollo' en el título como recetas donde el pollo es ingrediente."
    ),
  tipo_comida: tipoComida.optional(),
  minutos_max: z.number().int().positive().max(240).optional(),
  congelable: z.boolean().optional(),
  alergenos_excluidos: z.array(z.string()).max(20).optional(),
});

export const obtenerRecetaSchema = z.object({
  slug: z.string().min(1).max(120),
  etapa_id: z.enum(ETAPA_IDS).optional(),
});

export const buscarMenusSchema = z.object({
  etapa_id: z.enum(ETAPA_IDS),
});

export const sugerirMenuSchema = z.object({
  edad_meses: z.number().int().min(6).max(24),
  ingredientes_disponibles: z.array(z.string()).min(1).max(20),
});

export const listaDeComprasSchema = z.object({
  menu_id: z.string().min(1).max(120),
});
