/**
 * Seed the closed catalog of MetodoConservacion (refrigerado, congelado,
 * ambiente). Idempotent. Real freezing/refrigeration technique details live
 * on Tecnica records with fase='conservacion' or 'regeneracion'.
 *
 * Uso:
 *   npm run seed:metodos -- --dry-run
 *   npm run seed:metodos -- --apply
 */
import {
  metodoConservacionSchema,
  type MetodoConservacion,
} from "../src/lib/schema";
import { db, isApply, requireRecentBackup } from "./lib/admin";

const METODOS: MetodoConservacion[] = [
  metodoConservacionSchema.parse({
    id: "refrigerado",
    nombre: "Refrigerado",
    descripcion: "Guardado en refrigerador entre 2 y 5 °C.",
    temperaturaC: { min: 2, max: 5 },
  }),
  metodoConservacionSchema.parse({
    id: "congelado",
    nombre: "Congelado",
    descripcion:
      "Congelado a -18 °C o menos. Base de la estrategia de Bocaditos de reserva.",
    temperaturaC: { min: -25, max: -18 },
  }),
  metodoConservacionSchema.parse({
    id: "ambiente",
    nombre: "Temperatura ambiente",
    descripcion:
      "Guardado en despensa seca, sin humedad ni luz directa. Solo para preparaciones que lo permiten.",
    temperaturaC: null,
  }),
];

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();

  console.log(
    `Seed metodos_conservacion (${apply ? "APPLY" : "dry-run"}): ${METODOS.length} docs`
  );
  for (const m of METODOS) console.log(`  · ${m.id} — ${m.nombre}`);

  if (!apply) {
    console.log("\nDry-run terminado. Corre con --apply.");
    return;
  }

  const database = db();
  for (const m of METODOS) {
    await database.collection("metodos_conservacion").doc(m.id).set(m);
  }
  console.log(`\n✓ ${METODOS.length} métodos escritos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
