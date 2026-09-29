/**
 * Unit tests for the new Fase-0 schemas + the backward-compat guarantees on
 * the extended ones. Run with:
 *
 *   npx tsx --test tests/schemas.test.ts
 *
 * The tests do not touch Firestore. Their job is to lock the contract:
 * (a) every new schema accepts a well-formed example,
 * (b) every existing schema still accepts a legacy JSON document verbatim
 *     (backward compat with the ~120 recipes),
 * (c) the extensions (variantes parcial, receta con campos nuevos) parse.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  alergenoSchema,
  coleccionSchema,
  conservacionSchema,
  etapaSchema,
  guiaSchema,
  ingredienteSchema,
  menuSchema,
  metodoConservacionSchema,
  nutrientesSchema,
  planSchema,
  recetaSchema,
  tecnicaSchema,
  utensilioSchema,
} from "../src/lib/schema";

// -------------------------------------------------------------- new schemas

test("coleccionSchema accepts a valid recetario", () => {
  const parsed = coleccionSchema.parse({
    id: "bocaditos-del-corazon",
    nombre: "Bocaditos del Corazón",
    bajada: "120 recetas rápidas para amar cocinar.",
    tipo: "recetario",
    orden: 1,
    estado: "publicada",
  });
  assert.equal(parsed.tipo, "recetario");
  assert.equal(parsed.eje, null);
});

test("coleccionSchema rejects an unknown tipo", () => {
  assert.throws(() =>
    coleccionSchema.parse({
      id: "x",
      nombre: "X",
      bajada: "x",
      tipo: "cocktails",
    })
  );
});

test("nutrientesSchema accepts a full block and defaults `aproximado` true", () => {
  const parsed = nutrientesSchema.parse({
    energiaKcal: 120,
    proteinasG: 5,
    carbohidratosG: 15,
    grasasG: 3,
    hierroMg: 1,
    calcioMg: 30,
    fibraG: 2,
    sodioMg: 20,
  });
  assert.equal(parsed.aproximado, true);
});

test("metodoConservacionSchema accepts refrigerado", () => {
  metodoConservacionSchema.parse({ id: "refrigerado", nombre: "Refrigerado" });
});

test("conservacionSchema accepts a freezer entry with a technique reference", () => {
  const parsed = conservacionSchema.parse({
    metodoId: "congelado",
    duracionDias: 90,
    tecnicaCongeladoId: "iqf",
    tecnicaRegeneracionId: "revivir-bastones",
  });
  assert.equal(parsed.duracionDias, 90);
});

test("utensilioSchema accepts an envase apto congelador", () => {
  utensilioSchema.parse({
    id: "tarrito-vidrio-150ml",
    nombre: "Tarrito de vidrio 150ml",
    tipo: "envase",
    paraQue: "Guardar 1 porción E1 congelada",
    aptoCongelador: true,
  });
});

test("planSchema accepts a minimal plan with only defaults", () => {
  const parsed = planSchema.parse({
    id: "bocaditos-de-reserva-pollo",
    coleccionId: "bocaditos-de-reserva-pollo",
    titulo: "Bocaditos de reserva: Pollo",
    bajada: "Cocina un día y aliméntalo todo un mes.",
  });
  assert.equal(parsed.duracionTotalMin, 240);
  assert.equal(parsed.diasCubiertos, 30);
});

test("guiaSchema accepts a mixed-block guide", () => {
  guiaSchema.parse({
    id: "b3-p1",
    coleccionId: "bocaditos-de-reserva-pollo",
    titulo: "Equipamiento y utensilios",
    bloques: [
      { kind: "parrafo", texto: "Antes de empezar, revisa que tengas…" },
      {
        kind: "tabla",
        columnas: ["Item", "Para qué sirve"],
        filas: [{ celdas: ["Tarritos de vidrio 150ml", "Guardar porciones E1"] }],
      },
      { kind: "aviso", tipo: "tip", texto: "Etiquétalos con fecha." },
    ],
  });
});

// ------------------------------------------------------ backward compat

test("etapaSchema still parses a legacy etapa (no new fields)", () => {
  etapaSchema.parse({
    id: "etapa-1",
    nombre: "Etapa 1 · Primeros Sabores",
    textura: "Papilla lisa sin trozos",
    rango_edad: "6 a 9 meses",
    edad_min_meses: 6,
    edad_max_meses: 9,
    orden: 1,
    paleta: {
      primary: "#B8E0C8",
      accent: "#7FBFA0",
      soft: "#EAF7EF",
      ink: "#2F5D46",
    },
  });
});

test("etapaSchema accepts the reserva extension (porcionPorComida)", () => {
  const parsed = etapaSchema.parse({
    id: "etapa-1",
    nombre: "Etapa 1",
    textura: "Papilla",
    rango_edad: "6 a 9 meses",
    edad_min_meses: 6,
    edad_max_meses: 9,
    orden: 1,
    paleta: {
      primary: "#B8E0C8",
      accent: "#7FBFA0",
      soft: "#EAF7EF",
      ink: "#2F5D46",
    },
    porcionPorComida: { desayuno: 90, almuerzo: 100, cena: 120 },
    rendimientoMensualKg: { desayunos: 2.7, almuerzos: 3.0, cenas: 3.6, total: 9.3 },
  });
  assert.equal(parsed.porcionPorComida?.desayuno, 90);
});

test("tecnicaSchema still parses a legacy tecnica", () => {
  tecnicaSchema.parse({
    id: "cocer-al-vapor",
    nombre: "Cocer al vapor",
    descripcion: "…",
    seccion_origen: null,
  });
});

test("tecnicaSchema accepts a regeneracion technique with pasos", () => {
  const parsed = tecnicaSchema.parse({
    id: "revivir-panqueques",
    nombre: "Revivir panqueques",
    descripcion: null,
    seccion_origen: null,
    fase: "regeneracion",
    formatosAplicables: ["panqueques"],
    pasos: [
      { orden: 0, accion: "Descongelar", detalle: "En refrigerador 8h" },
      { orden: 1, accion: "Calentar", detalle: "Sartén sin aceite, 1 min por lado" },
    ],
  });
  assert.equal(parsed.fase, "regeneracion");
});

test("ingredienteSchema still parses a legacy ingredient", () => {
  ingredienteSchema.parse({
    id: "manzana",
    nombre: "Manzana",
    categoria: "Frutas",
  });
});

test("ingredienteSchema accepts aptoPorEtapa", () => {
  ingredienteSchema.parse({
    id: "sal",
    nombre: "Sal",
    categoria: "Condimentos",
    aptoPorEtapa: { "etapa-1": "no", "etapa-2": "pizca", "etapa-3": "pizca" },
    notaEtapa: "No añadir sal antes de los 12 meses.",
  });
});

// --------------------------------------- receta: legacy files must all parse

test("recetaSchema parses every legacy recipe file in data/recetas/", () => {
  const dir = path.join(process.cwd(), "data", "recetas");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length > 100, `expected 100+ recipes, found ${files.length}`);
  let ok = 0;
  const failures: string[] = [];
  for (const f of files) {
    const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    const result = recetaSchema.safeParse(raw);
    if (result.success) ok += 1;
    else failures.push(`${f}: ${result.error.errors[0]?.message}`);
  }
  assert.equal(failures.length, 0, `parse failures: ${failures.slice(0, 3).join(" | ")}`);
  assert.equal(ok, files.length);
});

test("recetaSchema accepts a variante parcial (only one etapa)", () => {
  const parsed = recetaSchema.parse({
    id: "bollitos-de-maiz-con-pollo",
    numero: null,
    titulo: "Bollitos de Maíz con Pollo",
    destacadaPreview: false,
    variantes: {
      "etapa-2": { textura: "Bocaditos suaves", porcion: "150 g" },
    },
    tipo_comida: "almuerzo",
    minutos_prep: 30,
    kcal_100g: null,
    vitaminas: [],
    congelable: true,
    conservacion: null,
    pasos: [],
    notas: null,
    foto: null,
    receta_ingredientes: [],
    receta_alergenos: [],
    receta_tecnicas: [],
    codigo: "E2-P1-R3",
    coleccionIds: ["bocaditos-de-reserva-pollo"],
    eje: "pollo",
  });
  assert.equal(Object.keys(parsed.variantes).length, 1);
  assert.equal(parsed.coleccionIds?.[0], "bocaditos-de-reserva-pollo");
});

test("recetaSchema accepts reserva-shaped fields (nutrientes, conservaciones, pasosDetalle)", () => {
  const parsed = recetaSchema.parse({
    id: "deditos-de-pollo",
    numero: null,
    titulo: "Deditos de Pollo",
    destacadaPreview: false,
    variantes: {
      "etapa-2": {
        textura: "Bastones blandos",
        porcion: "150 g",
        rendimiento: { porciones: 30, gramosPorPorcion: 150 },
      },
    },
    tipo_comida: "almuerzo",
    minutos_prep: 45,
    kcal_100g: null,
    vitaminas: [],
    congelable: true,
    conservacion: null,
    pasos: [],
    notas: null,
    foto: null,
    receta_ingredientes: [],
    receta_alergenos: [],
    receta_tecnicas: [],
    codigo: "E2-P1-R5",
    coleccionIds: ["bocaditos-de-reserva-pollo"],
    nutrientes: {
      energiaKcal: 180,
      proteinasG: 10,
      carbohidratosG: 15,
      grasasG: 7,
      hierroMg: 1.2,
      calcioMg: 40,
      fibraG: 1.5,
      sodioMg: 30,
    },
    conservaciones: [
      { metodoId: "congelado", duracionDias: 90, tecnicaCongeladoId: "iqf" },
    ],
    pasosDetalle: [
      { orden: 0, accion: "Mezclar", observacion: "Hasta homogéneo" },
    ],
    preparacionFresca: false,
    advertencia: "No usar sal.",
    tip: "Sirve con puré de zapallo.",
    mensaje: "Un bocado para crecer.",
  });
  assert.equal(parsed.preparacionFresca, false);
  assert.equal(parsed.nutrientes?.aproximado, true);
});

test("menuSchema still parses a legacy menu", () => {
  menuSchema.parse({
    id: "menu-etapa-1-lunes",
    etapa_id: "etapa-1",
    nombre: "Lunes",
    dia: "Lunes",
    menu_recetas: [
      { receta_id: "compota-de-albaricoque", momento: "merienda", dia: "Lunes" },
    ],
  });
});

test("menuSchema accepts the reserva extension (celdas, planId, semana)", () => {
  menuSchema.parse({
    id: "e1-p1-s1",
    etapa_id: "etapa-1",
    nombre: "Semana 1",
    dia: null,
    menu_recetas: [],
    planId: "bocaditos-de-reserva-pollo",
    semana: 1,
    codigo: "E1-P1-S1",
    celdas: [
      { dia: "lun", tipoComida: "almuerzo", recetaId: "bollitos-de-maiz-con-pollo" },
    ],
    listaCompras: [
      {
        categoria: "Proteínas",
        ingredienteId: "pollo-pechuga",
        cantidad: 3,
        unidad: "kg",
        textoOriginal: "3 kg pechuga de pollo",
      },
    ],
  });
});

test("alergenoSchema still parses a legacy alergeno", () => {
  alergenoSchema.parse({ id: "gluten", nombre: "Gluten" });
});
