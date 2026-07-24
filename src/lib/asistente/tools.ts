import "server-only";
import { z } from "zod";
import { repo } from "@/lib/repo";
import { computeListaCompras } from "@/lib/derived/lista-compras";
import type { EtapaId } from "@/lib/schema/receta";
import {
  buscarMenusSchema,
  buscarRecetasSchema,
  listaDeComprasSchema,
  obtenerRecetaSchema,
  sugerirMenuSchema,
} from "./schema";

// -- Deterministic helpers ---------------------------------------------------

function edadMesesAEtapa(edadMeses: number): EtapaId {
  if (edadMeses < 10) return "etapa-1";
  if (edadMeses < 12) return "etapa-2";
  return "etapa-3";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// -- Tool implementations ----------------------------------------------------

export type ToolName =
  | "buscarRecetas"
  | "obtenerReceta"
  | "buscarMenus"
  | "sugerirMenu"
  | "listaDeCompras";

export interface ToolResult {
  ok: true;
  data: unknown;
  // Slugs actually returned. The route validator checks that any slug the
  // model mentions in its final answer appears in this cumulative allowlist.
  citedSlugs: string[];
}

export interface ToolError {
  ok: false;
  error: string;
}

// Small helper — parses args, catches Zod errors, returns typed ToolError.
async function withArgs<S extends z.ZodType, T>(
  schema: S,
  raw: unknown,
  fn: (args: z.infer<S>) => Promise<T>
): Promise<T | ToolError> {
  try {
    const args = schema.parse(raw);
    return await fn(args);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Argumentos inválidos: " + err.errors.map((e) => e.message).join("; ") };
    }
    return { ok: false, error: "Error interno de la herramienta." };
  }
}

export async function buscarRecetas(raw: unknown): Promise<ToolResult | ToolError> {
  return withArgs(buscarRecetasSchema, raw, async (args) => {
    const [all, ingredientes, alergenos] = await Promise.all([
      repo.getRecetas(),
      repo.getIngredientes(),
      repo.getAlergenos(),
    ]);
    // Map exclusion identifiers (accept slugs or names) to canonical slugs.
    const alergenoIdBySlug = new Set(alergenos.map((a) => a.id));
    const alergenoIdByNombre = new Map(
      alergenos.map((a) => [normalize(a.nombre), a.id])
    );
    const excludeIds = new Set(
      (args.alergenos_excluidos ?? [])
        .map((raw) => {
          const norm = normalize(raw);
          if (alergenoIdBySlug.has(raw)) return raw;
          return alergenoIdByNombre.get(norm) ?? null;
        })
        .filter((x): x is string => Boolean(x))
    );

    const texto = args.texto ? normalize(args.texto) : null;
    const filtered = all.filter((r) => {
      if (args.tipo_comida && r.tipo_comida !== args.tipo_comida) return false;
      if (args.minutos_max != null && (r.minutos_prep ?? Infinity) > args.minutos_max)
        return false;
      if (args.congelable != null && r.congelable !== args.congelable) return false;
      if (excludeIds.size > 0 && r.receta_alergenos.some((ra) => excludeIds.has(ra.alergeno_id)))
        return false;
      if (texto && !normalize(r.titulo).includes(texto)) return false;
      return true;
    });

    const limited = filtered.slice(0, 10);
    const ingredienteNombre = new Map(ingredientes.map((i) => [i.id, i.nombre]));
    const data = limited.map((r) => ({
      slug: r.id,
      titulo: r.titulo,
      tipo: r.tipo_comida,
      minutos: r.minutos_prep,
      congelable: r.congelable,
      ingredientes_principales: r.receta_ingredientes
        .slice(0, 5)
        .map((ri) => ingredienteNombre.get(ri.ingrediente_id) ?? ri.ingrediente_id),
      url: `/recetas/${r.id}`,
    }));

    return {
      ok: true as const,
      data: {
        total_encontradas: filtered.length,
        mostradas: data.length,
        recetas: data,
      },
      citedSlugs: limited.map((r) => r.id),
    };
  });
}

export async function obtenerReceta(raw: unknown): Promise<ToolResult | ToolError> {
  return withArgs(obtenerRecetaSchema, raw, async (args) => {
    const r = await repo.getReceta(args.slug);
    if (!r) return { ok: false as const, error: `No existe una receta con id "${args.slug}".` };
    const etapaId = args.etapa_id ?? "etapa-1";
    const variante = r.variantes[etapaId];
    const [ingredientes, alergenos] = await Promise.all([
      repo.getIngredientes(),
      repo.getAlergenos(),
    ]);
    const ingNombre = new Map(ingredientes.map((i) => [i.id, i.nombre]));
    const aleNombre = new Map(alergenos.map((a) => [a.id, a.nombre]));
    return {
      ok: true as const,
      data: {
        slug: r.id,
        titulo: r.titulo,
        tipo: r.tipo_comida,
        minutos: r.minutos_prep,
        kcal_100g: r.kcal_100g,
        congelable: r.congelable,
        conservacion: r.conservacion,
        etapa: etapaId,
        variante: variante ?? null,
        ingredientes: r.receta_ingredientes.map((ri) => ({
          nombre: ingNombre.get(ri.ingrediente_id) ?? ri.ingrediente_id,
          cantidad: ri.cantidad,
          unidad: ri.unidad,
          nota: ri.nota,
        })),
        pasos: r.pasos,
        alergenos: r.receta_alergenos.map((ra) => aleNombre.get(ra.alergeno_id) ?? ra.alergeno_id),
        url: `/recetas/${r.id}`,
      },
      citedSlugs: [r.id],
    };
  });
}

export async function buscarMenus(raw: unknown): Promise<ToolResult | ToolError> {
  return withArgs(buscarMenusSchema, raw, async (args) => {
    const menus = (await repo.getMenus()).filter((m) => m.etapa_id === args.etapa_id);
    return {
      ok: true as const,
      data: menus.map((m) => ({
        slug: m.id,
        nombre: m.nombre,
        etapa: m.etapa_id,
        recetas_count: m.menu_recetas.length,
        url: `/menus/${m.id}`,
      })),
      citedSlugs: menus.map((m) => m.id),
    };
  });
}

export async function sugerirMenu(raw: unknown): Promise<ToolResult | ToolError> {
  return withArgs(sugerirMenuSchema, raw, async (args) => {
    const etapa = edadMesesAEtapa(args.edad_meses);
    const [recetas, ingredientes] = await Promise.all([
      repo.getRecetas(),
      repo.getIngredientes(),
    ]);
    const disp = new Set(args.ingredientes_disponibles.map((n) => normalize(n)));
    const ingNombreById = new Map(ingredientes.map((i) => [i.id, normalize(i.nombre)]));

    function scoreReceta(r: (typeof recetas)[number]): number {
      const ids = r.receta_ingredientes.map((ri) => ri.ingrediente_id);
      if (ids.length === 0) return 0;
      const hits = ids.filter((id) => {
        const nombre = ingNombreById.get(id);
        if (!nombre) return false;
        for (const d of disp) {
          if (nombre.includes(d) || d.includes(nombre)) return true;
        }
        return false;
      }).length;
      return hits / ids.length;
    }

    const scored = recetas
      .map((r) => ({ r, score: scoreReceta(r) }))
      .filter((s) => s.score >= 0.4)
      .sort((a, b) => b.score - a.score);

    function pickByTipo(tipo: string) {
      return scored.find((s) => s.r.tipo_comida === tipo)?.r ?? null;
    }

    const day = [
      { momento: "desayuno", receta: pickByTipo("desayuno") },
      { momento: "almuerzo", receta: pickByTipo("almuerzo") },
      { momento: "merienda", receta: pickByTipo("merienda") },
      { momento: "cena", receta: pickByTipo("cena") },
    ].filter((s) => s.receta);

    const citedSlugs = day.map((s) => s.receta!.id);

    return {
      ok: true as const,
      data: {
        etapa,
        edad_meses: args.edad_meses,
        cobertura: day.length === 4 ? "completa" : "parcial",
        sugerencia: day.map((s) => ({
          momento: s.momento,
          slug: s.receta!.id,
          titulo: s.receta!.titulo,
          url: `/recetas/${s.receta!.id}`,
        })),
        nota:
          scored.length === 0
            ? "No encontramos recetas que usen mayormente esos ingredientes. Prueba buscando por título."
            : null,
      },
      citedSlugs,
    };
  });
}

export async function listaDeCompras(raw: unknown): Promise<ToolResult | ToolError> {
  return withArgs(listaDeComprasSchema, raw, async (args) => {
    const [menu, recetas, ingredientes] = await Promise.all([
      repo.getMenu(args.menu_id),
      repo.getRecetas(),
      repo.getIngredientes(),
    ]);
    if (!menu) return { ok: false as const, error: `No existe el menú "${args.menu_id}".` };
    const lista = computeListaCompras(menu, recetas, ingredientes);
    return {
      ok: true as const,
      data: {
        menu_slug: menu.id,
        menu_nombre: menu.nombre,
        url: `/menus/${menu.id}`,
        por_categoria: Object.fromEntries(
          Object.entries(lista.por_categoria).map(([cat, items]) => [
            cat,
            items.map((it) => ({
              nombre: it.ingrediente.nombre,
              totales: it.total_numerico,
            })),
          ])
        ),
      },
      citedSlugs: [menu.id],
    };
  });
}

export const TOOL_FNS: Record<
  ToolName,
  (raw: unknown) => Promise<ToolResult | ToolError>
> = {
  buscarRecetas,
  obtenerReceta,
  buscarMenus,
  sugerirMenu,
  listaDeCompras,
};
