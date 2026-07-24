/**
 * Delete assistant conversation logs older than 30 days.
 *
 * Usage (monthly):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run cleanup:asistente
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const RETAIN_DAYS = 30;

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
  const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;

  const snap = await db
    .collectionGroup("mensajes")
    .where("atMs", "<", cutoff)
    .get();

  console.log(`Found ${snap.size} messages older than ${RETAIN_DAYS} days.`);
  let deleted = 0;
  // Firestore batches cap at 500 writes.
  const batches: FirebaseFirestore.WriteBatch[] = [];
  let cur = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    cur.delete(doc.ref);
    count++;
    deleted++;
    if (count === 450) {
      batches.push(cur);
      cur = db.batch();
      count = 0;
    }
  }
  if (count > 0) batches.push(cur);
  for (const b of batches) await b.commit();

  // Also delete session docs whose lastAtMs is older than cutoff.
  const sessSnap = await db
    .collection("conversaciones")
    .where("lastAtMs", "<", cutoff)
    .get();
  const sessBatch = db.batch();
  for (const doc of sessSnap.docs) sessBatch.delete(doc.ref);
  await sessBatch.commit();

  console.log(`Deleted ${deleted} messages, ${sessSnap.size} session records.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
