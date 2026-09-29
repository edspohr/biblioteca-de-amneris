/**
 * Setea fase='preparacion' en cada tecnica existente que aún no la tenga.
 * Las técnicas de conservación/regeneración que traiga el import Fase 2
 * llegarán con su fase correcta desde el pipeline; este backfill solo
 * cubre las 12 técnicas actuales.
 *
 * Idempotente: solo escribe si el campo falta.
 *
 * Uso:
 *   npm run backfill:tecnicas-fase -- --dry-run
 *   npm run backfill:tecnicas-fase -- --apply
 */
import { db, isApply, requireRecentBackup } from "./lib/admin";

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();
  const database = db();

  const snap = await database.collection("tecnicas").get();
  console.log(
    `Backfill tecnicas.fase (${apply ? "APPLY" : "dry-run"}): ${snap.size} técnicas`
  );

  let toUpdate = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.fase) {
      console.log(`  · ${doc.id} — ya tiene fase=${data.fase}`);
      continue;
    }
    console.log(`  ✎ ${doc.id} — set fase='preparacion'`);
    toUpdate++;
    if (apply) await doc.ref.update({ fase: "preparacion" });
  }

  console.log(
    `\n${apply ? "Actualizadas" : "Se actualizarían"}: ${toUpdate} técnicas.`
  );
  if (!apply) console.log("Corre con --apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
