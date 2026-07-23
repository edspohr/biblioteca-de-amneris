import { repo } from "@/lib/repo";
import { IngredientesEditor } from "./editor";

export default async function AdminIngredientesPage() {
  const [ingredientes, recetas] = await Promise.all([
    repo.getIngredientes(),
    repo.getRecetas(),
  ]);
  const usage = new Map<string, { id: string; titulo: string }[]>();
  for (const r of recetas) {
    for (const ri of r.receta_ingredientes) {
      const arr = usage.get(ri.ingrediente_id) ?? [];
      arr.push({ id: r.id, titulo: r.titulo });
      usage.set(ri.ingrediente_id, arr);
    }
  }
  const usageObj: Record<string, { id: string; titulo: string }[]> = {};
  for (const [k, v] of usage) usageObj[k] = v;

  return (
    <>
      <h1>Ingredientes</h1>
      <IngredientesEditor initial={ingredientes} usage={usageObj} />
    </>
  );
}
