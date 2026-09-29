import { repo } from "@/lib/repo";
import { UtensiliosEditor } from "./editor";

export default async function AdminUtensiliosPage() {
  const utensilios = await repo.getUtensilios().catch(() => []);
  return (
    <>
      <h1>Utensilios</h1>
      <p className="muted">
        Utensilios, envases y electrodomésticos referenciados por los planes de
        batch cooking. Los que están marcados como <em>apto congelador</em> se
        pueden asociar a una porción congelada de una receta.
      </p>
      <UtensiliosEditor initial={utensilios} />
    </>
  );
}
