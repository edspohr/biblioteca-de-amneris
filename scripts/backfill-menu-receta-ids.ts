/**
 * One-off: add the `receta_ids` denormalized array to each menu doc in
 * Firestore. Safe to re-run.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     tsx scripts/backfill-menu-receta-ids.ts
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS.");
  return JSON.parse(readFileSync(p, "utf8")) as ServiceAccount;
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();
  const snap = await db.collection("menus").get();
  const batch = db.batch();
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as { menu_recetas: { receta_id: string }[] };
    const receta_ids = [
      ...new Set(data.menu_recetas.map((x) => x.receta_id)),
    ].sort();
    batch.update(doc.ref, { receta_ids });
    updated++;
  }
  await batch.commit();
  console.log(`Backfilled receta_ids on ${updated} menus.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
