import { repo } from "@/lib/repo";
import { ColeccionesEditor } from "./editor";

export default async function AdminColeccionesPage() {
  const colecciones = await repo.getColecciones().catch(() => []);
  return (
    <>
      <h1>Colecciones</h1>
      <p className="muted">
        El estado <strong>publicada</strong> hace la colección visible en /libro
        y en /colecciones/&lt;slug&gt;. <strong>Oculta</strong> la esconde salvo
        para superadmins (útil para previsualizar antes del lanzamiento).{" "}
        <strong>Próximamente</strong> muestra la card con badge pero sin link.
      </p>
      <ColeccionesEditor initial={colecciones} />
    </>
  );
}
