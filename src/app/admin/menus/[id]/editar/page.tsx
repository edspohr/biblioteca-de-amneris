import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { MenuForm } from "../../menu-form";

export default async function EditarMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [menu, etapas, recetas, ingredientes] = await Promise.all([
    repo.getMenu(id),
    repo.getEtapas(),
    repo.getRecetas(),
    repo.getIngredientes(),
  ]);
  if (!menu) notFound();
  return (
    <>
      <h1>Editar: {menu.nombre}</h1>
      <MenuForm
        mode="edit"
        initial={menu}
        etapas={etapas}
        recetas={recetas}
        ingredientes={ingredientes}
      />
    </>
  );
}
