import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { RecetaForm } from "../../receta-form";

export default async function EditarRecetaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [receta, etapas, ingredientes, alergenos, tecnicas] = await Promise.all([
    repo.getReceta(slug),
    repo.getEtapas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
  ]);
  if (!receta) notFound();

  return (
    <>
      <h1>Editar: {receta.titulo}</h1>
      <RecetaForm
        mode="edit"
        initial={receta}
        etapas={etapas}
        ingredientes={ingredientes}
        alergenos={alergenos}
        tecnicas={tecnicas}
      />
    </>
  );
}
