import type { CSSProperties } from "react";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { coleccionDeMenu, iconoDe, numeroSemana, tonoStyle } from "@/lib/colecciones";
import { partirNombre } from "@/components/coleccion-portada";
import { DeleteMenuButton } from "./delete-menu-button";

export default async function AdminMenusPage() {
  const [menus, etapas, colecciones] = await Promise.all([
    repo.getMenus(),
    repo.getEtapas(),
    repo.getColecciones().catch(() => []),
  ]);
  const etapaById = new Map(etapas.map((e) => [e.id, e]));
  const colById = new Map(colecciones.map((c) => [c.id, c]));
  const ordenados = [...menus].sort((a, b) => {
    const ca = colById.get(coleccionDeMenu(a, colecciones) ?? "")?.orden ?? 99;
    const cb = colById.get(coleccionDeMenu(b, colecciones) ?? "")?.orden ?? 99;
    return (
      ca - cb ||
      (etapaById.get(a.etapa_id)?.orden ?? 9) - (etapaById.get(b.etapa_id)?.orden ?? 9) ||
      (numeroSemana(a) ?? 99) - (numeroSemana(b) ?? 99)
    );
  });

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Contenido</p>
          <h1 className="admin-head__title">Menús</h1>
          <p className="admin-head__lede">
            {menus.length} menús · agrupan recetas por día y momento del día.
          </p>
        </div>
        <Link href="/admin/menus/nuevo" className="button button--primary">
          + Nuevo menú
        </Link>
      </header>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Colección</th>
              <th>Etapa</th>
              <th>Recetas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((m) => {
              const c = colById.get(coleccionDeMenu(m, colecciones) ?? "");
              return (
                <tr key={m.id}>
                  <td>
                    <Link href={`/admin/menus/${m.id}/editar`}>{m.nombre}</Link>
                  </td>
                  <td>
                    {c ? (
                      <span className="col-tag" style={tonoStyle(c) as CSSProperties}>
                        {iconoDe(c)} {partirNombre(c.nombre).titulo}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{etapaById.get(m.etapa_id)?.nombre ?? m.etapa_id}</td>
                  <td>{m.celdas?.length ?? m.menu_recetas.length}</td>
                  <td>
                    <Link href={`/admin/menus/${m.id}/editar`}>Editar</Link>
                    {" · "}
                    <Link href={`/menus/${m.id}`}>Ver</Link>
                    {" · "}
                    <DeleteMenuButton id={m.id} nombre={m.nombre} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
