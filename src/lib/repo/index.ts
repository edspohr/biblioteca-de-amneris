import type {
  Alergeno,
  Coleccion,
  Etapa,
  Guia,
  Ingrediente,
  Menu,
  MetodoConservacion,
  Plan,
  PorcionTextura,
  Receta,
  Tecnica,
  Utensilio,
  VarianteEtapa,
} from "@/lib/schema";
import * as jsonAdapter from "./json-adapter";
import * as firestoreAdapter from "./firestore-adapter";
import { isAdminConfigured } from "@/lib/firebase/admin";

// Adapter selection:
//   - explicit override: REPO_ADAPTER=json|firestore
//   - otherwise auto-detect: Firestore whenever the admin SDK is configured
//     (FIREBASE_ADMIN_SA or GOOGLE_APPLICATION_CREDENTIALS set), else JSON.
//
// firestore-adapter is server-only and never bundled into the client anyway,
// so importing it at the top level here has no browser cost.
function pickAdapter(): Repo {
  const override = process.env.REPO_ADAPTER;
  if (override === "json") return jsonAdapter;
  if (override === "firestore") return firestoreAdapter;
  return isAdminConfigured() ? firestoreAdapter : jsonAdapter;
}

const adapter = pickAdapter();
console.log(`[repo] adapter=${adapter === firestoreAdapter ? "firestore" : "json"}`);

export interface Repo {
  getEtapas(): Promise<Etapa[]>;
  getEtapa(id: string): Promise<Etapa | null>;

  getIngredientes(): Promise<Ingrediente[]>;
  getIngrediente(id: string): Promise<Ingrediente | null>;
  saveIngrediente(ingrediente: Ingrediente): Promise<void>;
  deleteIngrediente(id: string): Promise<void>;

  getAlergenos(): Promise<Alergeno[]>;
  getAlergeno(id: string): Promise<Alergeno | null>;
  saveAlergeno(alergeno: Alergeno): Promise<void>;
  deleteAlergeno(id: string): Promise<void>;

  getTecnicas(): Promise<Tecnica[]>;
  getTecnica(id: string): Promise<Tecnica | null>;
  saveTecnica(tecnica: Tecnica): Promise<void>;
  deleteTecnica(id: string): Promise<void>;

  getRecetas(): Promise<Receta[]>;
  getReceta(id: string): Promise<Receta | null>;
  getVarianteReceta(recetaId: string, etapaId: string): Promise<VarianteEtapa | null>;
  saveReceta(receta: Receta): Promise<void>;
  deleteReceta(id: string): Promise<void>;

  getMenus(): Promise<Menu[]>;
  getMenu(id: string): Promise<Menu | null>;
  saveMenu(menu: Menu): Promise<void>;
  deleteMenu(id: string): Promise<void>;

  getPorcionesTexturas(): Promise<PorcionTextura[]>;

  // Referential integrity helpers — return the recipes/menus that reference
  // the given catalog entity. Used to block or warn on deletes.
  getRecetasUsingIngrediente(ingredienteId: string): Promise<Receta[]>;
  getRecetasUsingAlergeno(alergenoId: string): Promise<Receta[]>;
  getRecetasUsingTecnica(tecnicaId: string): Promise<Receta[]>;
  getMenusUsingReceta(recetaId: string): Promise<Menu[]>;

  // -- New in Fase 0 (Bocaditos de reserva). Interface only; adapters throw
  // NotImplemented until Fase 1 wires them into JSON files + Firestore
  // collections.
  getColecciones(): Promise<Coleccion[]>;
  getColeccion(id: string): Promise<Coleccion | null>;
  saveColeccion(coleccion: Coleccion): Promise<void>;

  getMetodosConservacion(): Promise<MetodoConservacion[]>;

  getUtensilios(): Promise<Utensilio[]>;
  getUtensilio(id: string): Promise<Utensilio | null>;
  saveUtensilio(utensilio: Utensilio): Promise<void>;
  deleteUtensilio(id: string): Promise<void>;

  getPlanes(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | null>;
  savePlan(plan: Plan): Promise<void>;

  getGuias(): Promise<Guia[]>;
  getGuia(id: string): Promise<Guia | null>;
  saveGuia(guia: Guia): Promise<void>;
  deleteGuia(id: string): Promise<void>;
}

export const repo: Repo = adapter;
