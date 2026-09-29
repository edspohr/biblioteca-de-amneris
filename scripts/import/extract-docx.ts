/**
 * Fase 2 — Paso 1: extraer el docx "Cocina en un Día" a un stream de bloques
 * en JSON. Sin nuevas dependencias (jszip + @xmldom/xmldom, ambos ya en
 * devDependencies para el extract.ts original).
 *
 * Salida:
 *   data/import/reserva-pollo/raw/blocks.json        (Block[] completo)
 *   data/import/reserva-pollo/raw/split/<code>.json  (Block[] por cada
 *       sección: E1-P1-R1, E1-P1-S1, B3-P1, etc.)
 *   data/import/reserva-pollo/raw/split/_pre.json    (todo lo previo al
 *       primer código — carta de intro, portada)
 *
 * Uso:
 *   npm run import:extract
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";

const ROOT = process.cwd();
const DOCX = path.join(ROOT, "docs", "Cocina_en_un_Dia_Bebe_Amneris.docx");
const OUT_DIR = path.join(ROOT, "data", "import", "reserva-pollo", "raw");
const SPLIT_DIR = path.join(OUT_DIR, "split");

// Matches recipe (R), menu (S) and technical guide (B3-P) block codes.
// Recipe codes are preceded by the meal type in caps (DESAYUNO, ALMUERZO,
// CENA) so we can't anchor to ^; menu codes appear on their own line;
// guide codes on their own line too. We match anywhere in the paragraph.
// Case-insensitive to be defensive against copy-paste variations.
const CODE_RE = /\b(E\d-[PH]\d-[RS]\d|B3-P\d)\b/i;

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

interface Para {
  kind: "para";
  text: string;
}
interface Table {
  kind: "table";
  rows: string[][];
}
type Block = Para | Table;

function children(el: Element, tag: string): Element[] {
  return Array.from(el.getElementsByTagNameNS(W_NS, tag)) as unknown as Element[];
}
function directChildren(el: Element, tag: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const c = el.childNodes[i] as Element;
    if (c.nodeType === 1 && c.localName === tag && c.namespaceURI === W_NS) out.push(c);
  }
  return out;
}
function textOf(el: Element): string {
  const parts: string[] = [];
  for (const t of children(el, "t")) parts.push(t.textContent ?? "");
  return parts.join("");
}
function normalizeSpaces(s: string): string {
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}
function readTableRows(tbl: Element): string[][] {
  const rows: string[][] = [];
  for (const tr of directChildren(tbl, "tr")) {
    const row: string[] = [];
    for (const tc of directChildren(tr, "tc")) {
      const cellText = directChildren(tc, "p")
        .map((p) => normalizeSpaces(textOf(p)))
        .join("\n")
        .trim();
      row.push(cellText);
    }
    if (row.length > 0) rows.push(row);
  }
  return rows;
}
function walkBody(root: Element): Block[] {
  const blocks: Block[] = [];
  visit(root);
  return blocks;

  function visit(node: Element): void {
    for (let i = 0; i < node.childNodes.length; i++) {
      const c = node.childNodes[i] as Element;
      if (c.nodeType !== 1 || c.namespaceURI !== W_NS) continue;
      if (c.localName === "p") {
        const text = normalizeSpaces(textOf(c));
        if (text) blocks.push({ kind: "para", text });
      } else if (c.localName === "tbl") {
        blocks.push({ kind: "table", rows: readTableRows(c) });
        for (const tr of directChildren(c, "tr")) {
          for (const tc of directChildren(tr, "tc")) visit(tc);
        }
      } else {
        visit(c);
      }
    }
  }
}

function slugForCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

async function main() {
  const buf = await fs.readFile(DOCX);
  const zip = await JSZip.loadAsync(buf);
  const documentEntry = zip.file("word/document.xml");
  if (!documentEntry) throw new Error("word/document.xml no encontrado en el docx");
  const documentXml = await documentEntry.async("string");
  const doc = new DOMParser().parseFromString(documentXml, "application/xml");
  const body = doc.getElementsByTagNameNS(W_NS, "body")[0];
  if (!body) throw new Error("Body del docx no encontrado");

  const blocks = walkBody(body as unknown as Element);
  console.log(`Bloques extraídos: ${blocks.length}`);

  // Split by codes. First pass: mark which blocks are code headers.
  interface Section {
    code: string;
    startIdx: number;
    blocks: Block[];
  }
  const sections: Section[] = [];
  let cur: Section | null = null;
  const pre: Block[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const text = b.kind === "para" ? b.text : b.rows[0]?.[0] ?? "";
    const m = CODE_RE.exec(text);
    if (m) {
      const code = m[1].toUpperCase();
      cur = { code, startIdx: i, blocks: [b] };
      sections.push(cur);
    } else if (cur) {
      cur.blocks.push(b);
    } else {
      pre.push(b);
    }
  }

  await fs.mkdir(SPLIT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, "blocks.json"),
    JSON.stringify(blocks, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(SPLIT_DIR, "_pre.json"),
    JSON.stringify(pre, null, 2),
    "utf8"
  );
  for (const s of sections) {
    await fs.writeFile(
      path.join(SPLIT_DIR, `${slugForCode(s.code)}.json`),
      JSON.stringify({ code: s.code, blocks: s.blocks }, null, 2),
      "utf8"
    );
  }

  const codes = sections.map((s) => s.code);
  const recetas = codes.filter((c) => /^E\d-[PH]\d-R\d$/.test(c));
  const menus = codes.filter((c) => /^E\d-[PH]\d-S\d$/.test(c));
  const guias = codes.filter((c) => /^B3-P\d$/.test(c));
  const otros = codes.filter(
    (c) => !recetas.includes(c) && !menus.includes(c) && !guias.includes(c)
  );

  console.log(`\nSecciones: ${sections.length}`);
  console.log(`  recetas (E?-?-R?): ${recetas.length}  -> ${recetas.join(", ")}`);
  console.log(`  menús   (E?-?-S?): ${menus.length}    -> ${menus.join(", ")}`);
  console.log(`  guías   (B3-P?):   ${guias.length}    -> ${guias.join(", ")}`);
  if (otros.length) console.log(`  otros: ${otros.length}    -> ${otros.join(", ")}`);
  console.log(`\nPre-sección: ${pre.length} bloques`);
  console.log(`\nEscrito a ${path.relative(ROOT, OUT_DIR)}/`);

  // También escribo un índice para revisión rápida.
  const index = sections.map((s) => ({
    code: s.code,
    startIdx: s.startIdx,
    firstLines: s.blocks
      .slice(0, 3)
      .map((b) => (b.kind === "para" ? b.text : `[table ${b.rows.length}×${b.rows[0]?.length ?? 0}]`)),
  }));
  await fs.writeFile(
    path.join(OUT_DIR, "INDEX.json"),
    JSON.stringify(index, null, 2),
    "utf8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
