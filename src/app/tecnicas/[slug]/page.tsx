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
    <>
      <p className="muted">
        <Link href="/tecnicas">← Todas las técnicas</Link>
      </p>
      <h1>{tecnica.nombre}</h1>
      {tecnica.seccion_origen && (
        <p className="muted">Origen: {tecnica.seccion_origen}</p>
      )}
      {tecnica.descripcion ? (
        <p>{tecnica.descripcion}</p>
      ) : (
        <p className="empty">
          Esta técnica todavía no tiene descripción. Se puede completar desde la
          interfaz de autoría.
        </p>
      )}

      <h2>Recetas que la usan ({usadaEn.length})</h2>
      {usadaEn.length === 0 ? (
        <p className="muted">Ninguna receta usa esta técnica.</p>
      ) : (
        <ul>
          {usadaEn.map((r) => (
            <li key={r.id}>
              <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
