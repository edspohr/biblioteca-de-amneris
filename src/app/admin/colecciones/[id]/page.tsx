import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { ESTADO_ADMIN, datosColeccion, menusDeColeccion } from "@/lib/colecciones";
import { ColeccionForm } from "../coleccion-form";
import { ColeccionContenido } from "../contenido";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function EditarColeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, colecciones, recetas, menus, guias, planes] = await Promise.all([
    repo.getColeccion(id),
    repo.getColecciones().catch(() => []),
    repo.getRecetas(),
    repo.getMenus(),
    repo.getGuias().catch(() => []),
    repo.getPlanes().catch(() => []),
  ]);
  if (!c) notFound();

  const datos = datosColeccion(c, { colecciones, recetas, menus, guias, planes });
  const nombreCol = new Map(colecciones.map((x) => [x.id, x.nombre]));
  const menusCol = menusDeColeccion(c, menus, colecciones);
  const guiasCol = guias.filter((g) => g.coleccionId === c.id);

  return (
    <>
      <p className="admin-back">
        <Link href="/admin/colecciones">← Colecciones</Link>
      </p>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">
            <span className="estado-chip" data-estado={c.estado}>
              {ESTADO_ADMIN[c.estado].label}
            </span>
          </p>
          <h1 className="admin-head__title">{c.nombre}</h1>
        </div>
        <Link href={`/colecciones/${c.id}`} className="button button--ghost">
          Ver como lectora ↗
        </Link>
      </header>

      <ColeccionForm initial={c} dato={datos[0]} />

      {c.tipo !== "guia" && (
        <ColeccionContenido
          coleccionId={c.id}
          recetas={recetas
            .map((r) => ({
              id: r.id,
              titulo: r.titulo,
              foto: r.foto,
              tipo: TIPOS_LABEL[r.tipo_comida] ?? r.tipo_comida,
              enColeccion: (r.coleccionIds ?? []).includes(c.id),
              otras: (r.coleccionIds ?? []).filter((x) => x !== c.id).map((x) => nombreCol.get(x) ?? x),
            }))
            .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"))}
        />
      )}

      <section className="form-card">
        <h2 className="form-card__title">Menús y guías</h2>
        <ul className="dash-counts dash-counts--inline">
          <li>
            <Link href="/admin/menus">
              <strong>{menusCol.length}</strong>
              <span>menús</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/guias">
              <strong>{guiasCol.length}</strong>
              <span>guías</span>
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
