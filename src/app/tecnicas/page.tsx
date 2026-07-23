import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function TecnicasPage() {
  const [tecnicas, recetas] = await Promise.all([repo.getTecnicas(), repo.getRecetas()]);
  const usoPorTecnica = new Map<string, number>();
  for (const r of recetas) {
    for (const rt of r.receta_tecnicas) {
      usoPorTecnica.set(rt.tecnica_id, (usoPorTecnica.get(rt.tecnica_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">Técnicas</p>
        <h1 className="page-header__title">Técnicas de cocina</h1>
        <p className="page-header__lede muted">
          {tecnicas.length} técnicas · {tecnicas.filter((t) => !t.descripcion).length} pendientes de describir.
        </p>
      </header>
      <ul className="grid tile-grid">
        {tecnicas
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((t) => (
            <li key={t.id} className="tile">
              <Link href={`/tecnicas/${t.id}`} className="tile__link">
                <span className="tile__title">{t.nombre}</span>
                <span className="tile__meta">
                  Usada en {usoPorTecnica.get(t.id) ?? 0} recetas
                </span>
                {t.descripcion ? (
                  <span className="tile__desc">{t.descripcion}</span>
                ) : (
                  <span className="tile__desc muted">Sin descripción aún</span>
                )}
              </Link>
            </li>
          ))}
      </ul>
    </>
  );
}
