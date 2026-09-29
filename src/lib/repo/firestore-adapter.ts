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
  coleccionSchema,
  etapaSchema,
  guiaSchema,
  ingredienteSchema,
  menuSchema,
  metodoConservacionSchema,
  planSchema,
  porcionTexturaSchema,
  recetaSchema,
  tecnicaSchema,
  utensilioSchema,
  type Alergeno,
  type Coleccion,
  type Etapa,
  type Guia,
  type Ingrediente,
  type Menu,
  type MetodoConservacion,
  type Plan,
  type PorcionTextura,
  type Receta,
  type Tecnica,
  type Utensilio,
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
  colecciones: "colecciones",
  metodosConservacion: "metodos_conservacion",
  utensilios: "utensilios",
  planes: "planes",
  guias: "guias",
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

// Menus get a denormalized `receta_ids` for the same reason as recipes —
// so getMenusUsingReceta() is an array-contains query, not a full scan.
export function toMenuDoc(m: Menu): Menu & { receta_ids: string[] } {
  return { ...m, receta_ids: uniq(m.menu_recetas.map((x) => x.receta_id)) };
}

function fromMenuDoc(data: DocumentData): Menu {
  const { receta_ids: _r, ...rest } = data;
  void _r;
  return menuSchema.parse(rest);
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
export async function getIngrediente(id: string): Promise<Ingrediente | null> {
  const doc = await col(COLLECTIONS.ingredientes).doc(id).get();
  return doc.exists ? ingredienteSchema.parse(doc.data()) : null;
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
export async function getAlergeno(id: string): Promise<Alergeno | null> {
  const doc = await col(COLLECTIONS.alergenos).doc(id).get();
  return doc.exists ? alergenoSchema.parse(doc.data()) : null;
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
    .map((d) => fromMenuDoc(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getMenu(id: string): Promise<Menu | null> {
  const doc = await col(COLLECTIONS.menus).doc(id).get();
  return doc.exists ? fromMenuDoc(doc.data() as DocumentData) : null;
}
export async function saveMenu(menu: Menu): Promise<void> {
  return wrapWrite(async () => {
    menuSchema.parse(menu);
    await col(COLLECTIONS.menus).doc(menu.id).set(toMenuDoc(menu));
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
export async function getMenusUsingReceta(id: string): Promise<Menu[]> {
  const snap = await col(COLLECTIONS.menus)
    .where("receta_ids", "array-contains", id)
    .get();
  return snap.docs.map((d) => fromMenuDoc(d.data()));
}

// -- New entities (Bocaditos de reserva, Fase 1) -----------------------------

export async function getColecciones(): Promise<Coleccion[]> {
  const snap = await col(COLLECTIONS.colecciones).get();
  return snap.docs
    .map((d) => coleccionSchema.parse(d.data()))
    .sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
}
export async function getColeccion(id: string): Promise<Coleccion | null> {
  const doc = await col(COLLECTIONS.colecciones).doc(id).get();
  return doc.exists ? coleccionSchema.parse(doc.data()) : null;
}
export async function saveColeccion(coleccion: Coleccion): Promise<void> {
  return wrapWrite(async () => {
    coleccionSchema.parse(coleccion);
    await col(COLLECTIONS.colecciones).doc(coleccion.id).set(coleccion);
  });
}

export async function getMetodosConservacion(): Promise<MetodoConservacion[]> {
  const snap = await col(COLLECTIONS.metodosConservacion).get();
  return snap.docs
    .map((d) => metodoConservacionSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getUtensilios(): Promise<Utensilio[]> {
  const snap = await col(COLLECTIONS.utensilios).get();
  return snap.docs
    .map((d) => utensilioSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getUtensilio(id: string): Promise<Utensilio | null> {
  const doc = await col(COLLECTIONS.utensilios).doc(id).get();
  return doc.exists ? utensilioSchema.parse(doc.data()) : null;
}
export async function saveUtensilio(utensilio: Utensilio): Promise<void> {
  return wrapWrite(async () => {
    utensilioSchema.parse(utensilio);
    await col(COLLECTIONS.utensilios).doc(utensilio.id).set(utensilio);
  });
}
export async function deleteUtensilio(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.utensilios).doc(id).delete();
  });
}

export async function getPlanes(): Promise<Plan[]> {
  const snap = await col(COLLECTIONS.planes).get();
  return snap.docs
    .map((d) => planSchema.parse(d.data()))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export async function getPlan(id: string): Promise<Plan | null> {
  const doc = await col(COLLECTIONS.planes).doc(id).get();
  return doc.exists ? planSchema.parse(doc.data()) : null;
}
export async function savePlan(plan: Plan): Promise<void> {
  return wrapWrite(async () => {
    planSchema.parse(plan);
    await col(COLLECTIONS.planes).doc(plan.id).set(plan);
  });
}

export async function getGuias(): Promise<Guia[]> {
  const snap = await col(COLLECTIONS.guias).get();
  return snap.docs
    .map((d) => guiaSchema.parse(d.data()))
    .sort(
      (a, b) => a.coleccionId.localeCompare(b.coleccionId) || a.orden - b.orden
    );
}
export async function getGuia(id: string): Promise<Guia | null> {
  const doc = await col(COLLECTIONS.guias).doc(id).get();
  return doc.exists ? guiaSchema.parse(doc.data()) : null;
}
export async function saveGuia(guia: Guia): Promise<void> {
  return wrapWrite(async () => {
    guiaSchema.parse(guia);
    await col(COLLECTIONS.guias).doc(guia.id).set(guia);
  });
}
export async function deleteGuia(id: string): Promise<void> {
  return wrapWrite(async () => {
    await col(COLLECTIONS.guias).doc(id).delete();
  });
}
