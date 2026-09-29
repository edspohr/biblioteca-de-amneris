/**
 * Migración v2 de las recetas: adapta las 121 recetas actuales al schema
 * extendido de Bocaditos de reserva SIN cambiar su contenido user-facing.
 *
 * Cambios por receta (todos idempotentes — solo se aplica lo que falta):
 *   1. `coleccionIds` = ['bocaditos-del-corazon'] si está ausente.
 *   2. Si `pasosDetalle` está ausente y hay `pasos: string[]`, se genera
 *      pasosDetalle = pasos.map((s, i) => ({orden: i, accion: s, observacion: null}))
 *      dejando `pasos` intacto (coexisten).
 *   3. Si `conservaciones` está ausente y hay `congelable`/`conservacion` legacy,
 *      se deriva:
 *        - congelable === true  → [{metodoId:'congelado',   nota: conservacion|null}]
 *        - congelable === false → [{metodoId:'refrigerado', nota: conservacion|null}]
 *        - congelable == null  → [{metodoId:'refrigerado', nota: conservacion|null}]
 *            (si hay conservacion string, la guarda; si no, no crea el array)
 *   4. `preparacionFresca` = (congelable === false) si el campo está ausente.
 *
 * NO borra ni renombra nada legacy. `variantes` no se toca (ya cumple el
 * schema relajado; los tests validan las 121 recetas en tests/schemas.test.ts).
 *
 * Corre contra Firestore. Idempotente. Reporta un mini-diff antes de escribir.
 *
 * Uso:
 *   npm run migrate:recetas-v2 -- --dry-run
 *   npm run migrate:recetas-v2 -- --apply
 */
import { db, isApply, requireRecentBackup } from "./lib/admin";

interface RecetaDoc {
  id?: string;
  titulo?: string;
  pasos?: string[];
  pasosDetalle?: unknown;
  coleccionIds?: string[];
  congelable?: boolean | null;
  conservacion?: string | null;
  conservaciones?: unknown;
  preparacionFresca?: boolean;
  [k: string]: unknown;
}

interface Patch {
  coleccionIds?: string[];
  pasosDetalle?: { orden: number; accion: string; observacion: string | null }[];
  conservaciones?: {
    metodoId: string;
    duracionDias: number | null;
    envaseUtensilioId: string | null;
    tecnicaEnfriadoId: string | null;
    tecnicaCongeladoId: string | null;
    tecnicaRegeneracionId: string | null;
    nota: string | null;
  }[];
  preparacionFresca?: boolean;
}

function computePatch(r: RecetaDoc): Patch {
  const patch: Patch = {};

  if (!Array.isArray(r.coleccionIds) || r.coleccionIds.length === 0) {
    patch.coleccionIds = ["bocaditos-del-corazon"];
  }

  if (
    !Array.isArray(r.pasosDetalle) &&
    Array.isArray(r.pasos) &&
    r.pasos.length > 0
  ) {
    patch.pasosDetalle = r.pasos.map((s, i) => ({
      orden: i,
      accion: s,
      observacion: null,
    }));
  }

  if (!Array.isArray(r.conservaciones)) {
    const nota = r.conservacion ?? null;
    if (r.congelable === true) {
      patch.conservaciones = [
        {
          metodoId: "congelado",
          duracionDias: null,
          envaseUtensilioId: null,
          tecnicaEnfriadoId: null,
          tecnicaCongeladoId: null,
          tecnicaRegeneracionId: null,
          nota,
        },
      ];
    } else if (r.congelable === false) {
      patch.conservaciones = [
        {
          metodoId: "refrigerado",
          duracionDias: null,
          envaseUtensilioId: null,
          tecnicaEnfriadoId: null,
          tecnicaCongeladoId: null,
          tecnicaRegeneracionId: null,
          nota,
        },
      ];
    } else if (nota) {
      // congelable == null pero hay conservacion string → refrigerado con nota
      patch.conservaciones = [
        {
          metodoId: "refrigerado",
          duracionDias: null,
          envaseUtensilioId: null,
          tecnicaEnfriadoId: null,
          tecnicaCongeladoId: null,
          tecnicaRegeneracionId: null,
          nota,
        },
      ];
    }
  }

  if (r.preparacionFresca == null && r.congelable === false) {
    patch.preparacionFresca = true;
  }

  return patch;
}

function patchIsEmpty(p: Patch): boolean {
  return Object.keys(p).length === 0;
}

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();
  const database = db();

  const snap = await database.collection("recetas").get();
  console.log(
    `Migrate recetas v2 (${apply ? "APPLY" : "dry-run"}): ${snap.size} recetas`
  );

  const buckets = { skip: 0, patchColeccion: 0, patchPasos: 0, patchCons: 0, patchFresca: 0, total: 0 };

  for (const doc of snap.docs) {
    const data = doc.data() as RecetaDoc;
    const patch = computePatch(data);
    if (patchIsEmpty(patch)) {
      buckets.skip++;
      continue;
    }
    if (patch.coleccionIds) buckets.patchColeccion++;
    if (patch.pasosDetalle) buckets.patchPasos++;
    if (patch.conservaciones) buckets.patchCons++;
    if (patch.preparacionFresca != null) buckets.patchFresca++;
    buckets.total++;

    const cambios = Object.keys(patch).join(", ");
    console.log(`  ✎ ${doc.id} — ${cambios}`);

    if (apply) await doc.ref.update(patch);
  }

  console.log("\nResumen:");
  console.log(`  sin cambios: ${buckets.skip}`);
  console.log(`  con cambios: ${buckets.total}`);
  console.log(`    · coleccionIds: ${buckets.patchColeccion}`);
  console.log(`    · pasosDetalle: ${buckets.patchPasos}`);
  console.log(`    · conservaciones: ${buckets.patchCons}`);
  console.log(`    · preparacionFresca: ${buckets.patchFresca}`);
  if (!apply)
    console.log("\nDry-run terminado. Revisa el resumen y corre con --apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
