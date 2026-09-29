import Link from "next/link";
import { repo } from "@/lib/repo";
import { RecetasAdminLista, type Pendiente } from "./lista";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

const PENDIENTES: Pendiente[] = ["sin-foto", "alergenos", "sin-coleccion"];

export default async function AdminRecetasPage({
  searchParams,
}: {
  searchParams: Promise<{ coleccion?: string; pendiente?: string }>;
}) {
  const [{ coleccion, pendiente }, recetas, colecciones, etapas] = await Promise.all([
    searchParams,
    repo.getRecetas(),
    repo.getColecciones().catch(() => []),
    repo.getEtapas(),
  ]);
  const etapaOrden = new Map(etapas.map((e) => [e.id, e.orden]));

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Contenido</p>
          <h1 className="admin-head__title">Recetas</h1>
          <p className="admin-head__lede">{recetas.length} recetas en la biblioteca.</p>
        </div>
        <Link
          href={coleccion ? `/admin/recetas/nueva?coleccion=${coleccion}` : "/admin/recetas/nueva"}
          className="button button--primary"
        >
          + Nueva receta
        </Link>
      </header>
      <RecetasAdminLista
        colecciones={[...colecciones].sort((a, b) => a.orden - b.orden)}
        coleccionInicial={colecciones.some((c) => c.id === coleccion) ? coleccion! : ""}
        pendienteInicial={PENDIENTES.includes(pendiente as Pendiente) ? (pendiente as Pendiente) : ""}
        recetas={recetas
          .map((r) => ({
            id: r.id,
            titulo: r.titulo,
            foto: r.foto,
            tipo: TIPOS_LABEL[r.tipo_comida] ?? r.tipo_comida,
            minutos: r.minutos_prep,
            coleccionIds: r.coleccionIds ?? [],
            etapas: Object.keys(r.variantes)
              .map((id) => etapaOrden.get(id))
              .filter((n): n is number => n != null)
              .sort(),
            alergenosPorRevisar: r.receta_alergenos.some((a) => a.inferido),
            gratis: r.destacadaPreview,
          }))
          .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"))}
      />
    </>
  );
}
