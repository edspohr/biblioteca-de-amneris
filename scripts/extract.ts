import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { stableStringify } from "@/lib/repo/stable-stringify";
import type {
  Alergeno,
  Etapa,
  Ingrediente,
  Menu,
  MenuReceta,
  PorcionTextura,
  Receta,
  RecetaIngrediente,
  Tecnica,
  TipoComida,
} from "@/lib/schema";
import {
  alergenoSchema,
  etapaSchema,
  ingredienteSchema,
  menuSchema,
  porcionTexturaSchema,
  recetaSchema,
  tecnicaSchema,
} from "@/lib/schema";
import { buildPlaceholderVariantes } from "./lib/placeholder-variantes";

// ---------------------------------------------------------------------------
// Types for the intermediate document representation
// ---------------------------------------------------------------------------

interface Para {
  kind: "para";
  text: string;
  imageIds: string[]; // rIds of embedded images in this paragraph
}
interface Table {
  kind: "table";
  rows: string[][]; // each row = array of cell texts
}
type Block = Para | Table;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const DOCX = path.join(ROOT, "docs", "Bocaditos_TODOS_menus_COMPLETO.docx");
const DATA_DIR = path.join(ROOT, "data");
const RECETAS_DIR = path.join(DATA_DIR, "recetas");
const IMAGES_DIR = path.join(ROOT, "public", "images", "recetas");
const REPORT_PATH = path.join(DATA_DIR, "EXTRACCION_REPORTE.md");

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

function children(el: Element, tag: string, ns = W_NS): Element[] {
  return Array.from(el.getElementsByTagNameNS(ns, tag)) as unknown as Element[];
}
function directChildren(el: Element, tag: string, ns = W_NS): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const c = el.childNodes[i] as Element;
    if (c.nodeType === 1 && c.localName === tag && c.namespaceURI === ns) out.push(c);
  }
  return out;
}
function textOf(el: Element): string {
  const parts: string[] = [];
  const ts = children(el, "t");
  for (const t of ts) parts.push(t.textContent ?? "");
  return parts.join("");
}
function paraImages(el: Element): string[] {
  const blips = Array.from(el.getElementsByTagNameNS(A_NS, "blip")) as unknown as Element[];
  const ids: string[] = [];
  for (const b of blips) {
    const embed = b.getAttributeNS(R_NS, "embed");
    if (embed) ids.push(embed);
  }
  return ids;
}

function walkBody(root: Element): Block[] {
  // Recursively walk the tree in document order emitting a flat stream of
  // paragraphs and tables. Nested tables inside table cells are emitted after
  // the enclosing table's row summary — but for the manuscript, each recipe
  // lives inside a container table where the recipe header is itself a
  // paragraph in one of the cells. We flatten: descend into every table cell
  // and continue producing paras + inner tables in order.
  const blocks: Block[] = [];
  visit(root);
  return blocks;

  function visit(node: Element): void {
    for (let i = 0; i < node.childNodes.length; i++) {
      const c = node.childNodes[i] as Element;
      if (c.nodeType !== 1 || c.namespaceURI !== W_NS) continue;
      if (c.localName === "p") {
        blocks.push({
          kind: "para",
          text: normalizeSpaces(textOf(c)),
          imageIds: paraImages(c),
        });
      } else if (c.localName === "tbl") {
        blocks.push({ kind: "table", rows: readTableRows(c) });
        // Also descend into cells to surface nested tables & paragraphs so
        // recipe-header paragraphs living inside a container table become
        // first-class blocks in the stream.
        for (const tr of directChildren(c, "tr")) {
          for (const tc of directChildren(tr, "tc")) {
            visit(tc);
          }
        }
      } else {
        visit(c);
      }
    }
  }
}

function readTableRows(tbl: Element): string[][] {
  const rows: string[][] = [];
  for (const tr of directChildren(tbl, "tr")) {
    const row: string[] = [];
    for (const tc of directChildren(tr, "tc")) {
      // Concatenate every paragraph inside this cell (only direct children,
      // ignoring nested tables so cell text stays clean).
      const cellParas = directChildren(tc, "p");
      const cellText = cellParas.map((p) => normalizeSpaces(textOf(p))).join("\n").trim();
      row.push(cellText);
    }
    if (row.length > 0) rows.push(row);
  }
  return rows;
}

function normalizeSpaces(s: string): string {
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Words that describe how the ingredient is prepared/cut/sized but do not
// change what it *is*. Stripping these lets "Zanahoria mediana",
// "Zanahoria cocida", "Zanahoria en cubos pequeños" all resolve to
// "zanahoria". Do NOT include words that would fuse distinct products
// (rojas/verdes, finos/gruesos, integral vs blanca, etc.).
const PREPARATION_WORDS = new Set([
  "cocida", "cocido", "cocidas", "cocidos",
  "cruda", "crudo", "crudas", "crudos",
  "triturada", "triturado", "trituradas", "triturados",
  "machacada", "machacado", "machacadas", "machacados",
  "rallada", "rallado", "ralladas", "rallados",
  "picada", "picado", "picadas", "picados",
  "pelada", "pelado", "peladas", "pelados",
  "cortada", "cortado", "cortadas", "cortados",
  "mediana", "mediano", "medianas", "medianos",
  "pequena", "pequeno", "pequenas", "pequenos", // NFD-stripped
  "grande", "grandes",
  "madura", "maduro", "maduras", "maduros",
  "fresca", "fresco", "frescas", "frescos",
  "en", "de", "cubos", "cubitos", "puree", "pure", "trozos",
  "unidad", "unidades",
]);

// Compute the canonical form used to group ingredient variants. Keep the
// first two "significant" content words so we can still tell "aceite oliva"
// apart from "aceite coco". Falls back to the full name if that would empty
// out.
function canonicalIngredient(name: string): string {
  const norm = normalizeName(name)
    // drop anything in parentheses ("(opcional)", "(150 g)")
    .replace(/\([^)]*\)/g, "")
    // drop obvious tail modifiers introduced with "y" ("pelada y cortada")
    .replace(/\s+y\s+.*/g, "")
    // drop preparation adjectives following the noun ("zanahoria pequena")
    .split(/\s+/)
    .filter(Boolean);
  const significant = norm.filter((w) => !PREPARATION_WORDS.has(w));
  const kept = significant.length > 0 ? significant.slice(0, 3).join(" ") : norm.join(" ");
  return kept;
}

// ---------------------------------------------------------------------------
// Report accumulator
// ---------------------------------------------------------------------------

class Report {
  counts: Record<string, number> = {};
  incompletas: { id: string; titulo: string; faltantes: string[] }[] = [];
  cantidadesNoParseables: { receta: string; ingrediente: string; texto_original: string }[] = [];
  ingredientesSimilares: { a: string; b: string }[] = [];
  alergenosDetectados: string[] = [];
  tecnicasSinDescripcion: string[] = [];
  menusRecetasNoResueltas: { menu: string; titulo_no_encontrado: string }[] = [];
  ambiguedades: string[] = [];
}
const report = new Report();

// ---------------------------------------------------------------------------
// Etapas — hardcoded canonical set (derived from manuscript's own headers)
// ---------------------------------------------------------------------------

const ETAPAS: Etapa[] = [
  {
    id: "etapa-1",
    nombre: "Etapa 1 · Primeros Sabores",
    textura: "Papilla lisa sin trozos",
    rango_edad: "6 a 9 meses",
    orden: 1,
    paleta: { primary: "#B8E0C8", accent: "#7FBFA0", soft: "#EAF7EF", ink: "#2F5D46" },
    descripcion: "Introducción a la alimentación complementaria con purés lisos.",
  },
  {
    id: "etapa-2",
    nombre: "Etapa 2 · Explorando Texturas",
    textura: "Papilla con textura y pequeños trozos",
    rango_edad: "10 a 11 meses",
    orden: 2,
    paleta: { primary: "#FDD0B1", accent: "#F5A97A", soft: "#FFF1E6", ink: "#7A4321" },
    descripcion: "Introducción gradual de texturas y trozos blandos.",
  },
  {
    id: "etapa-3",
    nombre: "Etapa 3 · Compartiendo la Mesa",
    textura: "Trozos blandos, comidas de la familia adaptadas",
    rango_edad: "12 a 24 meses",
    orden: 3,
    paleta: { primary: "#D6C6EC", accent: "#A98BD1", soft: "#F1EBFA", ink: "#4A3771" },
    descripcion: "El bebé come lo mismo que la familia, adaptado.",
  },
];

// Used only to group menus by etapa (menu headers in the manuscript announce
// "Etapa N" or an age range). Recipes no longer carry an etapa_id.
function detectEtapa(text: string): string | null {
  const m = text.match(/etapa\s*([123])/i);
  if (m) return `etapa-${m[1]}`;
  if (/6\s*a\s*9\s*meses/i.test(text)) return "etapa-1";
  if (/10\s*a\s*11\s*meses/i.test(text)) return "etapa-2";
  if (/9\s*a\s*1[12]\s*meses/i.test(text)) return "etapa-2";
  if (/1[12]\s*a\s*24\s*meses/i.test(text)) return "etapa-3";
  return null;
}

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

class IngredienteCatalog {
  // Keyed by canonical form (e.g. "zanahoria" for every variant of it)
  byCanonical = new Map<string, Ingrediente>();
  // Track every raw variant we've seen -> canonical id so we can report fusions
  variantsByCanonical = new Map<string, Set<string>>();
  all: Ingrediente[] = [];

  ensure(nombre: string, categoria: string): Ingrediente {
    const cleaned = nombre.trim();
    const canonical = canonicalIngredient(cleaned);
    const key = canonical || normalizeName(cleaned);

    const existing = this.byCanonical.get(key);
    if (existing) {
      const set = this.variantsByCanonical.get(key)!;
      if (!set.has(cleaned)) set.add(cleaned);
      // Upgrade the category if we had a fallback and now have a real one
      if (existing.categoria === "Otros" && categoria !== "Otros") {
        existing.categoria = categoria;
      }
      return existing;
    }

    // Display name: prefer the canonical (short) form title-cased.
    const displayName = titleCase(key);
    const ing: Ingrediente = {
      id: slugify(displayName),
      nombre: displayName,
      categoria,
    };
    this.byCanonical.set(key, ing);
    this.variantsByCanonical.set(key, new Set([cleaned]));
    this.all.push(ing);
    return ing;
  }

  reportFusions(): void {
    for (const [, variants] of this.variantsByCanonical) {
      if (variants.size > 1) {
        report.ingredientesSimilares.push({
          a: [...variants].join(" · "),
          b: "(fusionados en un único ingrediente)",
        });
      }
    }
  }
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

class AlergenoCatalog {
  byNorm = new Map<string, Alergeno>();
  all: Alergeno[] = [];

  ensure(nombre: string): Alergeno | null {
    const cleaned = nombre.trim().replace(/^[⚠️\s]+/, "");
    if (!cleaned) return null;
    const norm = normalizeName(cleaned);
    const existing = this.byNorm.get(norm);
    if (existing) return existing;
    const id = slugify(cleaned);
    if (!id) return null;
    const a: Alergeno = { id, nombre: cleaned };
    this.byNorm.set(norm, a);
    this.all.push(a);
    report.alergenosDetectados.push(cleaned);
    return a;
  }
}

class TecnicaCatalog {
  byNorm = new Map<string, Tecnica>();
  all: Tecnica[] = [];

  ensure(nombre: string): Tecnica {
    const cleaned = nombre.trim();
    const norm = normalizeName(cleaned);
    const existing = this.byNorm.get(norm);
    if (existing) return existing;
    const id = slugify(cleaned);
    const t: Tecnica = { id, nombre: cleaned, descripcion: null, seccion_origen: "Sección 2" };
    this.byNorm.set(norm, t);
    this.all.push(t);
    return t;
  }
}

// ---------------------------------------------------------------------------
// Quantity parser
// ---------------------------------------------------------------------------

const UNI_FRAC: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
};

function parseQuantity(raw: string): { cantidad: number | null; unidad: string | null; nota: string | null } {
  const original = raw.trim();
  if (!original) return { cantidad: null, unidad: null, nota: null };

  // capture optional trailing note in parentheses
  let base = original;
  let nota: string | null = null;
  const parenMatch = base.match(/\(([^)]*)\)\s*$/);
  if (parenMatch) {
    nota = parenMatch[1].trim();
    base = base.slice(0, parenMatch.index).trim();
  }

  // e.g. "60 g", "1 unidad", "120 ml", "1 cucharada", "½ taza", "1/2 taza", "1-2 cdas"
  const m = base.match(/^([\d]+(?:[.,]\d+)?|[½¼¾⅓⅔]|\d+\/\d+)\s*([^\d]*)$/);
  if (!m) {
    return { cantidad: null, unidad: null, nota: nota ?? original };
  }
  const numRaw = m[1];
  const rest = m[2].trim() || null;
  let cantidad: number | null = null;
  if (UNI_FRAC[numRaw] != null) cantidad = UNI_FRAC[numRaw];
  else if (numRaw.includes("/")) {
    const [a, b] = numRaw.split("/").map(Number);
    if (b) cantidad = a / b;
  } else {
    cantidad = parseFloat(numRaw.replace(",", "."));
  }
  return { cantidad: Number.isFinite(cantidad ?? NaN) ? cantidad : null, unidad: rest, nota };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("→ Cargando .docx…");
  const buf = await fs.readFile(DOCX);
  const zip = await JSZip.loadAsync(buf);

  const documentXml = await zip.file("word/document.xml")!.async("string");
  const relsXml = await zip.file("word/_rels/document.xml.rels")!.async("string");
  const relMap = parseRels(relsXml);

  console.log("→ Parseando XML…");
  const doc = new DOMParser({
    onError: () => {},
  }).parseFromString(documentXml, "text/xml");
  const body = doc.getElementsByTagNameNS(W_NS, "body")[0] as unknown as Element;
  const blocks = walkBody(body);
  console.log(`  ${blocks.length} bloques (párrafos + tablas)`);

  console.log("→ Preparando directorios…");
  await backupAndReset();

  const ingredientes = new IngredienteCatalog();
  const alergenos = new AlergenoCatalog();
  const tecnicas = new TecnicaCatalog();
  const porciones: PorcionTextura[] = [];

  // Seed 14 mandatory allergens from the manuscript's own table (lines 375+ in preview)
  for (const name of [
    "Lácteos",
    "Huevo",
    "Pescado",
    "Crustáceos",
    "Moluscos",
    "Gluten",
    "Cacahuetes",
    "Frutos secos",
    "Soja",
    "Sésamo",
    "Mostaza",
    "Apio",
    "Altramuces",
    "Dióxido de azufre",
  ]) {
    alergenos.ensure(name);
  }

  console.log("→ Segmentando recetas…");
  const recetaSegments = segmentRecipes(blocks);
  console.log(`  ${recetaSegments.length} recetas detectadas`);

  console.log("→ Parseando ingredientes por categoría desde las listas de compras…");
  const categoriaByIngrediente = extractCategoriesFromShoppingLists(blocks);

  console.log("→ Extrayendo imágenes referenciadas…");
  const imageMap = await extractImages(zip, relMap);

  console.log("→ Parseando recetas…");
  const recetas: Receta[] = [];
  const usedSlugs = new Set<string>();
  const seenPortionEtapas = new Set<string>();
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  // Placeholder variantes are seeded from the manuscript's general portions
  // table (captured lazily below on the first recipe that carries the chart).
  // Until then, we start with a "por definir" scaffold that the authoring UI
  // can fill in per recipe.
  let placeholderVariantes: Receta["variantes"] = buildPlaceholderVariantes([]);
  for (const seg of recetaSegments) {
    try {
      const result = await parseRecipe(seg, {
        ingredientes,
        alergenos,
        tecnicas,
        porciones,
        categoriaByIngrediente,
        imageMap,
        placeholderVariantes,
      });
      if (!result) continue;
      const { receta, imageBuf } = result;
      if (usedSlugs.has(receta.id)) {
        const originalId = receta.id;
        let suffix = 2;
        while (usedSlugs.has(`${originalId}-${suffix}`)) suffix++;
        receta.id = `${originalId}-${suffix}`;
        report.ambiguedades.push(
          `Título duplicado en el manuscrito: "${receta.titulo}" (receta ${receta.numero}) — se guardó como "${receta.id}" para evitar sobreescribir a "${originalId}".`
        );
      }
      usedSlugs.add(receta.id);
      if (imageBuf) {
        const ext = detectImageExt(imageBuf);
        const outPath = path.join(IMAGES_DIR, `${receta.id}.${ext}`);
        await fs.writeFile(outPath, imageBuf);
        receta.foto = `/images/recetas/${receta.id}.${ext}`;
      }
      recetas.push(receta);
      extractPorcionesFromRecipe(seg.blocks, porciones, seenPortionEtapas);
      if (porciones.length && placeholderVariantes["etapa-1"].textura === "Por definir") {
        placeholderVariantes = buildPlaceholderVariantes(porciones);
        for (const r of recetas) r.variantes = placeholderVariantes;
      }
    } catch (e: unknown) {
      report.ambiguedades.push(
        `Receta en bloque ${seg.startIndex}: ${(e as Error).message}`
      );
    }
  }

  console.log("→ Parseando menús…");
  const menus = parseMenus(blocks, recetas);

  ingredientes.reportFusions();

  console.log("→ Escribiendo dataset…");
  await writeDataset({
    etapas: ETAPAS,
    ingredientes: ingredientes.all,
    alergenos: alergenos.all,
    tecnicas: tecnicas.all,
    recetas,
    menus,
    porciones,
  });

  console.log("→ Escribiendo reporte…");
  await writeReport({
    etapas: ETAPAS.length,
    ingredientes: ingredientes.all.length,
    alergenos: alergenos.all.length,
    tecnicas: tecnicas.all.length,
    recetas: recetas.length,
    menus: menus.length,
    porciones: porciones.length,
  });

  console.log("\n✓ Extracción completada.");
  console.log(`  Ver reporte: ${path.relative(ROOT, REPORT_PATH)}`);
}

// ---------------------------------------------------------------------------
// Rels + images
// ---------------------------------------------------------------------------

function parseRels(xml: string): Map<string, string> {
  const doc = new DOMParser({ onError: () => {} }).parseFromString(xml, "text/xml");
  const map = new Map<string, string>();
  const rels = doc.getElementsByTagName("Relationship");
  for (let i = 0; i < rels.length; i++) {
    const r = rels[i] as unknown as Element;
    const id = r.getAttribute("Id");
    const target = r.getAttribute("Target");
    if (id && target) map.set(id, target);
  }
  return map;
}

async function extractImages(
  zip: JSZip,
  relMap: Map<string, string>
): Promise<Map<string, Buffer>> {
  const out = new Map<string, Buffer>();
  for (const [id, target] of relMap.entries()) {
    if (!target.startsWith("media/")) continue;
    const filePath = `word/${target}`;
    const file = zip.file(filePath);
    if (!file) continue;
    out.set(id, Buffer.from(await file.async("nodebuffer")));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Segment recipes
// ---------------------------------------------------------------------------

const RECIPE_HEADER = /^(DESAYUNO|ALMUERZO|MERIENDA|CENA|COLACI[ÓO]N)\s*·\s*Receta\s+(\d+)$/i;

interface RecipeSegment {
  meal: TipoComida;
  numero: number;
  startIndex: number;
  etapaFromContext: string | null;
  blocks: Block[];
}

const ETAPA_HEADER = /^\s*Etapa\s*([123])\s*·\s*(\d+)\s*a\s*(\d+)\s*meses/i;

function segmentRecipes(all: Block[]): RecipeSegment[] {
  const segs: RecipeSegment[] = [];
  let current: RecipeSegment | null = null;
  let contextEtapa: string | null = null;
  for (let i = 0; i < all.length; i++) {
    const b = all[i];
    if (b.kind === "para") {
      const em = b.text.match(ETAPA_HEADER);
      if (em) contextEtapa = `etapa-${em[1]}`;
      const m = b.text.match(RECIPE_HEADER);
      if (m) {
        if (current) segs.push(current);
        current = {
          meal: mealFromLabel(m[1]),
          numero: parseInt(m[2], 10),
          startIndex: i,
          etapaFromContext: contextEtapa,
          blocks: [],
        };
        continue;
      }
    }
    if (current) current.blocks.push(b);
  }
  if (current) segs.push(current);
  return segs;
}

function mealFromLabel(s: string): TipoComida {
  const n = s.toLowerCase();
  if (n.startsWith("desayuno")) return "desayuno";
  if (n.startsWith("almuerzo")) return "almuerzo";
  if (n.startsWith("cena")) return "cena";
  if (n.startsWith("merienda")) return "merienda";
  return "colacion";
}

// ---------------------------------------------------------------------------
// Parse one recipe
// ---------------------------------------------------------------------------

interface ParseCtx {
  ingredientes: IngredienteCatalog;
  alergenos: AlergenoCatalog;
  tecnicas: TecnicaCatalog;
  porciones: PorcionTextura[];
  categoriaByIngrediente: Map<string, string>;
  imageMap: Map<string, Buffer>;
  placeholderVariantes: Receta["variantes"];
}

const TIME_RE = /Tiempo de preparaci[óo]n:\s*(\d+)\s*min/i;
const KCAL_RE = /(\d+(?:[.,]\d+)?)\s*kcal\s*\/\s*100\s*g/i;
const CONSERV_RE = /Conservaci[óo]n:\s*(.+?)(?:$|⚠|⏱)/i;
const ALERG_RE = /Al[ée]rgenos:\s*(.+?)(?:$|⏱|Conservaci)/i;
const FREEZE_RE = /Congelar:\s*(S[ií]|No)/i;
const TECNICA_INLINE_RE = /📖\s*([^→]+?)\s*→\s*Secc\.?\s*\d+/gi;
const REF_MARK_RE = /📖\s*[^→]+?→\s*Secc\.?\s*\d+/gi;

async function parseRecipe(
  seg: RecipeSegment,
  ctx: ParseCtx
): Promise<{ receta: Receta; imageBuf: Buffer | null } | null> {
  const blocks = seg.blocks;
  const faltantes: string[] = [];

  // Title: first non-empty paragraph after the marker
  let titulo: string | null = null;
  let firstParaIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind === "para" && b.text) {
      titulo = b.text;
      firstParaIdx = i;
      break;
    }
  }
  if (!titulo) return null;

  const id = slugify(titulo);

  // Locate first image; actual write happens after slug dedup in the main loop.
  let firstImageBuf: Buffer | null = null;
  for (const b of blocks) {
    if (b.kind !== "para") continue;
    if (b.imageIds.length === 0) continue;
    const rId = b.imageIds[0];
    const buf = ctx.imageMap.get(rId);
    if (buf) {
      firstImageBuf = buf;
      break;
    }
  }
  const foto: string | null = null;

  let minutos_prep: number | null = null;
  for (const b of blocks) {
    if (b.kind !== "para") continue;
    const tm = b.text.match(TIME_RE);
    if (tm && minutos_prep == null) minutos_prep = parseInt(tm[1], 10);
  }
  if (!minutos_prep) faltantes.push("minutos_prep");

  // Locate main recipe table: the first table with headers matching N°/INGREDIENTE/CANTIDAD/PASO
  let mainTable: Table | null = null;
  let mainTableIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind !== "table") continue;
    const hdr = b.rows[0]?.map((c) => c.toLowerCase()) ?? [];
    if (hdr.some((c) => c.includes("ingrediente")) && hdr.some((c) => c.includes("preparaci"))) {
      mainTable = b;
      mainTableIdx = i;
      break;
    }
  }

  const receta_ingredientes: RecetaIngrediente[] = [];
  const pasos: string[] = [];
  const receta_tecnicas: { tecnica_id: string }[] = [];
  const vitaminas: string[] = [];
  const receta_alergenos: { alergeno_id: string }[] = [];
  const seenAlerg = new Set<string>();
  let kcal_100g: number | null = null;
  let notas: string | null = null;
  let congelable: boolean | null = null;
  let conservacion: string | null = null;

  if (mainTable) {
    const headers = mainTable.rows[0].map((c) => c.toLowerCase().trim());
    const colIngr = headers.findIndex((h) => h.includes("ingrediente"));
    const colCant = headers.findIndex((h) => h.includes("cantidad"));
    const colPrep = headers.findIndex((h) => h.includes("preparaci"));

    const seenTecnicas = new Set<string>();
    const stepByNumber = new Map<number, string>();

    for (let r = 1; r < mainTable.rows.length; r++) {
      const row = mainTable.rows[r];
      const ingrCell = colIngr >= 0 ? row[colIngr]?.trim() ?? "" : "";
      const cantCell = colCant >= 0 ? row[colCant]?.trim() ?? "" : "";
      const prepCell = colPrep >= 0 ? row[colPrep]?.trim() ?? "" : "";
      const numCell = row[0]?.trim() ?? "";
      const rowJoined = row.join(" ");

      // Detect the "footer row" that fuses Congelar/Conservación/Alérgenos.
      // It contains 🧊 and ⚠️ markers and never has a plain N° in col 0.
      if (rowJoined.includes("🧊") || /Conservaci[óo]n:/i.test(rowJoined) || /Al[ée]rgenos:/i.test(rowJoined)) {
        // Congelar
        const fm = rowJoined.match(FREEZE_RE);
        if (fm && congelable == null) congelable = /s[ií]/i.test(fm[1]);
        // Conservación — take the LAST "Conservación:" occurrence to skip the collision prefix
        const consMatches = [...rowJoined.matchAll(/Conservaci[óo]n:\s*([^⚠]+?)(?=$|⚠|🧊)/gi)];
        if (consMatches.length && !conservacion) {
          const val = consMatches[consMatches.length - 1][1].trim();
          if (val && !/^🧊/.test(val)) conservacion = val;
        }
        // Alérgenos — text after the LAST "Alérgenos:" until ⏱ or end
        const alergMatches = [...rowJoined.matchAll(/Al[ée]rgenos:\s*([^⏱]+?)(?=$|⏱|Conservaci)/gi)];
        if (alergMatches.length) {
          const val = alergMatches[alergMatches.length - 1][1].trim();
          if (val && !/ninguno|conservaci/i.test(val)) {
            for (const name of val.split(/[,·]/).map((s) => s.trim()).filter(Boolean)) {
              const a = ctx.alergenos.ensure(name);
              if (a && !seenAlerg.has(a.id)) {
                seenAlerg.add(a.id);
                receta_alergenos.push({ alergeno_id: a.id });
              }
            }
          }
        }
        continue;
      }

      // Metadata rows within the table body (Calorías / Vitaminas / Beneficio)
      if (/calor[ií]as/i.test(ingrCell)) {
        const km = cantCell.match(KCAL_RE);
        if (km) kcal_100g = parseFloat(km[1].replace(",", "."));
      } else if (/vitaminas/i.test(ingrCell)) {
        vitaminas.push(
          ...cantCell.split(/[,·]/).map((v) => v.trim()).filter(Boolean)
        );
      } else if (/beneficio/i.test(ingrCell)) {
        notas = [notas, cantCell].filter(Boolean).join(" · ");
      } else if (ingrCell && isPlausibleIngredient(ingrCell)) {
        const categoria = ctx.categoriaByIngrediente.get(normalizeName(ingrCell)) ?? "Otros";
        const ing = ctx.ingredientes.ensure(ingrCell, categoria);
        const q = parseQuantity(cantCell);
        if (cantCell && q.cantidad == null && q.unidad == null) {
          report.cantidadesNoParseables.push({
            receta: titulo,
            ingrediente: ingrCell,
            texto_original: cantCell,
          });
        }
        receta_ingredientes.push({
          ingrediente_id: ing.id,
          cantidad: q.cantidad,
          unidad: q.unidad,
          nota: q.nota,
        });
      }

      // Steps: only accept prep cells attached to numeric step positions to
      // avoid picking up prep text on metadata rows out of order.
      if (prepCell) {
        const clean = prepCell.replace(REF_MARK_RE, "").replace(/\s+/g, " ").trim();
        const stepNum = parseInt(numCell, 10);
        if (Number.isFinite(stepNum) && clean) {
          stepByNumber.set(stepNum, clean);
        } else if (clean) {
          // Fall back to source-order insertion when no step number is available.
          stepByNumber.set(stepByNumber.size + 1, clean);
        }
        for (const m of prepCell.matchAll(TECNICA_INLINE_RE)) {
          const rawTerms = m[1].split(/[·/]/).map((s) => s.trim()).filter(Boolean);
          for (const term of rawTerms) {
            const t = ctx.tecnicas.ensure(term);
            if (!seenTecnicas.has(t.id)) {
              seenTecnicas.add(t.id);
              receta_tecnicas.push({ tecnica_id: t.id });
            }
          }
        }
      }
    }

    for (const [, step] of [...stepByNumber.entries()].sort((a, b) => a[0] - b[0])) {
      pasos.push(step);
    }
  } else {
    faltantes.push("tabla_principal");
  }

  if (kcal_100g == null) faltantes.push("kcal_100g");
  if (congelable == null) faltantes.push("congelable");
  if (!conservacion) faltantes.push("conservacion");
  if (pasos.length === 0) faltantes.push("pasos");

  if (faltantes.length) {
    report.incompletas.push({ id, titulo, faltantes });
  }

  const receta: Receta = {
    id,
    numero: seg.numero,
    titulo,
    variantes: ctx.placeholderVariantes,
    tipo_comida: seg.meal,
    minutos_prep,
    kcal_100g,
    vitaminas,
    congelable,
    conservacion,
    pasos,
    notas,
    foto,
    receta_ingredientes,
    receta_alergenos,
    receta_tecnicas,
  };

  // Validate; if invalid, rescue what we can and report
  const parsed = recetaSchema.safeParse(receta);
  if (!parsed.success) {
    report.ambiguedades.push(
      `Receta "${titulo}" no pasó validación: ${parsed.error.errors.map((e) => `${e.path.join(".")}=${e.message}`).join("; ")}`
    );
  }
  return { receta, imageBuf: firstImageBuf };
}

function isPlausibleIngredient(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 2) return false;
  if (/^[⏱🧊⚠️]/.test(t)) return false;
  if (/^Conservaci[óo]n:/i.test(t)) return false;
  if (/^Al[ée]rgenos:/i.test(t)) return false;
  if (/^Congelar:/i.test(t)) return false;
  if (/^N°$/.test(t)) return false;
  return true;
}

function detectImageExt(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf.slice(0, 4).toString("ascii") === "GIF8") return "gif";
  return "jpg";
}

// ---------------------------------------------------------------------------
// Shopping list category scraper
// ---------------------------------------------------------------------------

const CATEGORY_HEADERS: Record<string, string> = {
  "🥩": "Proteínas",
  "🥦": "Vegetales y Granos",
  "🌾": "Carbohidratos",
  "🍎": "Frutas",
  "🌿": "Hierbas y Especias",
  "🥛": "Lácteos",
};

function extractCategoriesFromShoppingLists(all: Block[]): Map<string, string> {
  const out = new Map<string, string>();
  let currentCat: string | null = null;
  for (const b of all) {
    if (b.kind !== "para") continue;
    const t = b.text;
    for (const [emoji, cat] of Object.entries(CATEGORY_HEADERS)) {
      if (t.startsWith(emoji)) {
        currentCat = cat;
        break;
      }
    }
    if (!currentCat) continue;
    // Ingredient lines follow "☐" checkbox; the very next non-check line is the name
    if (t === "☐" || /^\s*☐\s*/.test(t)) continue;
    // Heuristic: capture short capitalized-ish phrases (ingredient names in shopping lists)
    if (t && t.length < 60 && !/^\d/.test(t) && !/kcal|Semana|Menú/i.test(t)) {
      const norm = normalizeName(t);
      if (!out.has(norm)) out.set(norm, currentCat);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

// The manuscript prints the SAME 3-age reference chart under every recipe
// regardless of etapa. We capture it once and register it under all 3 etapas
// so each etapa view can display the full reference table.
function extractPorcionesFromRecipe(
  blocks: Block[],
  out: PorcionTextura[],
  alreadyCaptured: Set<string>
): void {
  if (alreadyCaptured.has("__done__")) return;
  for (const b of blocks) {
    if (b.kind !== "table") continue;
    const first = b.rows[0]?.map((c) => c.toLowerCase().trim()) ?? [];
    const isPortion = first.some((c) => c.startsWith("rango de edad"));
    if (!isPortion) continue;
    const ages = b.rows[0].slice(1);
    const porcionRow = b.rows.find((r) => /porci[óo]n/i.test(r[0] ?? "")) ?? [];
    const texturaRow = b.rows.find((r) => /textura/i.test(r[0] ?? "")) ?? [];
    for (const etapa of ["etapa-1", "etapa-2", "etapa-3"]) {
      for (let i = 0; i < ages.length; i++) {
        const rango = ages[i]?.trim();
        const porcion = porcionRow[i + 1]?.trim() ?? "";
        const textura = texturaRow[i + 1]?.trim() ?? "";
        if (!rango || !porcion || !textura) continue;
        out.push({ etapa_id: etapa, rango_edad: rango, porcion, textura });
      }
    }
    alreadyCaptured.add("__done__");
    return;
  }
}

function parseMenus(all: Block[], recetas: Receta[]): Menu[] {
  const menus: Menu[] = [];
  const recetaByTitulo = new Map<string, Receta>();
  for (const r of recetas) recetaByTitulo.set(normalizeName(r.titulo), r);
  const recetaEntries = recetas.map((r) => ({ norm: normalizeName(r.titulo), r }));

  // Fuzzy match: menu titles are usually shorter versions of recipe titles.
  // Returns a receta iff exactly one candidate matches by prefix (either way).
  function resolveByPrefix(needle: string): Receta | null {
    const candidates = recetaEntries.filter(
      ({ norm }) => norm.startsWith(needle) || needle.startsWith(norm)
    );
    if (candidates.length === 1) return candidates[0].r;
    return null;
  }

  let currentEtapa: string | null = null;
  let currentMenuName: string | null = null;
  let semanaCounter = 0;

  for (let i = 0; i < all.length; i++) {
    const b = all[i];
    if (b.kind === "para") {
      const e = detectEtapa(b.text);
      if (e && /Etapa/i.test(b.text)) currentEtapa = e;
      if (/^Semana\s+\d+/i.test(b.text)) {
        currentMenuName = b.text;
      }
      continue;
    }
    // A menu table has headers like Día, Desayuno, Almuerzo, Cena, Merienda
    const headerRow = b.rows[0]?.map((c) => c.toLowerCase()) ?? [];
    const isMenu =
      headerRow.some((c) => c.includes("desayuno")) &&
      headerRow.some((c) => c.includes("almuerzo"));
    if (!isMenu) continue;
    if (!currentEtapa) continue;
    semanaCounter++;
    const name = currentMenuName ?? `Semana ${semanaCounter}`;
    const menuId = slugify(`${currentEtapa}-${name}-${semanaCounter}`);
    const momentos: TipoComida[] = [];
    for (let c = 1; c < b.rows[0].length; c++) {
      momentos.push(mealFromLabel(b.rows[0][c]));
    }
    const menu_recetas: MenuReceta[] = [];
    for (let r = 1; r < b.rows.length; r++) {
      const row = b.rows[r];
      const dia = row[0]?.trim() || null;
      for (let c = 1; c < row.length; c++) {
        const cell = row[c] ?? "";
        // Cell may contain title + page like "Papilla ...\np. 74". Split & take first line.
        const [titulo] = cell.split(/\n|p\.\s*\d+/);
        const cleaned = titulo?.trim();
        if (!cleaned) continue;
        const needle = normalizeName(cleaned);
        const r_ = recetaByTitulo.get(needle) ?? resolveByPrefix(needle);
        if (r_) {
          menu_recetas.push({ receta_id: r_.id, momento: momentos[c - 1], dia });
        } else {
          report.menusRecetasNoResueltas.push({
            menu: menuId,
            titulo_no_encontrado: cleaned,
          });
        }
      }
    }
    menus.push({
      id: menuId,
      etapa_id: currentEtapa,
      nombre: name,
      dia: null,
      menu_recetas,
    });
    currentMenuName = null;
  }

  return menus;
}

// ---------------------------------------------------------------------------
// Backup + write
// ---------------------------------------------------------------------------

async function backupAndReset(): Promise<void> {
  // Remove any existing per-recipe JSON so deleted recipes don't linger. Keep
  // it simple: rely on git for history rather than in-tree backups.
  try {
    const entries = await fs.readdir(RECETAS_DIR);
    for (const f of entries) {
      if (f.endsWith(".json")) await fs.unlink(path.join(RECETAS_DIR, f));
    }
  } catch {
    // recetas dir may not exist yet
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(RECETAS_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });
}

interface Dataset {
  etapas: Etapa[];
  ingredientes: Ingrediente[];
  alergenos: Alergeno[];
  tecnicas: Tecnica[];
  recetas: Receta[];
  menus: Menu[];
  porciones: PorcionTextura[];
}

async function writeDataset(ds: Dataset): Promise<void> {
  // Validate every entity with zod; failures go to the report but do not block writing.
  const validated = {
    etapas: ds.etapas.map((e) => etapaSchema.parse(e)),
    ingredientes: ds.ingredientes
      .map((i) => safeParseWithReport(ingredienteSchema, i, `ingrediente ${i.id}`))
      .filter(Boolean) as Ingrediente[],
    alergenos: ds.alergenos
      .map((a) => safeParseWithReport(alergenoSchema, a, `alergeno ${a.id}`))
      .filter(Boolean) as Alergeno[],
    tecnicas: ds.tecnicas
      .map((t) => safeParseWithReport(tecnicaSchema, t, `tecnica ${t.id}`))
      .filter(Boolean) as Tecnica[],
    menus: ds.menus
      .map((m) => safeParseWithReport(menuSchema, m, `menu ${m.id}`))
      .filter(Boolean) as Menu[],
    porciones: ds.porciones
      .map((p) => safeParseWithReport(porcionTexturaSchema, p, `porcion ${p.etapa_id}`))
      .filter(Boolean) as PorcionTextura[],
  };

  const sortById = <T extends { id: string }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => a.id.localeCompare(b.id));

  await write(path.join(DATA_DIR, "etapas.json"), sortById(validated.etapas));
  await write(path.join(DATA_DIR, "ingredientes.json"), sortById(validated.ingredientes));
  await write(path.join(DATA_DIR, "alergenos.json"), sortById(validated.alergenos));
  await write(path.join(DATA_DIR, "tecnicas.json"), sortById(validated.tecnicas));
  await write(path.join(DATA_DIR, "menus.json"), sortById(validated.menus));
  await write(path.join(DATA_DIR, "porciones-texturas.json"), validated.porciones);

  for (const r of ds.recetas) {
    const parsed = recetaSchema.safeParse(r);
    if (!parsed.success) {
      report.ambiguedades.push(
        `Receta "${r.titulo}" descartada por validación: ${parsed.error.errors.map((e) => e.message).join("; ")}`
      );
      continue;
    }
    await write(path.join(RECETAS_DIR, `${r.id}.json`), parsed.data);
  }
}

function safeParseWithReport<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { errors: { message: string }[] } } },
  v: unknown,
  label: string
): T | null {
  const p = schema.safeParse(v);
  if (p.success) return p.data as T;
  report.ambiguedades.push(
    `${label}: ${p.error?.errors.map((e) => e.message).join("; ") ?? "inválido"}`
  );
  return null;
}

async function write(file: string, data: unknown): Promise<void> {
  await fs.writeFile(file, stableStringify(data) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

async function writeReport(counts: Record<string, number>): Promise<void> {
  const lines: string[] = [];
  lines.push("# Reporte de extracción — Bocaditos del Corazón");
  lines.push("");
  lines.push(`_Generado: ${new Date().toISOString()}_`);
  lines.push("");
  lines.push("## Conteos por entidad");
  lines.push("");
  for (const [k, v] of Object.entries(counts)) lines.push(`- **${k}**: ${v}`);
  lines.push("");

  lines.push("## Recetas con campos faltantes o no parseables");
  lines.push("");
  if (report.incompletas.length === 0) {
    lines.push("_Ninguna. Todas las recetas tienen todos los campos._");
  } else {
    for (const r of report.incompletas) {
      lines.push(`- **${r.titulo}** (\`${r.id}\`): faltan ${r.faltantes.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("## Cantidades no parseables");
  lines.push("");
  if (report.cantidadesNoParseables.length === 0) {
    lines.push("_Ninguna._");
  } else {
    for (const c of report.cantidadesNoParseables) {
      lines.push(
        `- Receta **${c.receta}** · ingrediente **${c.ingrediente}** → texto original: \`${c.texto_original}\``
      );
    }
  }
  lines.push("");

  lines.push("## Ingredientes candidatos a duplicados o variantes ortográficas");
  lines.push("");
  if (report.ingredientesSimilares.length === 0) {
    lines.push("_Ninguno detectado con la heurística actual._");
  } else {
    const seen = new Set<string>();
    for (const p of report.ingredientesSimilares) {
      const key = [p.a, p.b].sort().join("↔");
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`- **${p.a}** ↔ **${p.b}** (revisar si son el mismo ingrediente)`);
    }
  }
  lines.push("");

  lines.push("## Alérgenos detectados (lista controlada)");
  lines.push("");
  const uniqAlerg = Array.from(new Set(report.alergenosDetectados));
  if (uniqAlerg.length === 0) lines.push("_Ninguno._");
  else for (const a of uniqAlerg.sort()) lines.push(`- ${a}`);
  lines.push("");

  lines.push("## Menús: recetas referenciadas no encontradas");
  lines.push("");
  if (report.menusRecetasNoResueltas.length === 0) {
    lines.push("_Todas las recetas de los menús se resolvieron._");
  } else {
    const seen = new Set<string>();
    for (const r of report.menusRecetasNoResueltas) {
      const key = `${r.menu}|${r.titulo_no_encontrado}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`- Menú **${r.menu}** → título no encontrado: **${r.titulo_no_encontrado}**`);
    }
  }
  lines.push("");

  lines.push("## Nota sobre técnicas (TECNICA)");
  lines.push("");
  lines.push(
    "El manuscrito anuncia una Sección 2 (\"Diccionario de Cocina\") pero **no incluye las definiciones de términos** en el texto — solo los referencia. Por eso el catálogo TECNICA se construyó a partir de los marcadores `📖 Término → Secc. 2` presentes dentro de los pasos de las recetas. Cada técnica quedó con `descripcion: null`. Amneris puede completar las descripciones desde la interfaz de autoría (fase 3)."
  );
  lines.push("");

  lines.push("## Ambigüedades y decisiones automáticas");
  lines.push("");
  if (report.ambiguedades.length === 0) {
    lines.push("_Ninguna._");
  } else {
    for (const a of report.ambiguedades) lines.push(`- ${a}`);
  }
  lines.push("");

  await fs.writeFile(REPORT_PATH, lines.join("\n"), "utf8");
}

// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
