/**
 * Regression test for the 2025-09-19 lost-work incident: the admin API
 * routes used to echo `parsed` back on 200 without confirming Firestore had
 * accepted the write. verifyWrite() closes that hole by re-reading the doc
 * and comparing the fields the caller cares about.
 *
 * Run:  npx tsx --test tests/admin-persistence.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyWrite } from "../src/lib/repo/verify";

type Tecnica = { id: string; nombre: string; descripcion: string | null };

test("verifyWrite returns the reread document when it matches", async () => {
  const expected: Tecnica = {
    id: "cocer-al-vapor",
    nombre: "Cocer al vapor",
    descripcion: "Al vapor sobre agua hirviendo.",
  };
  const stored: Tecnica = { ...expected };
  const result = await verifyWrite<Tecnica>(
    async () => stored,
    expected,
    ["nombre", "descripcion"]
  );
  assert.equal(result, stored);
});

test("verifyWrite throws if the getter returns null (save was accepted but nothing persisted)", async () => {
  await assert.rejects(
    () =>
      verifyWrite<Tecnica>(
        async () => null,
        { id: "x", nombre: "X", descripcion: null },
        ["nombre"]
      ),
    /no aparece tras el guardado/
  );
});

test("verifyWrite throws if a compared field diverges from what was sent", async () => {
  const expected: Tecnica = {
    id: "batir",
    nombre: "Batir",
    descripcion: "Nuevo texto",
  };
  const stored: Tecnica = {
    id: "batir",
    nombre: "Batir",
    descripcion: "Texto viejo — la escritura NO se aplicó",
  };
  await assert.rejects(
    () =>
      verifyWrite<Tecnica>(async () => stored, expected, [
        "nombre",
        "descripcion",
      ]),
    /no coinciden con lo enviado/
  );
});

test("verifyWrite tolerates deep-equal objects (arrays, nested)", async () => {
  type Receta = { id: string; titulo: string; ingredientes: string[] };
  const expected: Receta = {
    id: "r",
    titulo: "T",
    ingredientes: ["a", "b"],
  };
  const stored: Receta = {
    id: "r",
    titulo: "T",
    ingredientes: ["a", "b"],
  };
  await verifyWrite<Receta>(async () => stored, expected, [
    "titulo",
    "ingredientes",
  ]);
});
