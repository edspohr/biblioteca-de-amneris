import "server-only";
import {
  getFirestore,
  type Firestore,
  type CollectionReference,
  type DocumentData,
} from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
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
import { wrapWrite } from "./errors";

// Collection names — kept as constants so the migration/export scripts can
// import them and stay in lockstep with the adapter.
export const COLLECTIONS = {
  etapas: "etapas",
  porcionesTexturas: "porciones_texturas",
  ingredientes: "ingredientes",
  alergenos: "alergenos",
  tecnicas: "tecnicas",
  menus: "menus",
  recetas: "recetas",
} as const;

let cachedDb: Firestore | null = null;
function db(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

function col(name: string): CollectionReference<DocumentData> {
  return db().collection(name);
}

// Firestore-side denormalization: recipes get flat `_ids` arrays so we can
// query "recipes using ingredient X" with array-contains instead of scanning
// the whole collection. The arrays are computed on write and stripped on
// read — they are never part of the exportable JSON.
interface RecetaDoc extends Omit<Receta, never> {
  ingrediente_ids: string[];
  alergeno_ids: string[];
  tecnica_ids: string[];
}

export function toRecetaDoc(r: Receta): RecetaDoc {
  return {
    ...r,
    ingrediente_ids: uniq(r.receta_ingredientes.map((x) => x.ingrediente_id)),
    alergeno_ids: uniq(r.receta_alergenos.map((x) => x.alergeno_id)),
    tecnica_ids: uniq(r.receta_tecnicas.map((x) => x.tecnica_id)),
  };
}

function fromRecetaDoc(data: DocumentData): Receta {
  const {
    ingrediente_ids: _ii,
    alergeno_ids: _ai,
    tecnica_ids: _ti,
    ...rest
  } = data;
  void _ii;
  void _ai;
  void _ti;
  return recetaSchema.parse(rest);
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)].sort();
}

// -- Etapas ------------------------------------------------------------------

export async function getEtapas(): Promise<Etapa[]> {
  const snap = await col(COLLECTIONS.etapas).get();
  return snap.docs
    .map((d) => etapaSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getEtapa(id: string): Promise<Etapa | null> {
  const doc = await col(COLLECTIONS.etapas).doc(id).get();
  return doc.exists ? etapaSchema.parse(doc.data()) : null;
}

// -- Ingredientes ------------------------------------------------------------

export async function getIngredientes(): Promise<Ingrediente[]> {
  const snap = await col(COLLECTIONS.ingredientes).get();
  return snap.docs
    .map((d) => ingredienteSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function saveIngrediente(ingrediente: Ingrediente): Promise<void> {
  return wrapWrite(async () => {
    ingredienteSchema.parse(ingrediente);
    await col(COLLECTIONS.ingredientes).doc(ingrediente.id).set(ingrediente);
  });
}
export async function deleteIngrediente(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.ingredientes).doc(id).delete();
  });
}

// -- Alergenos ---------------------------------------------------------------

export async function getAlergenos(): Promise<Alergeno[]> {
  const snap = await col(COLLECTIONS.alergenos).get();
  return snap.docs
    .map((d) => alergenoSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function saveAlergeno(alergeno: Alergeno): Promise<void> {
  return wrapWrite(async () => {
    alergenoSchema.parse(alergeno);
    await col(COLLECTIONS.alergenos).doc(alergeno.id).set(alergeno);
  });
}
export async function deleteAlergeno(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.alergenos).doc(id).delete();
  });
}

// -- Tecnicas ----------------------------------------------------------------

export async function getTecnicas(): Promise<Tecnica[]> {
  const snap = await col(COLLECTIONS.tecnicas).get();
  return snap.docs
    .map((d) => tecnicaSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getTecnica(id: string): Promise<Tecnica | null> {
  const doc = await col(COLLECTIONS.tecnicas).doc(id).get();
  return doc.exists ? tecnicaSchema.parse(doc.data()) : null;
}
export async function saveTecnica(tecnica: Tecnica): Promise<void> {
  return wrapWrite(async () => {
    tecnicaSchema.parse(tecnica);
    await col(COLLECTIONS.tecnicas).doc(tecnica.id).set(tecnica);
  });
}
export async function deleteTecnica(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.tecnicas).doc(id).delete();
  });
}

// -- Recetas -----------------------------------------------------------------

export async function getRecetas(): Promise<Receta[]> {
  const snap = await col(COLLECTIONS.recetas).get();
  const recetas = snap.docs.map((d) => fromRecetaDoc(d.data()));
  recetas.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  return recetas;
}
export async function getReceta(id: string): Promise<Receta | null> {
  const doc = await col(COLLECTIONS.recetas).doc(id).get();
  return doc.exists ? fromRecetaDoc(doc.data() as DocumentData) : null;
}
export async function getVarianteReceta(
  recetaId: string,
  etapaId: string
): Promise<VarianteEtapa | null> {
  const r = await getReceta(recetaId);
  return r?.variantes[etapaId] ?? null;
}
export async function saveReceta(receta: Receta): Promise<void> {
  return wrapWrite(async () => {
    recetaSchema.parse(receta);
    await col(COLLECTIONS.recetas).doc(receta.id).set(toRecetaDoc(receta));
  });
}
export async function deleteReceta(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.recetas).doc(id).delete();
  });
}

// -- Menus -------------------------------------------------------------------

export async function getMenus(): Promise<Menu[]> {
  const snap = await col(COLLECTIONS.menus).get();
  return snap.docs
    .map((d) => menuSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getMenu(id: string): Promise<Menu | null> {
  const doc = await col(COLLECTIONS.menus).doc(id).get();
  return doc.exists ? menuSchema.parse(doc.data()) : null;
}
export async function saveMenu(menu: Menu): Promise<void> {
  return wrapWrite(async () => {
    menuSchema.parse(menu);
    await col(COLLECTIONS.menus).doc(menu.id).set(menu);
  });
}
export async function deleteMenu(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.menus).doc(id).delete();
  });
}

// -- Porciones/texturas (reference table) ------------------------------------

export async function getPorcionesTexturas(): Promise<PorcionTextura[]> {
  const snap = await col(COLLECTIONS.porcionesTexturas).get();
  return snap.docs
    .map((d) => porcionTexturaSchema.parse(d.data()))
    .sort((a, b) => a.etapa_id.localeCompare(b.etapa_id));
}

// -- Referential integrity ---------------------------------------------------

export async function getRecetasUsingIngrediente(id: string): Promise<Receta[]> {
  const snap = await col(COLLECTIONS.recetas)
    .where("ingrediente_ids", "array-contains", id)
    .get();
  return snap.docs.map((d) => fromRecetaDoc(d.data()));
}
export async function getRecetasUsingAlergeno(id: string): Promise<Receta[]> {
  const snap = await col(COLLECTIONS.recetas)
    .where("alergeno_ids", "array-contains", id)
    .get();
  return snap.docs.map((d) => fromRecetaDoc(d.data()));
}
export async function getRecetasUsingTecnica(id: string): Promise<Receta[]> {
  const snap = await col(COLLECTIONS.recetas)
    .where("tecnica_ids", "array-contains", id)
    .get();
  return snap.docs.map((d) => fromRecetaDoc(d.data()));
}
