import Link from "next/link";
import { repo } from "@/lib/repo";
import { datosColeccion, hoyISO } from "@/lib/colecciones";
import { ColeccionesLista } from "./lista";

export default async function AdminColeccionesPage() {
  const [colecciones, recetas, menus, guias, planes] = await Promise.all([
    repo.getColecciones().catch(() => []),
    repo.getRecetas(),
    repo.getMenus(),
    repo.getGuias().catch(() => []),
    repo.getPlanes().catch(() => []),
  ]);
  const contenido = { colecciones, recetas, menus, guias, planes };

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Contenido</p>
          <h1 className="admin-head__title">Colecciones</h1>
          <p className="admin-head__lede">
            Cada colección es un libro de tu biblioteca. Aquí eliges cómo se ve,
            cuándo se publica y en qué orden aparece en la estantería.
          </p>
        </div>
        <Link href="/admin/colecciones/nueva" className="button button--primary">
          + Nueva colección
        </Link>
      </header>

      {colecciones.length === 0 ? (
        <div className="admin-empty">
          <p>Todavía no hay colecciones.</p>
          <Link href="/admin/colecciones/nueva" className="button button--primary">
            Crear la primera
          </Link>
        </div>
      ) : (
        <ColeccionesLista
          hoy={hoyISO()}
          items={colecciones.map((c) => ({ coleccion: c, datos: datosColeccion(c, contenido) }))}
        />
      )}
    </>
  );
}
