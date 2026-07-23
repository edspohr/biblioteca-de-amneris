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
      <header className="page-header">
        <p className="page-header__eyebrow">Autoría</p>
        <h1 className="page-header__title">Panel de autoría</h1>
        <p className="page-header__lede muted">
          Desde aquí puedes crear, editar y eliminar recetas y los catálogos que
          las alimentan.
        </p>
      </header>
      <ul className="grid tile-grid">
        <li className="tile">
          <Link href="/admin/recetas" className="tile__link">
            <span className="tile__title">Recetas</span>
            <span className="tile__count">{recetas.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/ingredientes" className="tile__link">
            <span className="tile__title">Ingredientes</span>
            <span className="tile__count">{ingredientes.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/alergenos" className="tile__link">
            <span className="tile__title">Alérgenos</span>
            <span className="tile__count">{alergenos.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/tecnicas" className="tile__link">
            <span className="tile__title">Técnicas</span>
            <span className="tile__count">{tecnicas.length}</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
