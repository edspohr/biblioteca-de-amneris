import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function HomePage() {
  const [etapas, recetas, menus, tecnicas] = await Promise.all([
    repo.getEtapas(),
    repo.getRecetas(),
    repo.getMenus(),
    repo.getTecnicas(),
  ]);
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  return (
    <>
      <h1>Bocaditos del Corazón</h1>
      <p className="muted">
        Guía de alimentación complementaria para bebés de 6 a 24 meses, por Amneris.
      </p>

      <h2>Etapas</h2>
      <div className="grid">
        {etapasOrdenadas.map((etapa) => (
          <div key={etapa.id} className="card">
            <Link href={`/etapas/${etapa.id}`}>{etapa.nombre}</Link>
            <div className="meta">
              {etapa.rango_edad} · {etapa.textura}
            </div>
            <div className="meta">{recetas.length} recetas · aplican a esta etapa</div>
            {etapa.descripcion && <div>{etapa.descripcion}</div>}
          </div>
        ))}
      </div>

      <h2>Explora</h2>
      <div className="grid">
        <div className="card">
          <Link href="/recetas">Todas las recetas</Link>
          <div className="meta">{recetas.length} recetas · filtra por tipo de comida y alérgenos</div>
        </div>
        <div className="card">
          <Link href="/menus">Menús semanales</Link>
          <div className="meta">
            {menus.length} menús · cada uno con su lista de compras
          </div>
        </div>
        <div className="card">
          <Link href="/tecnicas">Técnicas de cocina</Link>
          <div className="meta">{tecnicas.length} técnicas</div>
        </div>
      </div>
    </>
  );
}
