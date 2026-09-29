/**
 * Unit tests for the colección presentation helpers (src/lib/colecciones.ts):
 * scheduled publishing, the "Nuevo" window and the launch countdown.
 *
 *   npx tsx --test tests/colecciones.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { coleccionSchema, menuSchema, type Coleccion } from "../src/lib/schema";
import {
  coleccionDeMenu,
  diasParaLanzamiento,
  esNueva,
  estadoEfectivo,
  hoyISO,
  lineaLanzamiento,
  numeroSemana,
  tonoDe,
} from "../src/lib/colecciones";

function col(extra: Partial<Coleccion> = {}): Coleccion {
  return coleccionSchema.parse({
    id: "bocaditos-de-reserva-pescado",
    nombre: "Bocaditos de reserva: Pescado",
    bajada: "El plan de un día para todo el mes.",
    tipo: "plan",
    eje: "pescado",
    ...extra,
  });
}

test("legacy colección docs parse with the new fields defaulted", () => {
  const c = col({ estado: "publicada" });
  assert.equal(c.tono, null);
  assert.equal(c.icono, null);
  assert.equal(c.fechaLanzamiento, null);
});

test("fechaLanzamiento must be YYYY-MM-DD", () => {
  assert.throws(() => col({ fechaLanzamiento: "5 de octubre" }));
});

test("programada resolves against today's date", () => {
  const c = col({ estado: "programada", fechaLanzamiento: "2026-11-02" });
  assert.equal(estadoEfectivo(c, "2026-11-01"), "proximamente");
  assert.equal(estadoEfectivo(c, "2026-11-02"), "publicada");
  assert.equal(estadoEfectivo(c, "2026-12-01"), "publicada");
});

test("programada without a date stays upcoming", () => {
  assert.equal(estadoEfectivo(col({ estado: "programada" }), "2030-01-01"), "proximamente");
});

test("Nuevo badge lasts 30 days from launch", () => {
  const c = col({ estado: "publicada", fechaLanzamiento: "2026-10-05" });
  assert.equal(esNueva(c, "2026-10-04"), false);
  assert.equal(esNueva(c, "2026-10-05"), true);
  assert.equal(esNueva(c, "2026-11-03"), true);
  assert.equal(esNueva(c, "2026-11-04"), false);
  assert.equal(esNueva(col({ estado: "publicada" }), "2026-10-05"), false);
});

test("countdown and launch line", () => {
  const c = col({ estado: "proximamente", fechaLanzamiento: "2026-10-05" });
  assert.equal(diasParaLanzamiento(c, "2026-09-29"), 6);
  assert.equal(diasParaLanzamiento(c, "2026-10-06"), null);
  assert.equal(lineaLanzamiento(c, "2026-09-29"), "Llega en 6 días · 5 de octubre");
  assert.equal(lineaLanzamiento(c, "2026-10-04"), "Llega mañana · 5 de octubre");
  assert.equal(lineaLanzamiento(c, "2026-10-05"), "Llega hoy · 5 de octubre");
});

test("hoyISO uses Chile's timezone", () => {
  // 02:00 UTC on Oct 5 is still Oct 4 in Santiago.
  assert.equal(hoyISO(new Date("2026-10-05T02:00:00Z")), "2026-10-04");
});

test("tone falls back by eje", () => {
  assert.equal(tonoDe(col()), "mar");
  assert.equal(tonoDe(col({ tono: "rosa" })), "rosa");
});

test("menus without planId belong to the first recetario", () => {
  const cols = [
    col({ id: "bocaditos-de-reserva-pollo", orden: 2 }),
    col({ id: "bocaditos-del-corazon", tipo: "recetario", eje: null, orden: 1 }),
  ];
  const legacy = menuSchema.parse({ id: "m1", etapa_id: "etapa-1", nombre: "Semana 3", dia: null, menu_recetas: [] });
  const plan = menuSchema.parse({ ...legacy, id: "m2", planId: "bocaditos-de-reserva-pollo", semana: 2 });
  assert.equal(coleccionDeMenu(legacy, cols), "bocaditos-del-corazon");
  assert.equal(coleccionDeMenu(plan, cols), "bocaditos-de-reserva-pollo");
  assert.equal(numeroSemana(legacy), 3);
  assert.equal(numeroSemana(plan), 2);
});

test("weekday spellings normalize to the long form", async () => {
  const { normalizarDia, diaCorto } = await import("../src/lib/dias");
  assert.equal(normalizarDia("LUN"), "Lunes");
  assert.equal(normalizarDia("mie"), "Miércoles");
  assert.equal(normalizarDia("Miércoles"), "Miércoles");
  assert.equal(normalizarDia("sab"), "Sábado");
  assert.equal(normalizarDia("x"), null);
  assert.equal(diaCorto("Sábado"), "sab");
});
