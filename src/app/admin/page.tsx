import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function AdminHome() {
  const [recetas, ingredientes, alergenos, tecnicas] = await Promise.all([
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
  ]);

  return (
    <>
      <h1>Autoría</h1>
      <p>
        Desde aquí puedes crear, editar y eliminar recetas y los catálogos que
        las alimentan.
      </p>
      <div className="grid">
        <div className="card">
          <Link href="/admin/recetas">Recetas</Link>
          <div className="meta">{recetas.length} recetas</div>
        </div>
        <div className="card">
          <Link href="/admin/ingredientes">Ingredientes</Link>
          <div className="meta">{ingredientes.length} ingredientes</div>
        </div>
        <div className="card">
          <Link href="/admin/alergenos">Alérgenos</Link>
          <div className="meta">{alergenos.length} alérgenos</div>
        </div>
        <div className="card">
          <Link href="/admin/tecnicas">Técnicas</Link>
          <div className="meta">{tecnicas.length} técnicas</div>
        </div>
      </div>
    </>
  );
}
