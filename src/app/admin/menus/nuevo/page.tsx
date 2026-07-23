import { repo } from "@/lib/repo";
import { MenuForm } from "../menu-form";

export default async function NuevoMenuPage() {
  const [etapas, recetas, ingredientes] = await Promise.all([
    repo.getEtapas(),
    repo.getRecetas(),
    repo.getIngredientes(),
  ]);
  return (
    <>
      <h1>Crear menú</h1>
      <MenuForm
        mode="create"
        etapas={etapas}
        recetas={recetas}
        ingredientes={ingredientes}
      />
    </>
  );
}
