import { z } from "zod";
import { slug } from "./common";

export const tipoComida = z.enum(["desayuno", "almuerzo", "merienda", "cena", "colacion"]);
export type TipoComida = z.infer<typeof tipoComida>;

export const ETAPA_IDS = ["etapa-1", "etapa-2", "etapa-3"] as const;
export type EtapaId = (typeof ETAPA_IDS)[number];

export const recetaIngredienteSchema = z.object({
  ingrediente_id: slug,
  cantidad: z.number().nullable(),
  unidad: z.string().nullable(),
  nota: z.string().nullable(),
});

export const recetaAlergenoSchema = z.object({
  alergeno_id: slug,
});

export const recetaTecnicaSchema = z.object({
  tecnica_id: slug,
});

export const varianteEtapaSchema = z.object({
  textura: z.string().min(1, "La textura es obligatoria"),
  porcion: z.string().min(1, "La porción es obligatoria"),
});
export type VarianteEtapa = z.infer<typeof varianteEtapaSchema>;

export const recetaSchema = z.object({
  id: slug,
  numero: z.number().int().nullable(),
  titulo: z.string().min(1, "El título es obligatorio"),
  variantes: z
    .record(slug, varianteEtapaSchema)
    .refine((v) => ETAPA_IDS.every((id) => id in v), {
      message: "Se requieren variantes para las 3 etapas (etapa-1, etapa-2, etapa-3)",
    }),
  tipo_comida: tipoComida,
  minutos_prep: z.number().int().positive().nullable(),
  kcal_100g: z.number().nullable(),
  vitaminas: z.array(z.string()),
  congelable: z.boolean().nullable(),
  conservacion: z.string().nullable(),
  pasos: z.array(z.string()),
  notas: z.string().nullable(),
  foto: z.string().nullable(),
  receta_ingredientes: z.array(recetaIngredienteSchema),
  receta_alergenos: z.array(recetaAlergenoSchema),
  receta_tecnicas: z.array(recetaTecnicaSchema),
});

export type Receta = z.infer<typeof recetaSchema>;
export type RecetaIngrediente = z.infer<typeof recetaIngredienteSchema>;
export type RecetaAlergeno = z.infer<typeof recetaAlergenoSchema>;
export type RecetaTecnica = z.infer<typeof recetaTecnicaSchema>;
