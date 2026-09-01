import { repo } from "@/lib/repo";
import { getSessionWithProfile } from "@/lib/auth/session";
import { SECCION_ACTIVA } from "@/lib/marca";
import { RecetasBrowser } from "./browser";

export default async function RecetasPage() {
  const [recetas, ingredientes, alergenos, ctx] = await Promise.all([
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    getSessionWithProfile(),
  ]);
  const hasFullAccess = ctx?.access.hasFullAccess ?? false;

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">Sección · {SECCION_ACTIVA.nombre}</p>
        <h1 className="page-header__title">Todas las recetas</h1>
        <p className="page-header__lede muted">
          {recetas.length} recetas · cada una se adapta a las tres etapas.
        </p>
      </header>
      <RecetasBrowser
        recetas={recetas}
        ingredientes={ingredientes}
        alergenos={alergenos}
        hasFullAccess={hasFullAccess}
      />
    </>
  );
}
