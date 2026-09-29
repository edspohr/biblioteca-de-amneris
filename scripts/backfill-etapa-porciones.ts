/**
 * Backfill porcionPorComida y rendimientoMensualKg en las 3 etapas.
 * Valores fuente: B3-P7 (gramos por porción por tipo de comida) y B3-P8
 * (kg producidos por mes) del recetario "Cocina en un Día".
 *
 * Idempotente: si los campos ya coinciden, no hay diff. Corre siempre con
 * --dry-run primero.
 *
 * Uso:
 *   npm run backfill:etapa-porciones -- --dry-run
 *   npm run backfill:etapa-porciones -- --apply
 */
import { db, isApply, requireRecentBackup } from "./lib/admin";

interface EtapaBackfill {
  id: string;
  porcionPorComida: { desayuno: number; almuerzo: number; cena: number };
  rendimientoMensualKg: {
    desayunos: number;
    almuerzos: number;
    cenas: number;
    total: number;
  };
}

const DATA: EtapaBackfill[] = [
  {
    id: "etapa-1",
    porcionPorComida: { desayuno: 90, almuerzo: 100, cena: 120 },
    rendimientoMensualKg: {
      desayunos: 2.7,
      almuerzos: 3.0,
      cenas: 3.6,
      total: 9.3,
    },
  },
  {
    id: "etapa-2",
    porcionPorComida: { desayuno: 130, almuerzo: 150, cena: 140 },
    rendimientoMensualKg: {
      desayunos: 3.9,
      almuerzos: 4.5,
      cenas: 4.2,
      total: 12.6,
    },
  },
  {
    id: "etapa-3",
    porcionPorComida: { desayuno: 180, almuerzo: 230, cena: 200 },
    rendimientoMensualKg: {
      desayunos: 5.4,
      almuerzos: 6.9,
      cenas: 6.0,
      total: 18.3,
    },
  },
];

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();
  const database = db();

  console.log(`Backfill etapa porciones (${apply ? "APPLY" : "dry-run"}):`);
  for (const item of DATA) {
    const ref = database.collection("etapas").doc(item.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`  ⨯ ${item.id} — no existe, se omite`);
      continue;
    }
    const cur = snap.data() ?? {};
    const changes: string[] = [];
    if (JSON.stringify(cur.porcionPorComida) !== JSON.stringify(item.porcionPorComida))
      changes.push("porcionPorComida");
    if (
      JSON.stringify(cur.rendimientoMensualKg) !==
      JSON.stringify(item.rendimientoMensualKg)
    )
      changes.push("rendimientoMensualKg");
    if (changes.length === 0) {
      console.log(`  · ${item.id} — sin cambios`);
      continue;
    }
    console.log(`  ✎ ${item.id} — actualiza: ${changes.join(", ")}`);
    if (apply) {
      await ref.update({
        porcionPorComida: item.porcionPorComida,
        rendimientoMensualKg: item.rendimientoMensualKg,
      });
    }
  }

  if (!apply) console.log("\nDry-run terminado. Corre con --apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
