/**
 * Derives allergens per recipe from its ingredients using a curated
 * ingrediente_id → alergeno_id[] map, and updates every JSON in data/recetas/
 * in place. Preserves any allergen already declared on the recipe (union, not
 * overwrite). Conservative: only marks allergens that are unambiguous from
 * the ingredient.
 *
 * Does NOT touch Firestore — run scripts/sync-catalogs.ts afterward to push
 * the updated recipes.
 *
 * Usage:
 *   npx tsx scripts/apply-alergenos.ts        # dry-run report
 *   npx tsx scripts/apply-alergenos.ts --write # write JSON files
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { recetaSchema, type Receta } from "../src/lib/schema";
import { stableStringify } from "../src/lib/repo/stable-stringify";

const WRITE = process.argv.includes("--write");
const DATA_DIR = path.join(process.cwd(), "data");
const RECETAS_DIR = path.join(DATA_DIR, "recetas");

// Curated map: for each ingrediente id, which allergen ids apply.
// Kept conservative — only marks what is unambiguous from the ingredient
// name. Ambiguous cases (aceite vegetal, curry, etc.) are intentionally
// left unmarked so Amneris can decide case by case.
const INGREDIENTE_ALERGENOS: Record<string, string[]> = {
  // Gluten — cereales de trigo/avena. La avena naturalmente es libre de
  // gluten pero para alimentación infantil se etiqueta como tal por
  // contaminación cruzada habitual.
  "avena-integral-copos": ["gluten"],
  "avena-molida": ["gluten"],
  "avena-para-bebe": ["gluten"],
  "avena-remojada-o": ["gluten"],
  "copos-avena-finos": ["gluten"],
  "fideos-finos": ["gluten"],
  "fideos-finos-o": ["gluten"],
  "galleta-avena-sin": ["gluten"],
  "semola-fina-para": ["gluten"],
  // Lácteos — leche de vaca y derivados. Leche coco NO es lácteo.
  "leche-materna-formula": ["lacteos"],
  "leche-materna-o": ["lacteos"],
  "leche-o-agua": ["lacteos"],
  "queso-crema-o": ["lacteos"],
  "queso-crema-sin": ["lacteos"],
  "queso-parmesano-sin": ["lacteos"],
  "ricotta-sin-sal": ["lacteos"],
  "yogur-natural-entero": ["lacteos"],
  "yogur-natural-sin": ["lacteos"],
  // Huevo
  "huevo": ["huevo"],
  // Pescado
  "bacalao-desalado-sin": ["pescado"],
  "merluza-o-lenguado": ["pescado"],
  "merluza-sin-espinas": ["pescado"],
  "salmon-sin-espinas": ["pescado"],
  // Soja — tofu es derivado de soja.
  "tofu-blando": ["soja"],
  "tofu-firme": ["soja"],
  // Sésamo
  "aceite-sesamo": ["sesamo"],
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

function deriveAlergenos(receta: Receta): string[] {
  const declared = new Set(receta.receta_alergenos.map((a) => a.alergeno_id));
  for (const ri of receta.receta_ingredientes) {
    const mapped = INGREDIENTE_ALERGENOS[ri.ingrediente_id];
    if (mapped) for (const a of mapped) declared.add(a);
  }
  return [...declared].sort();
}

async function main() {
  const files = (await fs.readdir(RECETAS_DIR)).filter((f) =>
    f.endsWith(".json")
  );
  let totalAdded = 0;
  let recipesChanged = 0;
  const perAlergeno = new Map<string, number>();

  for (const f of files) {
    const filePath = path.join(RECETAS_DIR, f);
    const raw = await readJson<unknown>(filePath);
    const receta = recetaSchema.parse(raw);
    const before = new Set(receta.receta_alergenos.map((a) => a.alergeno_id));
    const after = deriveAlergenos(receta);
    const added = after.filter((a) => !before.has(a));
    if (added.length === 0) continue;

    recipesChanged++;
    totalAdded += added.length;
    for (const a of added) perAlergeno.set(a, (perAlergeno.get(a) ?? 0) + 1);

    const updated: Receta = {
      ...receta,
      receta_alergenos: after.map((alergeno_id) => ({ alergeno_id })),
    };
    if (WRITE) {
      await fs.writeFile(filePath, stableStringify(updated) + "\n", "utf8");
    }
  }

  console.log(
    `${WRITE ? "Wrote" : "Dry-run"}: ${recipesChanged} recetas actualizadas, ${totalAdded} marcajes agregados.`
  );
  console.log("Por alérgeno:");
  for (const [a, n] of [...perAlergeno.entries()].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${a}: ${n}`);
  }
  if (!WRITE) console.log("\nRe-run with --write to persist.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
