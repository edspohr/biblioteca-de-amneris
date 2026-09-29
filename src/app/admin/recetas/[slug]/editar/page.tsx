import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { RecetaForm } from "../../receta-form";
import { PhotoUploader } from "./photo-uploader";

export default async function EditarRecetaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [receta, etapas, ingredientes, alergenos, tecnicas, colecciones] = await Promise.all([
    repo.getReceta(slug),
    repo.getEtapas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
    repo.getColecciones().catch(() => []),
  ]);
  if (!receta) notFound();

  return (
    <>
      <p className="admin-back">
        <Link href="/admin/recetas">← Recetas</Link>
      </p>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Editar receta</p>
          <h1 className="admin-head__title">{receta.titulo}</h1>
        </div>
        <Link href={`/recetas/${receta.id}`} className="button button--ghost">
          Ver como lectora ↗
        </Link>
      </header>
      <PhotoUploader recetaId={receta.id} currentFoto={receta.foto} />
      <RecetaForm
        mode="edit"
        initial={receta}
        etapas={etapas}
        ingredientes={ingredientes}
        alergenos={alergenos}
        tecnicas={tecnicas}
        colecciones={colecciones}
      />
    </>
  );
}
