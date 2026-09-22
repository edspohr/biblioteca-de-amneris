/**
 * Sync catalog collections (tecnicas, ingredientes, alergenos) AND recetas
 * from data/*.json into Firestore. Overwrites each document by id.
 *
 * Uses set() without merge — anything in Firestore that isn't in the JSON for
 * a given id gets replaced. Ids that exist in Firestore but not in the JSON
 * are left alone (this script does not delete).
 *
 * Recetas are written through toRecetaDoc() so the denormalized `_ids` arrays
 * (ingrediente_ids, alergeno_ids, tecnica_ids) that power referential-integrity
 * queries stay in sync with the recipe body.
 *
 * Usage (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npx tsx scripts/sync-catalogs.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  alergenoSchema,
  ingredienteSchema,
  recetaSchema,
  tecnicaSchema,
  type Receta,
} from "../src/lib/schema";

function uniq(xs: string[]): string[] {
  return [...new Set(xs)].sort();
}

// Denormalize a recipe for Firestore: adds flat `_ids` arrays so the
// referential-integrity queries (recipes-using-ingredient X, etc.) can use
// array-contains instead of a full scan. Must stay in sync with toRecetaDoc
// in src/lib/repo/firestore-adapter.ts.
function toRecetaDoc(r: Receta) {
  return {
    ...r,
    ingrediente_ids: uniq(r.receta_ingredientes.map((x) => x.ingrediente_id)),
    alergeno_ids: uniq(r.receta_alergenos.map((x) => x.alergeno_id)),
    tecnica_ids: uniq(r.receta_tecnicas.map((x) => x.tecnica_id)),
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const RECETAS_DIR = path.join(DATA_DIR, "recetas");

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json before running."
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as ServiceAccount;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  const tecnicas = (
    await readJson<unknown[]>(path.join(DATA_DIR, "tecnicas.json"))
  ).map((r) => tecnicaSchema.parse(r));
  const ingredientes = (
    await readJson<unknown[]>(path.join(DATA_DIR, "ingredientes.json"))
  ).map((r) => ingredienteSchema.parse(r));
  const alergenos = (
    await readJson<unknown[]>(path.join(DATA_DIR, "alergenos.json"))
  ).map((r) => alergenoSchema.parse(r));

  const recetaFiles = (await fs.readdir(RECETAS_DIR)).filter((f) =>
    f.endsWith(".json")
  );
  const recetas: Receta[] = [];
  for (const f of recetaFiles) {
    recetas.push(recetaSchema.parse(await readJson(path.join(RECETAS_DIR, f))));
  }

  console.log(
    `Loaded: ${tecnicas.length} tecnicas, ${ingredientes.length} ingredientes, ${alergenos.length} alergenos, ${recetas.length} recetas.`
  );

  async function writeAll<T extends { id: string }>(
    collection: string,
    items: T[],
    transform?: (item: T) => object
  ) {
    // Firestore batches cap at 500 writes.
    const CHUNK = 400;
    for (let i = 0; i < items.length; i += CHUNK) {
      const batch = db.batch();
      for (const item of items.slice(i, i + CHUNK)) {
        batch.set(
          db.collection(collection).doc(item.id),
          transform ? transform(item) : item
        );
      }
      await batch.commit();
    }
    console.log(`  ${collection}: ${items.length} docs written.`);
  }

  console.log("\nWriting to Firestore...");
  await writeAll("tecnicas", tecnicas);
  await writeAll("ingredientes", ingredientes);
  await writeAll("alergenos", alergenos);
  await writeAll("recetas", recetas, toRecetaDoc);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
