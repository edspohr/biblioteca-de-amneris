import { repo } from "@/lib/repo";
import { getSessionWithProfile } from "@/lib/auth/session";
import { estadoEfectivo, hoyISO } from "@/lib/colecciones";
import { RecetasBrowser } from "./browser";

export default async function RecetasPage({
  searchParams,
}: {
  searchParams: Promise<{ coleccion?: string }>;
}) {
  const [{ coleccion }, recetas, ingredientes, alergenos, colecciones, ctx] = await Promise.all([
    searchParams,
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getColecciones().catch(() => []),
    getSessionWithProfile(),
  ]);
  const hasFullAccess = ctx?.access.hasFullAccess ?? false;
  const isSuperadmin = ctx?.session.superadmin === true;

  // Recipes of collections that aren't out yet stay out of the global search.
  const hoy = hoyISO();
  const ocultas = new Set(
    colecciones
      .filter((c) => estadoEfectivo(c, hoy) !== "publicada" && !isSuperadmin)
      .map((c) => c.id)
  );
  const visibles = recetas.filter((r) => {
    const ids = r.coleccionIds ?? [];
    return ids.length === 0 || ids.some((id) => !ocultas.has(id));
  });
  const coleccionesVisibles = colecciones.filter((c) => !ocultas.has(c.id));
  const inicial = coleccionesVisibles.some((c) => c.id === coleccion) ? coleccion : undefined;

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">La biblioteca · todas las colecciones</p>
        <h1 className="page-header__title">Todas las recetas</h1>
        <p className="page-header__lede muted">
          {visibles.length} recetas · cada una se adapta a las tres etapas.
        </p>
      </header>
      <RecetasBrowser
        recetas={visibles}
        ingredientes={ingredientes}
        alergenos={alergenos}
        hasFullAccess={hasFullAccess}
        colecciones={coleccionesVisibles}
        coleccionInicial={inicial}
      />
    </>
  );
}
