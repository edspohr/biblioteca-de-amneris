/**
 * Fase 2 — Paso 4: sube el contenido normalizado a Firestore. Idempotente
 * (upsert por id). Requiere backup reciente cuando corre con --apply.
 *
 * Carga:
 *   - recetas (con coleccionIds ['bocaditos-de-reserva-pollo'] añadido)
 *   - menus  (con planId + celdas)
 *   - guias  (colección nueva)
 *   - utensilios propuestos como catálogo (si aún no existen) — SOLO en
 *     Fase 2 tiene sentido; deja intactos los seed placeholders si los hay.
 *   - ingredientes propuestos (nuevos) — SOLO si pasas --create-ingredientes
 *
 * Uso:
 *   npm run import:load -- --dry-run
 *   npm run import:load -- --apply
 *   npm run import:load -- --apply --create-ingredientes
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { db, isApply, requireRecentBackup } from "../lib/admin";
import { slugify } from "../../src/lib/slug";

const ROOT = process.cwd();
const NORMALIZED_DIR = path.join(ROOT, "data", "import", "reserva-pollo", "normalized");
const COLECCION_ID = "bocaditos-de-reserva-pollo";
const CREATE_INGREDIENTES = process.argv.includes("--create-ingredientes");

interface MergedReceta {
  id: string;
  titulo: string;
  coleccionIds: string[];
  eje: string;
  codigosFuente: string[];
  tipoComida: string;
  variantes: Record<
    string,
    {
      codigo: string;
      textura: string;
      porcion: string;
      rendimiento: { porciones: number; gramosPorPorcion: number } | null;
      texturaObjetivo: string | null;
      tiempoMin: number | null;
      ingredientes: {
        ingrediente_id: string;
        cantidad: number | null;
        unidad: string | null;
        nota: string;
      }[];
      pasos: { orden: number; accion: string; observacion: string }[];
      nutrientes: Record<string, number | undefined>;
      conservaciones: { metodoId: string; duracionDias: number | null; nota: string | null }[];
      advertencia: string | null;
      tip: string | null;
    }
  >;
  vitaminas: string[];
  vitaminasDetalle: { etiquetaId: string; nivel: string | null; beneficio: string | null }[];
  mensaje: string | null;
  alergenosInferidos: string[];
  preparacionFresca: boolean;
}

interface MergedMenu {
  id: string;
  codigo: string;
  etapaId: string;
  semana: number;
  coleccionIds: string[];
  planId: string;
  celdas: { dia: string; tipoComida: string; recetaId: string }[];
  listaCompras: { categoria: string; textoOriginal: string }[];
  tip: string | null;
  advertencia: string | null;
}

interface MergedGuia {
  id: string;
  codigo: string;
  coleccionId: string;
  titulo: string;
  bloques: unknown[];
}

interface Propuestos {
  ingredientes: {
    nombreOriginal: string;
    idPropuesto: string;
    categoriaPropuesta?: string;
  }[];
  alergenos: string[];
}

async function readJson<T>(f: string): Promise<T> {
  return JSON.parse(await fs.readFile(f, "utf8")) as T;
}

// Convierte el MergedReceta a un Firestore doc respetando el schema Receta.
// - `pasosDetalle` viene de la variante base (la primera etapa disponible);
//   si hay varias etapas, se toman los pasos de la etapa E1 por default.
// - `variantes[etapaId]` guarda textura, porcion + overrides opcionales.
// - `ingrediente_ids`, `alergeno_ids`, `tecnica_ids` denormalizados para las
//   queries array-contains (mismo formato que firestore-adapter.toRecetaDoc).
function toRecetaDoc(r: MergedReceta): Record<string, unknown> {
  const etapas = Object.keys(r.variantes).sort();
  const primera = r.variantes[etapas[0]];
  const variantes: Record<string, unknown> = {};
  const ingredienteIds = new Set<string>();
  for (const etapaId of etapas) {
    const v = r.variantes[etapaId];
    variantes[etapaId] = {
      textura: v.textura || v.texturaObjetivo || "Ver notas de textura",
      porcion: v.porcion || "Ver rendimiento",
      rendimiento: v.rendimiento ?? undefined,
      texturaObjetivo: v.texturaObjetivo ?? undefined,
      tiempoMin: v.tiempoMin ?? undefined,
      ingredientes: v.ingredientes,
      pasos: v.pasos.map((p) => ({
        orden: p.orden,
        accion: p.accion,
        observacion: p.observacion || null,
      })),
      nutrientes: normalizeNutrientes(v.nutrientes),
      conservaciones: v.conservaciones.map((c) => ({
        metodoId: c.metodoId,
        duracionDias: c.duracionDias,
        envaseUtensilioId: null,
        tecnicaEnfriadoId: null,
        tecnicaCongeladoId: null,
        tecnicaRegeneracionId: null,
        nota: c.nota,
      })),
      advertencia: v.advertencia,
      tip: v.tip,
    };
    for (const ing of v.ingredientes) ingredienteIds.add(ing.ingrediente_id);
  }

  const receta_ingredientes = primera.ingredientes;
  const receta_alergenos = r.alergenosInferidos.map((a) => ({
    alergeno_id: a,
    inferido: true,
  }));

  return {
    id: r.id,
    numero: null,
    titulo: r.titulo,
    destacadaPreview: false,
    variantes,
    tipo_comida: r.tipoComida,
    minutos_prep: primera.tiempoMin,
    kcal_100g: null,
    vitaminas: r.vitaminas,
    congelable: r.preparacionFresca ? false : true,
    conservacion: null,
    pasos: primera.pasos.map((p) => p.accion),
    notas: null,
    foto: null,
    receta_ingredientes,
    receta_alergenos,
    receta_tecnicas: [],
    codigo: r.codigosFuente[0] ?? null,
    coleccionIds: r.coleccionIds,
    eje: r.eje,
    rendimiento: primera.rendimiento ?? undefined,
    texturaObjetivo: primera.texturaObjetivo ?? undefined,
    nutrientes: normalizeNutrientes(primera.nutrientes),
    vitaminasDetalle: r.vitaminasDetalle,
    conservaciones: primera.conservaciones.map((c) => ({
      metodoId: c.metodoId,
      duracionDias: c.duracionDias,
      envaseUtensilioId: null,
      tecnicaEnfriadoId: null,
      tecnicaCongeladoId: null,
      tecnicaRegeneracionId: null,
      nota: c.nota,
    })),
    pasosDetalle: primera.pasos.map((p) => ({
      orden: p.orden,
      accion: p.accion,
      observacion: p.observacion || null,
    })),
    preparacionFresca: r.preparacionFresca,
    advertencia: primera.advertencia,
    tip: primera.tip,
    mensaje: r.mensaje,
    // Denormalización para queries array-contains
    ingrediente_ids: [...ingredienteIds].sort(),
    alergeno_ids: r.alergenosInferidos.sort(),
    tecnica_ids: [],
  };
}

function normalizeNutrientes(n: Record<string, number | undefined> | undefined): unknown {
  if (!n) return undefined;
  const has = (k: string) => typeof n[k] === "number";
  const need = [
    "energiaKcal",
    "proteinasG",
    "carbohidratosG",
    "grasasG",
    "hierroMg",
    "calcioMg",
    "fibraG",
    "sodioMg",
  ];
  if (!need.every(has)) return undefined;
  return {
    energiaKcal: n.energiaKcal,
    proteinasG: n.proteinasG,
    carbohidratosG: n.carbohidratosG,
    grasasG: n.grasasG,
    hierroMg: n.hierroMg,
    calcioMg: n.calcioMg,
    fibraG: n.fibraG,
    sodioMg: n.sodioMg,
    aproximado: true,
    fuente: "Docx autora, pendiente revisión nutricional",
  };
}

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();

  const recetas = await readJson<MergedReceta[]>(path.join(NORMALIZED_DIR, "recetas.json"));
  const menus = await readJson<MergedMenu[]>(path.join(NORMALIZED_DIR, "menus.json"));
  const guias = await readJson<MergedGuia[]>(path.join(NORMALIZED_DIR, "guias.json"));
  const propuestos = await readJson<Propuestos>(
    path.join(NORMALIZED_DIR, "catalogos-propuestos.json")
  );

  // Safety: si hay ingredientes propuestos, las recetas los referencian por
  // id — cargar sin --create-ingredientes deja las recetas apuntando a docs
  // que no existen (⭐xxx si el id es sin normalizar, o slug limpio si vino
  // de EXPLICIT_NEW_INGREDIENT_MAP). Ambos casos rompen el reader.
  if (apply && propuestos.ingredientes.length > 0 && !CREATE_INGREDIENTES) {
    throw new Error(
      `Hay ${propuestos.ingredientes.length} ingredientes propuestos referenciados por recetas. ` +
        `Cargarlos con --apply sin --create-ingredientes dejaría recetas apuntando a docs de ingrediente que no existen. ` +
        `Opciones: (a) editar normalize.ts para mapear a ids existentes, ` +
        `(b) pasar --create-ingredientes para crear los ${propuestos.ingredientes.length} propuestos con la categoría sugerida.`
    );
  }

  console.log(`Load reserva-pollo (${apply ? "APPLY" : "dry-run"}):`);
  console.log(`  recetas:      ${recetas.length}`);
  console.log(`  menus:        ${menus.length}`);
  console.log(`  guias:        ${guias.length}`);
  console.log(`  ingredientes propuestos: ${propuestos.ingredientes.length}${CREATE_INGREDIENTES ? " (SE CREARÁN)" : " (NO se crean, pasa --create-ingredientes si querés)"}`);
  console.log();

  const database = db();

  // 0. Ingredientes propuestos (opcional). Usa el idPropuesto ya decidido en
  // normalize.ts (los mapeos explícitos consolidan variantes en un solo id)
  // y la categoriaPropuesta cuando existe.
  if (CREATE_INGREDIENTES && propuestos.ingredientes.length > 0) {
    for (const p of propuestos.ingredientes) {
      // Si aún es ⭐xxx (no hay decisión explícita), cae a slug + Sin categoría.
      const id = p.idPropuesto.startsWith("⭐")
        ? p.idPropuesto.slice(1)
        : p.idPropuesto;
      const doc = {
        id,
        nombre: p.nombreOriginal,
        categoria: p.categoriaPropuesta ?? "Sin categoría",
      };
      console.log(`  ✎ ingrediente NUEVO: ${id} — ${p.nombreOriginal} (${doc.categoria})`);
      if (apply) await database.collection("ingredientes").doc(id).set(doc);
    }
  }

  // Reescribir ingrediente_id ⭐xxx → xxx si vamos a crearlos
  // (Si no, quedan como ⭐xxx y hay que arreglarlos manualmente después.)
  function fixIngIds(ings: { ingrediente_id: string }[]) {
    if (!CREATE_INGREDIENTES) return;
    for (const ing of ings) {
      if (ing.ingrediente_id.startsWith("⭐")) ing.ingrediente_id = ing.ingrediente_id.slice(1);
    }
  }

  // 1. Recetas
  for (const r of recetas) {
    for (const etapaId of Object.keys(r.variantes)) fixIngIds(r.variantes[etapaId].ingredientes);
    const doc = toRecetaDoc(r);
    console.log(`  ✎ receta: ${r.id} (${Object.keys(r.variantes).length} etapas)`);
    if (apply) await database.collection("recetas").doc(r.id).set(doc);
  }

  // 2. Menús
  for (const m of menus) {
    const doc = {
      id: m.id,
      etapa_id: m.etapaId,
      nombre: `Semana ${m.semana} · ${m.etapaId.replace("etapa-", "Etapa ")}`,
      dia: null,
      menu_recetas: m.celdas.map((c) => ({
        receta_id: c.recetaId,
        momento: c.tipoComida,
        dia: c.dia.toUpperCase(),
      })),
      planId: m.planId,
      semana: m.semana,
      codigo: m.codigo,
      celdas: m.celdas.map((c) => ({
        dia: c.dia,
        tipoComida: c.tipoComida,
        recetaId: c.recetaId,
      })),
      listaCompras: m.listaCompras.map((li) => ({
        categoria: li.categoria,
        ingredienteId: slugify(li.textoOriginal.split(":")[0] ?? li.textoOriginal),
        cantidad: null,
        unidad: null,
        textoOriginal: li.textoOriginal,
      })),
      tip: m.tip,
      advertencia: m.advertencia,
      receta_ids: [...new Set(m.celdas.map((c) => c.recetaId))].sort(),
    };
    console.log(`  ✎ menu: ${m.id} (${m.celdas.length} celdas)`);
    if (apply) await database.collection("menus").doc(m.id).set(doc);
  }

  // 3. Guías
  for (const g of guias) {
    const doc = {
      id: g.id,
      coleccionId: g.coleccionId,
      codigo: g.codigo,
      titulo: g.titulo || g.codigo,
      subtitulo: null,
      orden: parseInt(g.codigo.replace(/[^0-9]/g, ""), 10) || 0,
      bloques: g.bloques,
    };
    console.log(`  ✎ guia: ${g.id} — ${doc.titulo}`);
    if (apply) await database.collection("guias").doc(g.id).set(doc);
  }

  console.log();
  if (!apply) {
    console.log("Dry-run terminado. Revisa el REPORTE.md y luego corre con --apply.");
  } else {
    console.log("✓ Carga completa. Colección bocaditos-de-reserva-pollo queda `oculta` (revisa desde /admin).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
