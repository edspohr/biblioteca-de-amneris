/**
 * Round-trip: read every collection out of Firestore and rewrite the JSON
 * files under data/ using the same stable stringification the JSON adapter
 * emits. Run this periodically and commit the result so git remains the
 * readable history of the book.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run export:firestore
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  alergenoSchema,
  etapaSchema,
  ingredienteSchema,
  menuSchema,
  porcionTexturaSchema,
  recetaSchema,
  tecnicaSchema,
} from "../src/lib/schema";
import { stableStringify } from "../src/lib/repo/stable-stringify";

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

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, stableStringify(data) + "\n", "utf8");
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  async function dumpCollection<T>(
    collection: string,
    parse: (raw: unknown) => T,
    file: string,
    sortKey: (item: T) => string
  ) {
    const snap = await db.collection(collection).get();
    const items = snap.docs
      .map((d) => parse(d.data()))
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    await writeJson(file, items);
    console.log(`  ${collection}: ${items.length} → ${path.relative(process.cwd(), file)}`);
  }

  console.log("Exporting Firestore to data/...");

  await dumpCollection(
    "etapas",
    (r) => etapaSchema.parse(r),
    path.join(DATA_DIR, "etapas.json"),
    (e) => e.id
  );
  await dumpCollection(
    "porciones_texturas",
    (r) => porcionTexturaSchema.parse(r),
    path.join(DATA_DIR, "porciones-texturas.json"),
    (p) => p.etapa_id
  );
  await dumpCollection(
    "ingredientes",
    (r) => ingredienteSchema.parse(r),
    path.join(DATA_DIR, "ingredientes.json"),
    (i) => i.id
  );
  await dumpCollection(
    "alergenos",
    (r) => alergenoSchema.parse(r),
    path.join(DATA_DIR, "alergenos.json"),
    (a) => a.id
  );
  await dumpCollection(
    "tecnicas",
    (r) => tecnicaSchema.parse(r),
    path.join(DATA_DIR, "tecnicas.json"),
    (t) => t.id
  );
  await dumpCollection(
    "menus",
    (r) => menuSchema.parse(r),
    path.join(DATA_DIR, "menus.json"),
    (m) => m.id
  );

  // Recipes: one file per recipe. The Firestore doc has extra denormalized
  // fields (`ingrediente_ids`, `alergeno_ids`, `tecnica_ids`); the schema
  // strips them before writing, so JSON stays clean.
  const recetasSnap = await db.collection("recetas").get();
  const recetas = recetasSnap.docs.map((d) => {
    const {
      ingrediente_ids: _ii,
      alergeno_ids: _ai,
      tecnica_ids: _ti,
      ...rest
    } = d.data();
    void _ii;
    void _ai;
    void _ti;
    return recetaSchema.parse(rest);
  });

  await fs.mkdir(RECETAS_DIR, { recursive: true });
  for (const r of recetas) {
    await writeJson(path.join(RECETAS_DIR, `${r.id}.json`), r);
  }
  console.log(`  recetas: ${recetas.length} → data/recetas/*.json`);

  console.log("\nDone. Review the diff with `git diff data/` and commit if it looks right.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
