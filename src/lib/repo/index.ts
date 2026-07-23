import type {
  Alergeno,
  Etapa,
  Ingrediente,
  Menu,
  PorcionTextura,
  Receta,
  Tecnica,
  VarianteEtapa,
} from "@/lib/schema";
import * as adapter from "./json-adapter";

export interface Repo {
  getEtapas(): Promise<Etapa[]>;
  getEtapa(id: string): Promise<Etapa | null>;

  getIngredientes(): Promise<Ingrediente[]>;
  saveIngrediente(ingrediente: Ingrediente): Promise<void>;
  deleteIngrediente(id: string): Promise<void>;

  getAlergenos(): Promise<Alergeno[]>;
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

  // Referential integrity helpers — return the recipes that reference the
  // given catalog entity. Used to block or warn on deletes.
  getRecetasUsingIngrediente(ingredienteId: string): Promise<Receta[]>;
  getRecetasUsingAlergeno(alergenoId: string): Promise<Receta[]>;
  getRecetasUsingTecnica(tecnicaId: string): Promise<Receta[]>;
}

export const repo: Repo = adapter;
