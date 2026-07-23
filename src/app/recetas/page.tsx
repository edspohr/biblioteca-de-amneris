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
      <header className="page-header">
        <p className="page-header__eyebrow">Recetas</p>
        <h1 className="page-header__title">Todas las recetas</h1>
        <p className="page-header__lede muted">
          {recetas.length} recetas · cada una se adapta a las tres etapas.
        </p>
      </header>
      <RecetasBrowser
        recetas={recetas}
        ingredientes={ingredientes}
        alergenos={alergenos}
      />
    </>
  );
}
