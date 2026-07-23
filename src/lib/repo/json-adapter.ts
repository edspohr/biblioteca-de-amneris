import { promises as fs } from "node:fs";
import path from "node:path";
import {
  alergenoSchema,
  etapaSchema,
  ingredienteSchema,
  menuSchema,
  porcionTexturaSchema,
  recetaSchema,
  tecnicaSchema,
  type Alergeno,
  type Etapa,
  type Ingrediente,
  type Menu,
  type PorcionTextura,
  type Receta,
  type Tecnica,
  type VarianteEtapa,
} from "@/lib/schema";
import { stableStringify } from "@/lib/repo/stable-stringify";

const DATA_DIR = path.join(process.cwd(), "data");
const RECETAS_DIR = path.join(DATA_DIR, "recetas");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, stableStringify(data) + "\n", "utf8");
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function getEtapas(): Promise<Etapa[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "etapas.json"));
  return raw.map((r) => etapaSchema.parse(r));
}
export async function getEtapa(id: string): Promise<Etapa | null> {
  const all = await getEtapas();
  return all.find((e) => e.id === id) ?? null;
}

export async function getIngredientes(): Promise<Ingrediente[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "ingredientes.json"));
  return raw.map((r) => ingredienteSchema.parse(r));
}
export async function saveIngrediente(ingrediente: Ingrediente): Promise<void> {
  ingredienteSchema.parse(ingrediente);
  const all = await getIngredientes();
  const idx = all.findIndex((i) => i.id === ingrediente.id);
  if (idx >= 0) all[idx] = ingrediente;
  else all.push(ingrediente);
  all.sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(DATA_DIR, "ingredientes.json"), all);
}
export async function deleteIngrediente(id: string): Promise<void> {
  const all = (await getIngredientes()).filter((i) => i.id !== id);
  await writeJson(path.join(DATA_DIR, "ingredientes.json"), all);
}

export async function getAlergenos(): Promise<Alergeno[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "alergenos.json"));
  return raw.map((r) => alergenoSchema.parse(r));
}
export async function saveAlergeno(alergeno: Alergeno): Promise<void> {
  alergenoSchema.parse(alergeno);
  const all = await getAlergenos();
  const idx = all.findIndex((a) => a.id === alergeno.id);
  if (idx >= 0) all[idx] = alergeno;
  else all.push(alergeno);
  all.sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(DATA_DIR, "alergenos.json"), all);
}
export async function deleteAlergeno(id: string): Promise<void> {
  const all = (await getAlergenos()).filter((a) => a.id !== id);
  await writeJson(path.join(DATA_DIR, "alergenos.json"), all);
}

export async function getTecnicas(): Promise<Tecnica[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "tecnicas.json"));
  return raw.map((r) => tecnicaSchema.parse(r));
}
export async function getTecnica(id: string): Promise<Tecnica | null> {
  const all = await getTecnicas();
  return all.find((t) => t.id === id) ?? null;
}
export async function saveTecnica(tecnica: Tecnica): Promise<void> {
  tecnicaSchema.parse(tecnica);
  const all = await getTecnicas();
  const idx = all.findIndex((t) => t.id === tecnica.id);
  if (idx >= 0) all[idx] = tecnica;
  else all.push(tecnica);
  all.sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(DATA_DIR, "tecnicas.json"), all);
}
export async function deleteTecnica(id: string): Promise<void> {
  const all = (await getTecnicas()).filter((t) => t.id !== id);
  await writeJson(path.join(DATA_DIR, "tecnicas.json"), all);
}

export async function getRecetas(): Promise<Receta[]> {
  if (!(await fileExists(RECETAS_DIR))) return [];
  const files = (await fs.readdir(RECETAS_DIR)).filter((f) => f.endsWith(".json"));
  const recetas = await Promise.all(
    files.map(async (f) => recetaSchema.parse(await readJson(path.join(RECETAS_DIR, f))))
  );
  recetas.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  return recetas;
}
export async function getReceta(id: string): Promise<Receta | null> {
  const file = path.join(RECETAS_DIR, `${id}.json`);
  if (!(await fileExists(file))) return null;
  return recetaSchema.parse(await readJson(file));
}
export async function getVarianteReceta(
  recetaId: string,
  etapaId: string
): Promise<VarianteEtapa | null> {
  const r = await getReceta(recetaId);
  return r?.variantes[etapaId] ?? null;
}
export async function saveReceta(receta: Receta): Promise<void> {
  recetaSchema.parse(receta);
  await writeJson(path.join(RECETAS_DIR, `${receta.id}.json`), receta);
}
export async function deleteReceta(id: string): Promise<void> {
  const file = path.join(RECETAS_DIR, `${id}.json`);
  if (await fileExists(file)) await fs.unlink(file);
}

export async function getMenus(): Promise<Menu[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "menus.json"));
  return raw.map((r) => menuSchema.parse(r));
}
export async function getMenu(id: string): Promise<Menu | null> {
  const all = await getMenus();
  return all.find((m) => m.id === id) ?? null;
}
export async function saveMenu(menu: Menu): Promise<void> {
  menuSchema.parse(menu);
  const all = await getMenus();
  const idx = all.findIndex((m) => m.id === menu.id);
  if (idx >= 0) all[idx] = menu;
  else all.push(menu);
  all.sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(DATA_DIR, "menus.json"), all);
}
export async function deleteMenu(id: string): Promise<void> {
  const all = (await getMenus()).filter((m) => m.id !== id);
  await writeJson(path.join(DATA_DIR, "menus.json"), all);
}

export async function getPorcionesTexturas(): Promise<PorcionTextura[]> {
  const raw = await readJson<unknown[]>(path.join(DATA_DIR, "porciones-texturas.json"));
  return raw.map((r) => porcionTexturaSchema.parse(r));
}

export async function getRecetasUsingIngrediente(ingredienteId: string): Promise<Receta[]> {
  const all = await getRecetas();
  return all.filter((r) =>
    r.receta_ingredientes.some((ri) => ri.ingrediente_id === ingredienteId)
  );
}

export async function getRecetasUsingAlergeno(alergenoId: string): Promise<Receta[]> {
  const all = await getRecetas();
  return all.filter((r) =>
    r.receta_alergenos.some((ra) => ra.alergeno_id === alergenoId)
  );
}

export async function getRecetasUsingTecnica(tecnicaId: string): Promise<Receta[]> {
  const all = await getRecetas();
  return all.filter((r) =>
    r.receta_tecnicas.some((rt) => rt.tecnica_id === tecnicaId)
  );
}
