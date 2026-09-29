import { z } from "zod";
import { slug } from "./common";

// Where in the workflow the technique applies. Existing techniques default
// to "preparacion" via the migration; congelación / regeneración split lets
// the reserva plan surface only the relevant ones per context.
export const tecnicaFase = z.enum([
  "preparacion",
  "coccion",
  "conservacion",
  "regeneracion",
  "seguridad",
]);
export type TecnicaFase = z.infer<typeof tecnicaFase>;

export const tecnicaPasoSchema = z.object({
  orden: z.number().int().nonnegative(),
  accion: z.string().min(1),
  detalle: z.string().nullable().default(null),
});
export type TecnicaPaso = z.infer<typeof tecnicaPasoSchema>;

export const tecnicaSchema = z.object({
  id: slug,
  nombre: z.string().min(1, "El nombre de la técnica es obligatorio"),
  descripcion: z.string().nullable(),
  seccion_origen: z.string().nullable(),
  // New (Bocaditos de reserva). All optional until the technique backfill runs.
  fase: tecnicaFase.optional(),
  pasos: z.array(tecnicaPasoSchema).optional(),
  // Which recipe formats this revive/regeneration applies to (bastones,
  // muffins, purés, panqueques…). Empty for non-regeneration techniques.
  formatosAplicables: z.array(z.string()).optional(),
  advertencia: z.string().nullable().optional(),
});

export type Tecnica = z.infer<typeof tecnicaSchema>;
