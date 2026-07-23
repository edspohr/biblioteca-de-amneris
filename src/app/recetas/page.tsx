import { repo } from "@/lib/repo";
import { RecetasBrowser } from "./browser";

export default async function RecetasPage() {
  const [recetas, ingredientes, alergenos] = await Promise.all([
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
  ]);

  return (
    <>
      <h1>Recetas</h1>
      <p className="muted">{recetas.length} recetas · filtra y busca</p>
      <RecetasBrowser
        recetas={recetas}
        ingredientes={ingredientes}
        alergenos={alergenos}
      />
    </>
  );
}
