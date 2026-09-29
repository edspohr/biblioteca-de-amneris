/**
 * Fase 2 — Paso 2: normaliza los bloques extraídos por extract-docx.ts a los
 * esquemas del proyecto (Receta, Menu, Guia). No escribe en Firestore; su
 * salida vive en data/import/reserva-pollo/normalized/ y la consume load.ts.
 *
 * Los ingredientes/técnicas/alergenos que no matcheen contra los catálogos
 * de Firestore se emiten en catalogos-propuestos.json — NUNCA se crean acá
 * en silencio.
 *
 * Uso:
 *   npm run import:normalize
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "../lib/admin";
import { slugify } from "../../src/lib/slug";
import {
  ingredienteSchema,
  alergenoSchema,
  type Ingrediente,
  type Alergeno,
} from "../../src/lib/schema";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "data", "import", "reserva-pollo", "raw", "split");
const OUT_DIR = path.join(ROOT, "data", "import", "reserva-pollo", "normalized");
const COLECCION_ID = "bocaditos-de-reserva-pollo";
const EJE = "pollo";

interface Para {
  kind: "para";
  text: string;
}
interface Table {
  kind: "table";
  rows: string[][];
}
type Block = Para | Table;

interface Section {
  code: string;
  blocks: Block[];
}

// ---------------------------------------------------------------------------
// Utilidades genéricas
// ---------------------------------------------------------------------------

function paras(blocks: Block[]): Para[] {
  return blocks.filter((b): b is Para => b.kind === "para");
}
function tables(blocks: Block[]): Table[] {
  return blocks.filter((b): b is Table => b.kind === "table");
}

function findTable(
  tables: Table[],
  predicate: (t: Table, idx: number) => boolean
): Table | null {
  for (let i = 0; i < tables.length; i++) if (predicate(tables[i], i)) return tables[i];
  return null;
}

function trim(s: string | undefined): string {
  return (s ?? "").trim();
}

function parseUnidadCantidad(raw: string): {
  cantidad: number | null;
  unidad: string | null;
  textoOriginal: string;
} {
  const texto = raw.trim();
  // c/n → cantidad libre
  if (/^c\s*\/\s*n$/i.test(texto))
    return { cantidad: null, unidad: "cn", textoOriginal: texto };
  // "3 kg", "500g", "4 unidades", "1.5 tazas", "2 cucharaditas"
  const m = texto.match(/^([\d.,]+)\s*([a-záéíóúñ\/\s]+)?$/i);
  if (!m) return { cantidad: null, unidad: null, textoOriginal: texto };
  const cantidad = parseFloat(m[1].replace(",", "."));
  let unidad = trim(m[2] ?? "").toLowerCase();
  if (!unidad) unidad = "unidades";
  // Normalizar unidades comunes
  unidad = unidad.replace(/\s+/g, " ");
  return { cantidad: Number.isFinite(cantidad) ? cantidad : null, unidad, textoOriginal: texto };
}

// Reconciliación por nombre normalizado.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Parser de una sección de RECETA
// ---------------------------------------------------------------------------

interface ParsedReceta {
  codigo: string;
  etapaId: string;
  tipoComida: string; // desayuno|almuerzo|cena — desde el header
  titulo: string;
  tiempoMin: number | null;
  rendimiento: { porciones: number; gramosPorPorcion: number } | null;
  congela: boolean | null; // null si no se pudo detectar
  ingredientes: {
    nro: number;
    nombre: string;
    cantidadRaw: string;
  }[];
  pasos: {
    orden: number;
    accion: string;
    observacion: string;
  }[];
  nutrientes: {
    energiaKcal?: number;
    proteinasG?: number;
    carbohidratosG?: number;
    grasasG?: number;
    hierroMg?: number;
    calcioMg?: number;
    fibraG?: number;
    sodioMg?: number;
  };
  vitaminas: {
    etiqueta: string;
    nivel: "alta" | "media" | "baja" | null;
    beneficio: string;
  }[];
  texturaObjetivo: string | null;
  congelacionNota: string | null;
  regeneracionNota: string | null;
  advertencia: string | null;
  tip: string | null;
  mensaje: string | null;
  warnings: string[];
}

const TIPO_MAP: Record<string, "desayuno" | "almuerzo" | "cena" | null> = {
  DESAYUNO: "desayuno",
  ALMUERZO: "almuerzo",
  CENA: "cena",
  MERIENDA: "desayuno", // no aparece en reserva pero por si acaso
};

function parseReceta(sec: Section): ParsedReceta {
  const warnings: string[] = [];
  const bl = sec.blocks;
  const codigo = sec.code;
  const etapaId = `etapa-${codigo[1]}`; // E1 → etapa-1

  // Título: primera para NO-marker después del header.
  // El header es tipo "DESAYUNO E1-P1-R1", la siguiente para (o cell) es el título.
  let tipoRaw = "";
  let titulo = "";
  for (const b of bl) {
    if (b.kind !== "para") continue;
    if (!tipoRaw) {
      const m = b.text.match(/^(DESAYUNO|ALMUERZO|CENA|MERIENDA)\s/i);
      if (m) tipoRaw = m[1].toUpperCase();
      continue;
    }
    // primer para después del header es el título
    if (!titulo && !/^⏱|^🍽|^❄️/.test(b.text)) {
      titulo = b.text;
      break;
    }
  }
  const tipoComida = TIPO_MAP[tipoRaw] ?? "almuerzo";
  if (!tipoRaw) warnings.push("No se detectó tipo de comida en el header");
  if (!titulo) warnings.push("No se detectó título");

  // Tabla info (⏱ / 🍽 / ❄️) — puede aparecer como celdas de una tabla, o como paras sueltas.
  let tiempoMin: number | null = null;
  let rendimiento: { porciones: number; gramosPorPorcion: number } | null = null;
  let congela: boolean | null = null;
  for (const b of bl) {
    const text = b.kind === "para" ? b.text : b.rows.flat().join(" | ");
    const mT = text.match(/⏱\s*(\d+)\s*minutos?/);
    if (mT && tiempoMin == null) tiempoMin = parseInt(mT[1], 10);
    const mR = text.match(/🍽\s*(\d+)\s*porciones?\s*\((\d+)g/);
    if (mR && !rendimiento)
      rendimiento = {
        porciones: parseInt(mR[1], 10),
        gramosPorPorcion: parseInt(mR[2], 10),
      };
    if (congela == null) {
      if (/❄️\s*CONGELA\s*✅/.test(text)) congela = true;
      else if (/❄️\s*(NO\s*CONGELA|CONGELA)\s*❌/.test(text)) congela = false;
    }
    if (tiempoMin != null && rendimiento && congela != null) break;
  }
  if (tiempoMin == null) warnings.push("Sin tiempo de preparación (⏱)");
  if (!rendimiento) warnings.push("Sin rendimiento (🍽)");
  if (congela == null) warnings.push("Sin estado de congelación (❄️)");

  // Tabla de ingredientes: header "N° | INGREDIENTE | CANTIDAD"
  const ingTab = findTable(tables(bl), (t) => {
    const h = t.rows[0]?.map(norm) ?? [];
    return h[0] === "n" && h[1] === "ingrediente" && h[2] === "cantidad";
  });
  const ingredientes: ParsedReceta["ingredientes"] = [];
  if (ingTab) {
    for (const row of ingTab.rows.slice(1)) {
      if (row.length < 3) continue;
      const nro = parseInt(row[0], 10);
      const nombre = trim(row[1]);
      const cantidadRaw = trim(row[2]);
      if (!nombre) continue;
      ingredientes.push({ nro: Number.isFinite(nro) ? nro : ingredientes.length + 1, nombre, cantidadRaw });
    }
  } else {
    warnings.push("Tabla de INGREDIENTES no encontrada");
  }

  // Tabla de pasos: header "PASO | ACCIÓN | OBSERVACIONES"
  const pasosTab = findTable(tables(bl), (t) => {
    const h = t.rows[0]?.map(norm) ?? [];
    return h[0] === "paso" && h[1] === "accion" && (h[2]?.startsWith("observacion") ?? false);
  });
  const pasos: ParsedReceta["pasos"] = [];
  if (pasosTab) {
    for (const row of pasosTab.rows.slice(1)) {
      if (row.length < 2) continue;
      const orden = parseInt(row[0], 10);
      pasos.push({
        orden: Number.isFinite(orden) ? orden - 1 : pasos.length,
        accion: trim(row[1]),
        observacion: trim(row[2] ?? ""),
      });
    }
  } else {
    warnings.push("Tabla de PASOS no encontrada");
  }

  // Nutrientes: buscar tabla con header "NUTRIENTES POR PORCIÓN"
  const nutTab = findTable(tables(bl), (t) =>
    t.rows.some((r) => r.some((c) => /NUTRIENTES POR PORCI/.test(c)))
  );
  const nutrientes: ParsedReceta["nutrientes"] = {};
  if (nutTab) {
    // Los datos están como pares campo/valor esparcidos. Buscamos ~<num> <unidad>
    const flat = nutTab.rows.flat();
    for (let i = 0; i < flat.length; i++) {
      const label = norm(flat[i]);
      const value = flat[i + 1] ?? "";
      const mNum = value.match(/~?\s*([\d.,]+)/);
      if (!mNum) continue;
      const n = parseFloat(mNum[1].replace(",", "."));
      if (!Number.isFinite(n)) continue;
      if (label === "energia") nutrientes.energiaKcal = n;
      else if (label === "proteinas") nutrientes.proteinasG = n;
      else if (label === "carbohidratos") nutrientes.carbohidratosG = n;
      else if (label === "grasas") nutrientes.grasasG = n;
      else if (label === "hierro") nutrientes.hierroMg = n;
      else if (label === "calcio") nutrientes.calcioMg = n;
      else if (label === "fibra") nutrientes.fibraG = n;
      else if (label === "sodio") nutrientes.sodioMg = n;
    }
  } else {
    warnings.push("Tabla de NUTRIENTES no encontrada");
  }

  // Vitaminas: tabla "APORTES DE VITAMINAS Y MINERALES"
  const vitTab = findTable(tables(bl), (t) =>
    t.rows.some((r) => r.some((c) => /APORTES DE VITAMINAS/.test(c)))
  );
  const vitaminas: ParsedReceta["vitaminas"] = [];
  if (vitTab) {
    // Estructura: título, luego 3 filas de 4 columnas (nombres, niveles, beneficios)
    // Como el layout varía, agarramos las últimas 3 filas de 4 columnas.
    const bodyRows = vitTab.rows.filter((r) => r.length === 4);
    // Buscamos las 3 filas después del header. La primera es nombres, la segunda niveles, la tercera beneficios.
    const start = bodyRows.findIndex((r) => r.some((c) => /vitamina|hierro|zinc|calcio/i.test(c)));
    if (start >= 0 && bodyRows.length >= start + 3) {
      const nombres = bodyRows[start];
      const niveles = bodyRows[start + 1];
      const beneficios = bodyRows[start + 2];
      for (let i = 0; i < 4; i++) {
        const nivelRaw = norm(niveles[i]);
        const nivel = nivelRaw === "alta" ? "alta" : nivelRaw === "media" || nivelRaw === "medio" ? "media" : nivelRaw === "baja" || nivelRaw === "bajo" ? "baja" : null;
        vitaminas.push({
          etiqueta: trim(nombres[i]).replace(/^[^\p{L}]+/u, ""),
          nivel,
          beneficio: trim(beneficios[i]),
        });
      }
    }
  }

  // Notas de textura y congelación: tabla con "NOTAS DE TEXTURA Y CONGELACIÓN"
  const consTab = findTable(tables(bl), (t) =>
    t.rows.some((r) => r.some((c) => /NOTAS DE TEXTURA Y CONGELACI/.test(c)))
  );
  let texturaObjetivo: string | null = null;
  let congelacionNota: string | null = null;
  let regeneracionNota: string | null = null;
  let advertencia: string | null = null;
  let tip: string | null = null;
  let mensaje: string | null = null;
  if (consTab) {
    const cells = consTab.rows.flat();
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (/^Textura objetivo:/.test(c)) {
        texturaObjetivo = c.replace(/^Textura objetivo:\s*/, "").trim() || cells[i + 1]?.trim() || null;
      } else if (/^Método de congelación:/.test(c)) {
        congelacionNota = c.replace(/^Método de congelación:\s*/, "").trim() || cells[i + 1]?.trim() || null;
      } else if (/^Cómo revivir/.test(c)) {
        regeneracionNota = c.replace(/^Cómo revivir[^:]*:\s*/, "").trim() || cells[i + 1]?.trim() || null;
      } else if (/^⚠️/.test(c)) {
        advertencia = c.replace(/^⚠️\s*/, "").trim();
      } else if (/^💡/.test(c)) {
        tip = c.replace(/^💡\s*/, "").trim();
      } else if (c && !advertencia && !tip && !texturaObjetivo && !congelacionNota) {
        // ignore
      } else if (c && advertencia && tip && !mensaje && !c.startsWith("⚠️") && !c.startsWith("💡") && !c.startsWith("Textura") && !c.startsWith("Método") && !c.startsWith("Cómo")) {
        mensaje = c;
      }
    }
  }
  // Si no se encontró en la tabla, buscar en paragraphs finales
  if (!advertencia || !tip || !mensaje) {
    const ps = paras(bl);
    for (const p of ps) {
      if (!advertencia && p.text.startsWith("⚠️")) advertencia = p.text.replace(/^⚠️\s*/, "");
      else if (!tip && p.text.startsWith("💡")) tip = p.text.replace(/^💡\s*/, "");
    }
    // El mensaje suele ser la última para no-marker y contiene emoji al final
    for (let i = ps.length - 1; i >= 0; i--) {
      const t = ps[i].text;
      if (!t) continue;
      if (t.startsWith("⚠️") || t.startsWith("💡")) continue;
      if (/ETAPA \d/.test(t)) continue;
      if (/PREPARACIÓN|INGREDIENTES|NUTRIENTES|APORTES|NOTAS/.test(t)) continue;
      if (t.length < 40) continue;
      if (!mensaje) mensaje = t;
      break;
    }
  }

  return {
    codigo,
    etapaId,
    tipoComida,
    titulo,
    tiempoMin,
    rendimiento,
    congela,
    ingredientes,
    pasos,
    nutrientes,
    vitaminas,
    texturaObjetivo,
    congelacionNota,
    regeneracionNota,
    advertencia,
    tip,
    mensaje,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Parser de una sección de MENÚ
// ---------------------------------------------------------------------------

interface ParsedMenu {
  codigo: string;
  etapaId: string;
  semana: number;
  celdas: { dia: string; tipoComida: string; recetaTitulo: string }[];
  listaCompras: { categoria: string; textoOriginal: string }[];
  tip: string | null;
  advertencia: string | null;
  warnings: string[];
}

const DIA_MAP: Record<string, string> = {
  LUN: "lun",
  MAR: "mar",
  MIÉ: "mie",
  MIE: "mie",
  JUE: "jue",
  VIE: "vie",
  SÁB: "sab",
  SAB: "sab",
  DOM: "dom",
};

function parseMenu(sec: Section): ParsedMenu {
  const warnings: string[] = [];
  const codigo = sec.code;
  const etapaId = `etapa-${codigo[1]}`;
  const semana = parseInt(codigo[codigo.length - 1], 10);

  // Tabla del grid semanal: header con LUN, MAR, MIÉ, JUE, VIE, SÁB, DOM
  const menuTab = findTable(tables(sec.blocks), (t) => {
    const h = t.rows[0]?.map(norm) ?? [];
    return h.includes("lun") && h.includes("dom");
  });
  const celdas: ParsedMenu["celdas"] = [];
  if (menuTab) {
    const header = menuTab.rows[0];
    // buscar índices de los días
    const diaIdx: number[] = [];
    for (let i = 0; i < header.length; i++) {
      const key = header[i].toUpperCase().replace(/\s+/g, "");
      const d = DIA_MAP[key];
      if (d) diaIdx.push(i);
    }
    for (const row of menuTab.rows.slice(1)) {
      const label = row[0]?.toUpperCase().replace(/\s+/g, "");
      let tipoComida: string | null = null;
      if (label === "DESAYUNO") tipoComida = "desayuno";
      else if (label === "ALMUERZO") tipoComida = "almuerzo";
      else if (label === "CENA") tipoComida = "cena";
      if (!tipoComida) continue;
      for (const i of diaIdx) {
        const recetaTitulo = trim(row[i]);
        if (!recetaTitulo) continue;
        const diaKey = header[i].toUpperCase().replace(/\s+/g, "");
        const dia = DIA_MAP[diaKey];
        if (!dia) continue;
        celdas.push({ dia, tipoComida, recetaTitulo });
      }
    }
  } else {
    warnings.push("Grid semanal no encontrado");
  }

  // Lista de compras: capturamos las paras siguientes al header "LISTA DE COMPRAS"
  const ps = paras(sec.blocks);
  const startIdx = ps.findIndex((p) => /LISTA DE COMPRAS/i.test(p.text));
  const listaCompras: ParsedMenu["listaCompras"] = [];
  let tip: string | null = null;
  let advertencia: string | null = null;
  const CATS = ["PROTEÍNAS", "VEGETALES Y GRANOS", "CARBOHIDRATOS", "FRUTAS"];
  if (startIdx >= 0) {
    let categoriaActual = "SIN CATEGORÍA";
    for (const p of ps.slice(startIdx + 1)) {
      if (p.text.startsWith("💡")) {
        tip = p.text.replace(/^💡\s*/, "");
        continue;
      }
      if (p.text.startsWith("⚠️")) {
        advertencia = p.text.replace(/^⚠️\s*/, "");
        continue;
      }
      const upper = p.text.toUpperCase();
      if (CATS.some((c) => upper === c)) {
        categoriaActual = upper;
        continue;
      }
      // Item de lista si tiene ":" y no es todo mayúsculas
      if (p.text.includes(":") && !/^ETAPA|SEMANA|MENÚ/.test(upper)) {
        listaCompras.push({ categoria: categoriaActual, textoOriginal: p.text });
      }
    }
  } else {
    warnings.push("Lista de compras no encontrada");
  }

  return { codigo, etapaId, semana, celdas, listaCompras, tip, advertencia, warnings };
}

// ---------------------------------------------------------------------------
// Parser de una sección de GUÍA
// ---------------------------------------------------------------------------

interface ParsedGuia {
  codigo: string;
  titulo: string;
  bloques: (
    | { kind: "parrafo"; texto: string }
    | { kind: "lista"; ordenada: boolean; items: string[] }
    | { kind: "tabla"; columnas: string[]; filas: string[][] }
    | { kind: "aviso"; tipo: "tip" | "advertencia"; texto: string }
  )[];
}

function parseGuia(sec: Section): ParsedGuia {
  const codigo = sec.code;
  // Título: primera para que no sea el código
  const ps = paras(sec.blocks);
  let titulo = "";
  for (const p of ps) {
    if (p.text === codigo || p.text.startsWith(codigo)) continue;
    titulo = p.text;
    break;
  }

  const bloques: ParsedGuia["bloques"] = [];
  for (const b of sec.blocks) {
    if (b.kind === "para") {
      if (b.text === codigo || b.text === titulo) continue;
      if (b.text.startsWith("💡")) {
        bloques.push({ kind: "aviso", tipo: "tip", texto: b.text.replace(/^💡\s*/, "") });
      } else if (b.text.startsWith("⚠️")) {
        bloques.push({
          kind: "aviso",
          tipo: "advertencia",
          texto: b.text.replace(/^⚠️\s*/, ""),
        });
      } else {
        bloques.push({ kind: "parrafo", texto: b.text });
      }
    } else if (b.kind === "table") {
      if (b.rows.length === 0) continue;
      const columnas = b.rows[0].map((c) => trim(c));
      const filas = b.rows.slice(1).map((r) => r.map((c) => trim(c)));
      bloques.push({ kind: "tabla", columnas, filas });
    }
  }
  return { codigo, titulo, bloques };
}

// ---------------------------------------------------------------------------
// Reconciliación contra catálogos existentes
// ---------------------------------------------------------------------------

interface CatalogHit<T> {
  match: T | null;
  candidatos: { id: string; nombre: string; score: number }[];
}

function reconciliar<T extends { id: string; nombre: string }>(
  nombreRaw: string,
  catalog: T[]
): CatalogHit<T> {
  const target = norm(nombreRaw);
  let exact: T | null = null;
  const candidatos: { id: string; nombre: string; score: number }[] = [];
  for (const item of catalog) {
    const n = norm(item.nombre);
    if (n === target) {
      exact = item;
      break;
    }
    // Score simple: intersección de tokens
    const a = new Set(target.split(" "));
    const b = new Set(n.split(" "));
    let overlap = 0;
    for (const x of a) if (b.has(x)) overlap++;
    if (overlap > 0) {
      const score = overlap / Math.max(a.size, b.size);
      candidatos.push({ id: item.id, nombre: item.nombre, score });
    }
  }
  candidatos.sort((a, b) => b.score - a.score);
  return { match: exact, candidatos: candidatos.slice(0, 3) };
}

// Heurística para alérgenos inferidos (misma lógica que scripts/apply-alergenos.ts,
// simplificada para no depender de ids específicos)
function inferirAlergenos(nombre: string): string[] {
  const n = norm(nombre);
  const out: string[] = [];
  if (/\bhuevo\b|\bhuevos\b/.test(n)) out.push("huevo");
  if (/\bleche\b|\byogur\b|\bqueso\b|\bricotta\b|\bcrema\b/.test(n)) out.push("lacteos");
  if (/\bavena\b|\btrigo\b|\bharina\b|\bpan\b|\bsemola\b/.test(n)) out.push("gluten");
  if (/\bpescado\b|\bsalmon\b|\bmerluza\b|\bbacalao\b|\batun\b/.test(n)) out.push("pescado");
  if (/\btofu\b|\bsoja\b/.test(n)) out.push("soja");
  if (/\bsesamo\b|\btahini\b/.test(n)) out.push("sesamo");
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function readSection(file: string): Promise<Section> {
  return JSON.parse(await fs.readFile(file, "utf8")) as Section;
}

async function main() {
  const files = (await fs.readdir(RAW_DIR)).filter((f) => f.endsWith(".json") && f !== "_pre.json");
  const secciones: Section[] = [];
  for (const f of files) secciones.push(await readSection(path.join(RAW_DIR, f)));

  const recetasParsed: ParsedReceta[] = [];
  const menusParsed: ParsedMenu[] = [];
  const guiasParsed: ParsedGuia[] = [];

  for (const s of secciones) {
    if (/^E\d-[PH]\d-R\d$/.test(s.code)) recetasParsed.push(parseReceta(s));
    else if (/^E\d-[PH]\d-S\d$/.test(s.code)) menusParsed.push(parseMenu(s));
    else if (/^B3-P\d$/.test(s.code)) guiasParsed.push(parseGuia(s));
  }

  // Cargar catálogos actuales para reconciliar
  const database = db();
  const [ingSnap, aleSnap] = await Promise.all([
    database.collection("ingredientes").get(),
    database.collection("alergenos").get(),
  ]);
  const ingredientesCatalog: Ingrediente[] = ingSnap.docs.map((d) =>
    ingredienteSchema.parse(d.data())
  );
  const alergenosCatalog: Alergeno[] = aleSnap.docs.map((d) => alergenoSchema.parse(d.data()));
  console.log(
    `Catálogos: ingredientes=${ingredientesCatalog.length}, alergenos=${alergenosCatalog.length}`
  );

  // Reconciliación de ingredientes
  interface IngProposal {
    nombreOriginal: string;
    recetas: string[];
    candidatos: { id: string; nombre: string; score: number }[];
  }
  const propuestos = new Map<string, IngProposal>(); // key = norm(nombre)
  const ingLookup = new Map<string, string>(); // norm → id

  for (const r of recetasParsed) {
    for (const ing of r.ingredientes) {
      const key = norm(ing.nombre);
      if (ingLookup.has(key)) continue;
      const hit = reconciliar(ing.nombre, ingredientesCatalog);
      if (hit.match) {
        ingLookup.set(key, hit.match.id);
      } else {
        const cur = propuestos.get(key) ?? {
          nombreOriginal: ing.nombre,
          recetas: [],
          candidatos: hit.candidatos,
        };
        if (!cur.recetas.includes(r.codigo)) cur.recetas.push(r.codigo);
        propuestos.set(key, cur);
      }
    }
  }

  // Alérgenos inferidos por receta
  const alergenosPorReceta = new Map<string, string[]>();
  const alergenosPropuestos = new Set<string>();
  for (const r of recetasParsed) {
    const setA = new Set<string>();
    for (const ing of r.ingredientes) {
      const inferidos = inferirAlergenos(ing.nombre);
      for (const a of inferidos) {
        const hit = reconciliar(a, alergenosCatalog);
        if (hit.match) setA.add(hit.match.id);
        else alergenosPropuestos.add(a);
      }
    }
    alergenosPorReceta.set(r.codigo, [...setA].sort());
  }

  // Merge de recetas por título normalizado → una Receta con variantes por etapa
  interface MergedReceta {
    id: string;
    titulo: string;
    coleccionIds: string[];
    eje: string;
    codigosFuente: string[];
    tipoComida: string;
    variantes: Record<string, {
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
      nutrientes: ParsedReceta["nutrientes"];
      conservaciones: {
        metodoId: string;
        duracionDias: number | null;
        nota: string | null;
      }[];
      advertencia: string | null;
      tip: string | null;
    }>;
    // Metadata a la raíz
    vitaminas: string[];
    vitaminasDetalle: { etiquetaId: string; nivel: string | null; beneficio: string | null }[];
    mensaje: string | null;
    alergenosInferidos: string[];
    warnings: string[];
    preparacionFresca: boolean;
  }

  const mergedByTitle = new Map<string, MergedReceta>();
  for (const r of recetasParsed) {
    const id = slugify(r.titulo);
    const existing = mergedByTitle.get(id);
    const varianteId = r.etapaId;
    // Convert ingredientes: mapping to catalog ids
    const ings = r.ingredientes.map((ing) => {
      const key = norm(ing.nombre);
      const catalogId = ingLookup.get(key);
      const u = parseUnidadCantidad(ing.cantidadRaw);
      return {
        ingrediente_id: catalogId ?? `⭐${slugify(ing.nombre)}`,
        cantidad: u.cantidad,
        unidad: u.unidad,
        nota: u.textoOriginal,
      };
    });
    const conservaciones = r.congela === true
      ? [{ metodoId: "congelado", duracionDias: 90, nota: r.congelacionNota }]
      : r.congela === false
      ? [{ metodoId: "refrigerado", duracionDias: 3, nota: r.congelacionNota }]
      : [];
    const varianteData = {
      codigo: r.codigo,
      textura: r.texturaObjetivo ?? "",
      porcion: r.rendimiento ? `${r.rendimiento.gramosPorPorcion} g` : "",
      rendimiento: r.rendimiento,
      texturaObjetivo: r.texturaObjetivo,
      tiempoMin: r.tiempoMin,
      ingredientes: ings,
      pasos: r.pasos,
      nutrientes: r.nutrientes,
      conservaciones,
      advertencia: r.advertencia,
      tip: r.tip,
    };
    const inferidos = alergenosPorReceta.get(r.codigo) ?? [];
    const vitaminasDetalle = r.vitaminas.map((v) => ({
      etiquetaId: slugify(v.etiqueta),
      nivel: v.nivel,
      beneficio: v.beneficio,
    }));
    if (existing) {
      existing.variantes[varianteId] = varianteData;
      existing.codigosFuente.push(r.codigo);
      for (const a of inferidos)
        if (!existing.alergenosInferidos.includes(a)) existing.alergenosInferidos.push(a);
      existing.warnings.push(...r.warnings.map((w) => `[${r.codigo}] ${w}`));
      if (!existing.mensaje && r.mensaje) existing.mensaje = r.mensaje;
      // preparacionFresca = true si CUALQUIER variante es fresca (no congela)
      if (r.congela === false) existing.preparacionFresca = true;
    } else {
      mergedByTitle.set(id, {
        id,
        titulo: r.titulo,
        coleccionIds: [COLECCION_ID],
        eje: EJE,
        codigosFuente: [r.codigo],
        tipoComida: r.tipoComida,
        variantes: { [varianteId]: varianteData },
        vitaminas: r.vitaminas.map((v) => v.etiqueta),
        vitaminasDetalle,
        mensaje: r.mensaje,
        alergenosInferidos: inferidos,
        warnings: r.warnings.map((w) => `[${r.codigo}] ${w}`),
        preparacionFresca: r.congela === false,
      });
    }
  }

  const merged = [...mergedByTitle.values()];

  // Menús: mapear títulos de recetas → ids merged con fuzzy match.
  // El grid usa versiones abreviadas ("Mini muffins pollo y espinaca") vs
  // el título completo ("Mini Muffins de Pollo y Espinaca"); resolvemos
  // primero por match exacto normalizado, después por overlap de tokens
  // ignorando stop-words comunes.
  const STOP = new Set([
    "de", "la", "el", "los", "las", "y", "con", "en", "del", "al", "para", "por", "un", "una",
  ]);
  function toks(s: string): Set<string> {
    return new Set(
      norm(s)
        .split(" ")
        .filter((t) => t && !STOP.has(t))
    );
  }
  const titleToId = new Map<string, string>();
  const idToTokens = new Map<string, Set<string>>();
  for (const m of merged) {
    titleToId.set(norm(m.titulo), m.id);
    idToTokens.set(m.id, toks(m.titulo));
  }
  function fuzzyMatch(recetaTitulo: string): { id: string; score: number } | null {
    const exact = titleToId.get(norm(recetaTitulo));
    if (exact) return { id: exact, score: 1 };
    const target = toks(recetaTitulo);
    if (target.size === 0) return null;
    let best: { id: string; score: number } | null = null;
    for (const [id, t] of idToTokens) {
      let overlap = 0;
      for (const x of target) if (t.has(x)) overlap++;
      const score = overlap / Math.max(target.size, t.size);
      if (!best || score > best.score) best = { id, score };
    }
    return best && best.score >= 0.5 ? best : null;
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
    warnings: string[];
  }
  const menusOut: MergedMenu[] = menusParsed.map((m) => {
    const warnings = [...m.warnings];
    const celdas: MergedMenu["celdas"] = [];
    for (const c of m.celdas) {
      const hit = fuzzyMatch(c.recetaTitulo);
      if (!hit) {
        warnings.push(`Celda ${c.dia}/${c.tipoComida}: no matchea receta "${c.recetaTitulo}"`);
        continue;
      }
      if (hit.score < 1) {
        warnings.push(
          `Celda ${c.dia}/${c.tipoComida}: fuzzy match "${c.recetaTitulo}" → ${hit.id} (score ${hit.score.toFixed(2)})`
        );
      }
      celdas.push({ dia: c.dia, tipoComida: c.tipoComida, recetaId: hit.id });
    }
    return {
      id: m.codigo.toLowerCase(),
      codigo: m.codigo,
      etapaId: m.etapaId,
      semana: m.semana,
      coleccionIds: [COLECCION_ID],
      planId: COLECCION_ID,
      celdas,
      listaCompras: m.listaCompras,
      tip: m.tip,
      advertencia: m.advertencia,
      warnings,
    };
  });

  // Guías: solo titular y bloques (ya normalizados)
  const guiasOut = guiasParsed.map((g) => ({
    id: g.codigo.toLowerCase(),
    codigo: g.codigo,
    coleccionId: COLECCION_ID,
    titulo: g.titulo,
    bloques: g.bloques,
  }));

  // Escribir salida
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, "recetas.json"),
    JSON.stringify(merged, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "menus.json"),
    JSON.stringify(menusOut, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "guias.json"),
    JSON.stringify(guiasOut, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "catalogos-propuestos.json"),
    JSON.stringify(
      {
        ingredientes: [...propuestos.values()].map((p) => ({
          nombreOriginal: p.nombreOriginal,
          usadoEn: p.recetas,
          candidatosCercanos: p.candidatos,
          idPropuesto: `⭐${slugify(p.nombreOriginal)}`,
        })),
        alergenos: [...alergenosPropuestos],
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`\nNormalización completa:`);
  console.log(`  recetas parseadas: ${recetasParsed.length}`);
  console.log(`  recetas mergeadas por título: ${merged.length}`);
  console.log(`  menús: ${menusOut.length}`);
  console.log(`  guías: ${guiasOut.length}`);
  console.log(`  ingredientes propuestos: ${propuestos.size}`);
  console.log(`  alérgenos propuestos: ${alergenosPropuestos.size}`);
  console.log(`\nSalida en ${path.relative(ROOT, OUT_DIR)}/`);
  console.log(`  Ejecuta 'npm run import:report' para generar el REPORTE.md.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
