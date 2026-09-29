/**
 * Timestamped Firestore snapshot to data/backups/<yyyy-mm-ddThh-mm-ss>/.
 *
 * This is a HARD precondition of every migration and every `import/load.ts
 * --apply` in the Bocaditos de reserva pipeline. Unlike scripts/export-
 * firestore.ts (which overwrites data/*.json for git history), this one
 * writes to a fresh timestamped directory that never overwrites anything.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run backup
 *
 * Exit code is non-zero if the backup fails, so downstream scripts can gate
 * on it. Existing collections are dumped verbatim (no schema validation) so
 * a backup succeeds even if the live data has drifted from the schema.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { stableStringify } from "../src/lib/repo/stable-stringify";

// Collections to snapshot. New Fase-1 collections (colecciones, planes,
// utensilios, guias, metodos_conservacion) will be added here as they land;
// missing collections are logged and skipped, not treated as errors.
const COLLECTIONS = [
  "etapas",
  "porciones_texturas",
  "ingredientes",
  "alergenos",
  "tecnicas",
  "menus",
  "recetas",
  "colecciones",
  "planes",
  "utensilios",
  "guias",
  "metodos_conservacion",
  "usuarios",
];

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      "Configura GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json antes de correr el backup."
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as ServiceAccount;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  const ts = timestamp();
  const outDir = path.join(process.cwd(), "data", "backups", ts);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`Backup → ${path.relative(process.cwd(), outDir)}`);

  const summary: { collection: string; count: number }[] = [];

  for (const name of COLLECTIONS) {
    try {
      const snap = await db.collection(name).get();
      const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      const file = path.join(outDir, `${name}.json`);
      await fs.writeFile(file, stableStringify(docs) + "\n", "utf8");
      summary.push({ collection: name, count: docs.length });
      console.log(`  ${name}: ${docs.length}`);
    } catch (err) {
      console.log(`  ${name}: no existe o no accesible (${(err as Error).message})`);
    }
  }

  await fs.writeFile(
    path.join(outDir, "MANIFEST.json"),
    stableStringify({ createdAt: new Date().toISOString(), summary }) + "\n",
    "utf8"
  );

  console.log(`\nListo. Referencia este directorio antes de correr migraciones o load --apply.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
