import { promises as fs } from "node:fs";
import path from "node:path";
import { repo } from "@/lib/repo";
import { ETAPA_IDS, recetaSchema } from "@/lib/schema";
import { buildPlaceholderVariantes } from "./lib/placeholder-variantes";

const RECETAS_DIR = path.join(process.cwd(), "data", "recetas");

interface RawReceta {
  id?: string;
  etapa_id?: string;
  variantes?: Record<string, unknown>;
  [k: string]: unknown;
}

function hasAllVariantes(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const keys = Object.keys(v as Record<string, unknown>);
  return ETAPA_IDS.every((id) => keys.includes(id));
}

async function main(): Promise<void> {
  const files = (await fs.readdir(RECETAS_DIR)).filter((f) => f.endsWith(".json"));
  const porciones = await repo.getPorcionesTexturas();
  const placeholderVariantes = buildPlaceholderVariantes(porciones);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(RECETAS_DIR, file);
    const raw: RawReceta = JSON.parse(await fs.readFile(filePath, "utf8"));

    if (hasAllVariantes(raw.variantes) && !("etapa_id" in raw)) {
      skipped++;
      continue;
    }

    const { etapa_id: _drop, variantes: _drop2, ...rest } = raw;
    const next = { ...rest, variantes: placeholderVariantes };

    const parsed = recetaSchema.safeParse(next);
    if (!parsed.success) {
      console.error(`✗ ${file}: ${parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`);
      failed++;
      continue;
    }

    await repo.saveReceta(parsed.data);
    migrated++;
  }

  console.log(`\n✓ Migración completada.`);
  console.log(`  ${migrated} recetas migradas`);
  console.log(`  ${skipped} recetas ya al día (saltadas)`);
  if (failed > 0) console.log(`  ${failed} recetas con errores`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
