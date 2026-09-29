/**
 * Flippea el estado de una colección a 'publicada' (o al que pases con
 * --estado=<valor>). Uso previsto: paso final del launch de una colección
 * después de que el import:load quedó verificado.
 *
 * Uso:
 *   npm run publish:coleccion -- <id>
 *   npm run publish:coleccion -- bocaditos-de-reserva-pollo
 *   npm run publish:coleccion -- <id> --estado=oculta
 */
import { db } from "./lib/admin";
import { coleccionSchema } from "../src/lib/schema";

async function main() {
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith("--"));
  if (!id) {
    throw new Error("Pasa el id de la colección como primer argumento.");
  }
  const estadoArg = args.find((a) => a.startsWith("--estado="));
  const nuevoEstado = estadoArg ? estadoArg.slice("--estado=".length) : "publicada";
  if (!["publicada", "oculta", "proximamente"].includes(nuevoEstado)) {
    throw new Error(`Estado inválido: ${nuevoEstado}`);
  }

  const database = db();
  const ref = database.collection("colecciones").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Colección "${id}" no existe.`);
  const cur = coleccionSchema.parse(snap.data());
  if (cur.estado === nuevoEstado) {
    console.log(`${id}: ya está en estado ${nuevoEstado}. Nada que hacer.`);
    return;
  }
  console.log(`${id}: ${cur.estado} → ${nuevoEstado}`);
  await ref.update({ estado: nuevoEstado });
  console.log("✓ actualizado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
