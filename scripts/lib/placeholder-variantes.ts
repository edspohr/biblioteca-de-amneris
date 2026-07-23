import type { PorcionTextura, VarianteEtapa } from "@/lib/schema";
import { ETAPA_IDS } from "@/lib/schema";

export function buildPlaceholderVariantes(
  porciones: PorcionTextura[]
): Record<string, VarianteEtapa> {
  const byEtapa = new Map<string, PorcionTextura>();
  for (const p of porciones) if (!byEtapa.has(p.etapa_id)) byEtapa.set(p.etapa_id, p);

  const variantes: Record<string, VarianteEtapa> = {};
  for (const id of ETAPA_IDS) {
    const row = byEtapa.get(id);
    variantes[id] = {
      textura: row?.textura ?? "Por definir",
      porcion: row?.porcion ?? "Por definir",
    };
  }
  return variantes;
}
