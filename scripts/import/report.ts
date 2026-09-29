/**
 * Fase 2 — Paso 3: genera data/import/reserva-pollo/REPORTE.md en español a
 * partir de la salida de normalize.ts. Este es el documento que Amneris
 * revisa antes de aprobar load.ts --apply.
 *
 * Uso:
 *   npm run import:report
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "import", "reserva-pollo", "normalized");
const REPORT = path.join(ROOT, "data", "import", "reserva-pollo", "REPORTE.md");

interface MergedReceta {
  id: string;
  titulo: string;
  codigosFuente: string[];
  variantes: Record<string, {
    codigo: string;
    porcion: string;
    rendimiento: { porciones: number; gramosPorPorcion: number } | null;
    tiempoMin: number | null;
    ingredientes: { ingrediente_id: string; unidad: string | null; nota: string }[];
    pasos: unknown[];
    nutrientes: Record<string, number | undefined>;
    conservaciones: { metodoId: string }[];
  }>;
  alergenosInferidos: string[];
  warnings: string[];
  preparacionFresca: boolean;
  mensaje: string | null;
}
interface MergedMenu {
  id: string;
  codigo: string;
  etapaId: string;
  celdas: { dia: string; tipoComida: string; recetaId: string }[];
  listaCompras: { categoria: string; textoOriginal: string }[];
  warnings: string[];
}
interface MergedGuia {
  id: string;
  codigo: string;
  titulo: string;
  bloques: { kind: string }[];
}
interface Propuestos {
  ingredientes: {
    nombreOriginal: string;
    usadoEn: string[];
    candidatosCercanos: { id: string; nombre: string; score: number }[];
    idPropuesto: string;
  }[];
  alergenos: string[];
}

async function readJson<T>(f: string): Promise<T> {
  return JSON.parse(await fs.readFile(f, "utf8")) as T;
}

function fmt(s: string | null | undefined): string {
  return s == null || s === "" ? "_(vacío)_" : s;
}

async function main() {
  const recetas = await readJson<MergedReceta[]>(path.join(OUT_DIR, "recetas.json"));
  const menus = await readJson<MergedMenu[]>(path.join(OUT_DIR, "menus.json"));
  const guias = await readJson<MergedGuia[]>(path.join(OUT_DIR, "guias.json"));
  const propuestos = await readJson<Propuestos>(path.join(OUT_DIR, "catalogos-propuestos.json"));

  const lines: string[] = [];
  const pushln = (s = "") => lines.push(s);

  pushln("# Reporte de import — Bocaditos de reserva: Pollo");
  pushln();
  pushln(`Generado: ${new Date().toISOString()}`);
  pushln();
  pushln("Este documento resume qué se extrajo del docx `Cocina_en_un_Dia_Bebe_Amneris.docx` y qué necesita revisión antes de cargar a Firestore. Nada se ha cargado todavía — corre `npm run import:load -- --apply` cuando lo apruebes.");
  pushln();

  // -------- Resumen ---------
  pushln("## Resumen");
  pushln();
  pushln(`- **Recetas mergeadas por título**: ${recetas.length} (a partir de ${recetas.reduce((a, r) => a + r.codigosFuente.length, 0)} cards del docx)`);
  pushln(`- **Menús semanales**: ${menus.length}`);
  pushln(`- **Guías técnicas**: ${guias.length}`);
  pushln(`- **Recetas de preparación fresca (no congelan)**: ${recetas.filter((r) => r.preparacionFresca).length}`);
  pushln(`- **Ingredientes propuestos (no matchean con catálogo)**: ${propuestos.ingredientes.length}`);
  pushln(`- **Alérgenos propuestos**: ${propuestos.alergenos.length}`);
  pushln();

  // -------- Recetas mergeadas ---------
  pushln("## Recetas mergeadas");
  pushln();
  pushln("Cada fila corresponde a UNA `Receta` en Firestore. Si aparece más de un código en \"Códigos fuente\", significa que se detectaron varias cards del docx con el mismo título y se fusionaron en una sola receta con variantes por etapa.");
  pushln();
  pushln("| ID | Título | Etapas | Códigos fuente | Fresca | Warnings |");
  pushln("|----|--------|--------|-----------------|--------|----------|");
  for (const r of recetas.sort((a, b) => a.titulo.localeCompare(b.titulo))) {
    const etapas = Object.keys(r.variantes).map((e) => e.replace("etapa-", "E")).join(", ");
    pushln(
      `| \`${r.id}\` | ${r.titulo} | ${etapas} | ${r.codigosFuente.join(", ")} | ${r.preparacionFresca ? "sí" : "no"} | ${r.warnings.length} |`
    );
  }
  pushln();

  const conWarnings = recetas.filter((r) => r.warnings.length > 0);
  if (conWarnings.length > 0) {
    pushln(`### Recetas con warnings de parseo (${conWarnings.length})`);
    pushln();
    for (const r of conWarnings) {
      pushln(`- **${r.titulo}** (\`${r.id}\`):`);
      for (const w of r.warnings) pushln(`  - ${w}`);
    }
    pushln();
  }

  // -------- Alérgenos inferidos ---------
  pushln("## Alérgenos inferidos por receta");
  pushln();
  pushln("Detectados desde los nombres de ingredientes con heurística conservadora (huevo, lácteos, gluten, pescado, soja, sésamo). Están marcados `inferido: true` en la carga — el editor de recetas permite quitarlos.");
  pushln();
  const conAlergenos = recetas.filter((r) => r.alergenosInferidos.length > 0);
  pushln(`Recetas con al menos un alérgeno inferido: **${conAlergenos.length}**`);
  pushln();
  pushln("| Receta | Alérgenos inferidos |");
  pushln("|--------|---------------------|");
  for (const r of conAlergenos.sort((a, b) => a.titulo.localeCompare(b.titulo))) {
    pushln(`| ${r.titulo} | ${r.alergenosInferidos.join(", ")} |`);
  }
  pushln();

  // -------- Ingredientes propuestos ---------
  pushln("## Ingredientes propuestos");
  pushln();
  pushln("El pipeline nunca crea ingredientes en silencio. Cada nombre nuevo se propone acá con sus mejores matches del catálogo actual. Revisa y decide:");
  pushln();
  pushln("- Si el nombre nuevo YA existe con otro nombre → renombra la variante en el docx o en la normalización.");
  pushln("- Si es un ingrediente genuinamente nuevo → apruébalo y se creará en la carga con el `idPropuesto`.");
  pushln();
  pushln("| Nombre en docx | ID propuesto | Usado en | Candidatos cercanos |");
  pushln("|----------------|--------------|----------|---------------------|");
  for (const p of propuestos.ingredientes.sort((a, b) => a.nombreOriginal.localeCompare(b.nombreOriginal))) {
    const cands = p.candidatosCercanos.slice(0, 3).map((c) => `${c.nombre} (${c.score.toFixed(2)})`).join(" · ") || "_(ninguno)_";
    pushln(`| ${p.nombreOriginal} | \`${p.idPropuesto}\` | ${p.usadoEn.slice(0, 5).join(", ")}${p.usadoEn.length > 5 ? ` (+${p.usadoEn.length - 5})` : ""} | ${cands} |`);
  }
  pushln();
  if (propuestos.alergenos.length > 0) {
    pushln("### Alérgenos propuestos");
    pushln();
    for (const a of propuestos.alergenos) pushln(`- \`${a}\``);
    pushln();
  }

  // -------- Menús ---------
  pushln("## Menús semanales");
  pushln();
  pushln("| Código | Etapa | Semana | Celdas | Items lista | Warnings |");
  pushln("|--------|-------|--------|--------|-------------|----------|");
  for (const m of menus) {
    pushln(
      `| \`${m.codigo}\` | ${m.etapaId} | ${m.codigo.slice(-1)} | ${m.celdas.length} | ${m.listaCompras.length} | ${m.warnings.length} |`
    );
  }
  const menuWarn = menus.filter((m) => m.warnings.length > 0);
  if (menuWarn.length > 0) {
    pushln();
    pushln("### Menús con warnings");
    for (const m of menuWarn) {
      pushln(`- **${m.codigo}**:`);
      for (const w of m.warnings) pushln(`  - ${w}`);
    }
  }
  pushln();

  // -------- Guías ---------
  pushln("## Guías técnicas");
  pushln();
  pushln("| Código | Título | Bloques |");
  pushln("|--------|--------|---------|");
  for (const g of guias) {
    pushln(`| \`${g.codigo}\` | ${fmt(g.titulo)} | ${g.bloques.length} |`);
  }
  pushln();

  // -------- Gaps conocidos ---------
  pushln("## Gaps de contenido conocidos (del brief)");
  pushln();
  pushln("Estos se surface acá para que Amneris decida — el pipeline no los \"arregla\" en silencio:");
  pushln();
  pushln("1. **Nutrientes con disclaimer**: cada tabla incluye \"Valores aproximados por porción cocida. Consultar con nutricionista antes de publicar.\" Se cargan con `aproximado: true` en el schema.");
  pushln("2. **Recetas de preparación fresca (no congelan)**: 3 previstas (Avena con Huevo, Panquequitos de Pollo y Manzana, Funche de Huevo con Harina de Maíz y Leche). Detectadas por `❄️ NO CONGELA ❌`. Revisa el conteo arriba.");
  pushln("3. **Listas de compras semanales vs mensual**: el docx repite la misma lista para las 4 semanas de cada etapa, y la lista mensual base puede no reconciliar exactamente (ej. 3 kg/semana pero 4 kg/mes). Se cargan tal como aparecen; la comparación queda al editor.");
  pushln("4. **Porciones en header vs tabla B3-P7**: los `Xg c/u` del header de cada card no siempre coinciden con los gramos-por-comida definidos por etapa. Se guardan ambos.");
  pushln();

  // -------- Próximos pasos ---------
  pushln("## Próximos pasos");
  pushln();
  pushln("1. Revisa esta tabla, en particular:");
  pushln("   - Ingredientes propuestos → ¿coinciden con alguno existente? Si sí, edita `normalize.ts` o renombra en el docx.");
  pushln("   - Recetas con warnings → decide si cargar como están (el editor lo corrige después) o volver al docx.");
  pushln("2. Corre `npm run import:load -- --dry-run` para ver EXACTAMENTE qué se escribiría.");
  pushln("3. Corre `npm run import:load -- --apply` para escribir (con backup reciente).");
  pushln();
  pushln("La colección `bocaditos-de-reserva-pollo` queda con `estado: oculta` — no se muestra en el reader hasta el flip manual el 5 de octubre.");

  await fs.writeFile(REPORT, lines.join("\n"), "utf8");
  console.log(`REPORTE.md escrito: ${path.relative(ROOT, REPORT)}`);
  console.log(`  ${lines.length} líneas`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
