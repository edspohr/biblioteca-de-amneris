import { z } from "zod";
import { slug } from "./common";

// Narrative content that lives alongside a colección: the intro letter,
// equipment guides, freezing strategy, thawing tables, seasonings-per-etapa.
// Recipes stay concise; guides hold the prose.

export const avisoTipo = z.enum(["tip", "advertencia"]);
export type AvisoTipo = z.infer<typeof avisoTipo>;

const bloqueParrafo = z.object({
  kind: z.literal("parrafo"),
  texto: z.string().min(1),
});
const bloqueLista = z.object({
  kind: z.literal("lista"),
  ordenada: z.boolean().default(false),
  items: z.array(z.string()).min(1),
});
// Cada fila envuelta en {celdas} porque Firestore rechaza arrays directamente
// anidados en arrays. Con esto la fila queda como objeto en `filas[]`.
export const filaTablaSchema = z.object({
  celdas: z.array(z.string()),
});
export type FilaTabla = z.infer<typeof filaTablaSchema>;

const bloqueTabla = z.object({
  kind: z.literal("tabla"),
  columnas: z.array(z.string()).min(1),
  filas: z.array(filaTablaSchema),
});
const bloqueAviso = z.object({
  kind: z.literal("aviso"),
  tipo: avisoTipo,
  texto: z.string().min(1),
});

export const bloqueSchema = z.discriminatedUnion("kind", [
  bloqueParrafo,
  bloqueLista,
  bloqueTabla,
  bloqueAviso,
]);
export type Bloque = z.infer<typeof bloqueSchema>;

export const guiaSchema = z.object({
  id: slug,
  coleccionId: slug,
  codigo: z.string().nullable().default(null),
  titulo: z.string().min(1),
  subtitulo: z.string().nullable().default(null),
  orden: z.number().int().nonnegative().default(0),
  bloques: z.array(bloqueSchema).default([]),
});

export type Guia = z.infer<typeof guiaSchema>;
