import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";

export default async function TecnicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tecnica, recetas] = await Promise.all([
    repo.getTecnica(slug),
    repo.getRecetas(),
  ]);
  if (!tecnica) notFound();

  const usadaEn = recetas.filter((r) =>
    r.receta_tecnicas.some((rt) => rt.tecnica_id === slug)
  );

  return (
    <article className="tecnica">
      <p className="receta__back">
        <Link href="/tecnicas">← Todas las técnicas</Link>
      </p>
      <header className="page-header">
        <p className="page-header__eyebrow">Técnica</p>
        <h1 className="page-header__title">{tecnica.nombre}</h1>
        {tecnica.seccion_origen && (
          <p className="page-header__lede muted">Origen: {tecnica.seccion_origen}</p>
        )}
      </header>

      {tecnica.descripcion ? (
        <p className="tecnica__desc">{tecnica.descripcion}</p>
      ) : (
        <p className="empty">
          Esta técnica todavía no tiene descripción. Se puede completar desde la
          interfaz de autoría.
        </p>
      )}

      <h2 className="section-title">Recetas que la usan ({usadaEn.length})</h2>
      {usadaEn.length === 0 ? (
        <p className="muted">Ninguna receta usa esta técnica.</p>
      ) : (
        <ul className="link-list">
          {usadaEn.map((r) => (
            <li key={r.id}>
              <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
