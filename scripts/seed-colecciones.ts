/**
 * Seed the 3 colecciones de la biblioteca. Idempotent: upsert por id, nunca
 * borra. `bocaditos-del-corazon` queda 'publicada' (contenido actual del
 * reader), `bocaditos-de-reserva-pollo` queda 'oculta' hasta el flip del
 * 5 de octubre, `bocaditos-de-reserva-pescado' queda 'proximamente'.
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run seed:colecciones -- --dry-run
 *   npm run seed:colecciones -- --apply
 */
import { coleccionSchema, type Coleccion } from "../src/lib/schema";
import { db, isApply, requireRecentBackup } from "./lib/admin";

const COLECCIONES: Coleccion[] = [
  coleccionSchema.parse({
    id: "bocaditos-del-corazon",
    nombre: "Bocaditos del Corazón",
    bajada:
      "120 recetas rápidas para amar cocinar y alimentar con ternura desde los 6 meses.",
    tipo: "recetario",
    eje: null,
    orden: 1,
    estado: "publicada",
    portadaUrl: null,
    descripcionCorta:
      "El primer recetario: bocaditos con ingredientes simples, pensados para las tres etapas.",
  }),
  coleccionSchema.parse({
    id: "bocaditos-de-reserva-pollo",
    nombre: "Bocaditos de reserva: Pollo",
    bajada: "Cocina un día y aliméntalo todo un mes.",
    tipo: "plan",
    eje: "pollo",
    orden: 2,
    estado: "oculta",
    portadaUrl: null,
    descripcionCorta:
      "Plan de batch cooking con base de pollo: 4 semanas por etapa, 30 días de porciones frescas y congeladas.",
  }),
  coleccionSchema.parse({
    id: "bocaditos-de-reserva-pescado",
    nombre: "Bocaditos de reserva: Pescado",
    bajada: "El plan de un día para todo el mes, ahora con pescado.",
    tipo: "plan",
    eje: "pescado",
    orden: 3,
    estado: "proximamente",
    portadaUrl: null,
    descripcionCorta: "Próximo lanzamiento — noviembre 2026.",
  }),
];

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();

  console.log(
    `Seed colecciones (${apply ? "APPLY" : "dry-run"}): ${COLECCIONES.length} docs`
  );

  for (const c of COLECCIONES) {
    console.log(`  · ${c.id} — ${c.nombre} (${c.estado})`);
  }

  if (!apply) {
    console.log("\nDry-run terminado. Corre con --apply para escribir en Firestore.");
    return;
  }

  const database = db();
  for (const c of COLECCIONES) {
    await database.collection("colecciones").doc(c.id).set(c);
  }
  console.log(`\n✓ ${COLECCIONES.length} colecciones escritas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
