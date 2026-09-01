/**
 * Backfill `edad_min_meses` / `edad_max_meses` on the 3 etapa docs. These
 * new numeric fields drive the "auto-seguir la edad del bebé" behavior in
 * the stage selector (see src/lib/etapa-activa/age.ts).
 *
 * Usage (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npx tsx scripts/backfill-etapa-edad.ts
 *
 * Idempotent: sets the fields to the canonical values (matches the
 * hardcoded map in scripts/extract.ts:232-260).
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const RANGES: Record<string, { min: number; max: number }> = {
  "etapa-1": { min: 6, max: 9 },
  "etapa-2": { min: 10, max: 11 },
  "etapa-3": { min: 12, max: 24 },
};

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json (or FIREBASE_ADMIN_SA=<json>) before running."
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  for (const [id, range] of Object.entries(RANGES)) {
    const ref = db.collection("etapas").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      // eslint-disable-next-line no-console
      console.log(`⨯ ${id} — no existe en Firestore, se omite`);
      continue;
    }
    await ref.update({
      edad_min_meses: range.min,
      edad_max_meses: range.max,
    });
    // eslint-disable-next-line no-console
    console.log(`✓ ${id} — edad ${range.min}-${range.max} meses`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
