import Link from "next/link";
import { repo } from "@/lib/repo";
import { DeleteMenuButton } from "./delete-menu-button";

export default async function AdminMenusPage() {
  const [menus, etapas] = await Promise.all([
    repo.getMenus(),
    repo.getEtapas(),
  ]);
  const etapaNombre = new Map(etapas.map((e) => [e.id, e.nombre]));

  return (
    <>
      <h1>Menús</h1>
      <p>
        <Link href="/admin/menus/nuevo">➕ Crear nuevo menú</Link>
      </p>
      <p className="muted">
        {menus.length} menús · agrupan recetas por día y momento del día.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Etapa</th>
              <th>Recetas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/menus/${m.id}`}>{m.nombre}</Link>
                </td>
                <td>{etapaNombre.get(m.etapa_id) ?? m.etapa_id}</td>
                <td>{m.menu_recetas.length}</td>
                <td>
                  <Link href={`/admin/menus/${m.id}/editar`}>Editar</Link>
                  {" · "}
                  <DeleteMenuButton id={m.id} nombre={m.nombre} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
