import type { Ingrediente, Menu, Receta } from "@/lib/schema";

export interface ItemCompra {
  ingrediente: Ingrediente;
  cantidades: string[];
  total_numerico: { cantidad: number; unidad: string }[];
}

export interface ListaCompras {
  por_categoria: Record<string, ItemCompra[]>;
}

export function computeListaCompras(
  menu: Menu,
  recetas: Receta[],
  ingredientes: Ingrediente[]
): ListaCompras {
  const recetaById = new Map(recetas.map((r) => [r.id, r]));
  const ingredienteById = new Map(ingredientes.map((i) => [i.id, i]));

  const agrupado = new Map<string, { cantidades: string[]; numericos: Map<string, number> }>();

  for (const mr of menu.menu_recetas) {
    const receta = recetaById.get(mr.receta_id);
    if (!receta) continue;
    for (const ri of receta.receta_ingredientes) {
      let entry = agrupado.get(ri.ingrediente_id);
      if (!entry) {
        entry = { cantidades: [], numericos: new Map() };
        agrupado.set(ri.ingrediente_id, entry);
      }
      const label = formatCantidad(ri.cantidad, ri.unidad, ri.nota);
      if (label) entry.cantidades.push(label);
      if (ri.cantidad != null && ri.unidad) {
        entry.numericos.set(ri.unidad, (entry.numericos.get(ri.unidad) ?? 0) + ri.cantidad);
      }
    }
  }

  const por_categoria: Record<string, ItemCompra[]> = {};
  for (const [ingredienteId, entry] of agrupado.entries()) {
    const ingrediente = ingredienteById.get(ingredienteId);
    if (!ingrediente) continue;
    const item: ItemCompra = {
      ingrediente,
      cantidades: entry.cantidades,
      total_numerico: [...entry.numericos.entries()].map(([unidad, cantidad]) => ({
        cantidad,
        unidad,
      })),
    };
    (por_categoria[ingrediente.categoria] ??= []).push(item);
  }

  for (const cat of Object.keys(por_categoria)) {
    por_categoria[cat].sort((a, b) => a.ingrediente.nombre.localeCompare(b.ingrediente.nombre));
  }
  return { por_categoria };
}

function formatCantidad(
  cantidad: number | null,
  unidad: string | null,
  nota: string | null
): string {
  const parts: string[] = [];
  if (cantidad != null) parts.push(String(cantidad));
  if (unidad) parts.push(unidad);
  if (nota) parts.push(`(${nota})`);
  return parts.join(" ").trim();
}
