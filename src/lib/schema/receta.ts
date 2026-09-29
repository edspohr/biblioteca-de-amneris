import { z } from "zod";
import { slug } from "./common";
import { nutrientesSchema } from "./nutrientes";
import { conservacionSchema } from "./conservacion";

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
  // "inferido" marks allergens the import pipeline derived from ingredients
  // (e.g. avena → gluten). The editor lets the author confirm or remove them.
  inferido: z.boolean().optional(),
});

export const recetaTecnicaSchema = z.object({
  tecnica_id: slug,
});

// Structured step (Bocaditos de reserva): acción + observación. The legacy
// `pasos: string[]` field is preserved; new content populates `pasosDetalle`.
export const pasoDetalleSchema = z.object({
  orden: z.number().int().nonnegative(),
  accion: z.string().min(1),
  observacion: z.string().nullable().default(null),
});
export type PasoDetalle = z.infer<typeof pasoDetalleSchema>;

// Vitamin/mineral tag with level ('alta'/'media'/'baja') and a short benefit
// note. The legacy `vitaminas: string[]` field stays for backward compat.
export const vitaminaDetalleSchema = z.object({
  etiquetaId: z.string().min(1),
  nivel: z.enum(["alta", "media", "baja"]).nullable().default(null),
  beneficio: z.string().nullable().default(null),
});
export type VitaminaDetalle = z.infer<typeof vitaminaDetalleSchema>;

export const rendimientoSchema = z.object({
  porciones: z.number().int().positive(),
  gramosPorPorcion: z.number().int().positive(),
});
export type Rendimiento = z.infer<typeof rendimientoSchema>;

// Per-stage variant. Currently only `textura` and `porcion` are used; new
// optional overrides let the reserva pipeline express per-stage differences
// (rendimiento, texturaObjetivo, pasos, nutrientes, conservación, etc.).
// Anything absent inherits from the recipe root.
export const varianteEtapaSchema = z.object({
  textura: z.string().min(1, "La textura es obligatoria"),
  porcion: z.string().min(1, "La porción es obligatoria"),
  // New (Bocaditos de reserva) overrides.
  rendimiento: rendimientoSchema.optional(),
  texturaObjetivo: z.string().optional(),
  tiempoMin: z.number().int().positive().optional(),
  ingredientes: z.array(recetaIngredienteSchema).optional(),
  pasos: z.array(pasoDetalleSchema).optional(),
  nutrientes: nutrientesSchema.optional(),
  conservaciones: z.array(conservacionSchema).optional(),
  advertencia: z.string().nullable().optional(),
  tip: z.string().nullable().optional(),
});
export type VarianteEtapa = z.infer<typeof varianteEtapaSchema>;

export const recetaSchema = z.object({
  id: slug,
  numero: z.number().int().nullable(),
  titulo: z.string().min(1, "El título es obligatorio"),
  destacadaPreview: z.boolean().default(false),
  // A recipe now applies only to the etapas that have a variant. The Fase 1
  // migration writes a variant per etapa for all 121 existing recipes, so
  // current behaviour is preserved; only new content (Bocaditos de reserva)
  // may set partial variantes.
  variantes: z.record(slug, varianteEtapaSchema),
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
  // New (Bocaditos de reserva). All optional; existing recipes remain valid.
  codigo: z.string().nullable().optional(),
  coleccionIds: z.array(slug).optional(),
  eje: z.string().nullable().optional(),
  rendimiento: rendimientoSchema.optional(),
  texturaObjetivo: z.string().nullable().optional(),
  nutrientes: nutrientesSchema.optional(),
  vitaminasDetalle: z.array(vitaminaDetalleSchema).optional(),
  conservaciones: z.array(conservacionSchema).optional(),
  pasosDetalle: z.array(pasoDetalleSchema).optional(),
  preparacionFresca: z.boolean().optional(),
  advertencia: z.string().nullable().optional(),
  tip: z.string().nullable().optional(),
  mensaje: z.string().nullable().optional(),
});

export type Receta = z.infer<typeof recetaSchema>;
export type RecetaIngrediente = z.infer<typeof recetaIngredienteSchema>;
export type RecetaAlergeno = z.infer<typeof recetaAlergenoSchema>;
export type RecetaTecnica = z.infer<typeof recetaTecnicaSchema>;
