import { z } from "zod";
import { slug } from "./common";

// A cooking-day plan that produces a month of frozen portions from one
// session (the "Bocaditos de reserva" format). Groups menus, guides,
// utensils and the 5-phase day schedule.

export const faseTipo = z.enum([
  "preparacion",
  "masas_horno",
  "estufa",
  "enfriado",
  "empaque",
]);
export type FaseTipo = z.infer<typeof faseTipo>;

export const faseSchema = z.object({
  orden: z.number().int().nonnegative(),
  titulo: z.string().min(1),
  tipo: faseTipo,
  desdeMin: z.number().int().nonnegative(),
  hastaMin: z.number().int().nonnegative(),
  accion: z.string().min(1),
  detalle: z.string().nullable().default(null),
  recetaIds: z.array(slug).default([]),
  tecnicaIds: z.array(slug).default([]),
});
export type Fase = z.infer<typeof faseSchema>;

export const lineaCompraSchema = z.object({
  categoria: z.string().min(1),
  ingredienteId: slug,
  cantidad: z.number().nullable().default(null),
  unidad: z.string().nullable().default(null),
  textoOriginal: z.string().nullable().default(null),
});
export type LineaCompra = z.infer<typeof lineaCompraSchema>;

// Monthly yield per etapa: grams / kg produced per meal type. Populated from
// B3-P8 (autora) and cross-checked against the recipes in the plan.
export const rendimientoPorEtapaSchema = z.record(
  slug,
  z.object({
    desayunosKg: z.number().nonnegative(),
    almuerzosKg: z.number().nonnegative(),
    cenasKg: z.number().nonnegative(),
    totalKg: z.number().nonnegative(),
  })
);
export type RendimientoPorEtapa = z.infer<typeof rendimientoPorEtapaSchema>;

export const planSchema = z.object({
  id: slug,
  coleccionId: slug,
  titulo: z.string().min(1),
  bajada: z.string().min(1),
  eje: z.string().nullable().default(null),
  duracionTotalMin: z.number().int().positive().default(240),
  diasCubiertos: z.number().int().positive().default(30),
  utensilioIds: z.array(slug).default([]),
  listaComprasMensual: z.array(lineaCompraSchema).default([]),
  rendimientoPorEtapa: rendimientoPorEtapaSchema.default({}),
  menuIds: z.array(slug).default([]),
  guiaIds: z.array(slug).default([]),
  fases: z.array(faseSchema).default([]),
});

export type Plan = z.infer<typeof planSchema>;
