import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { GuiaBloque } from "@/components/guia-bloque";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = await repo.getGuia(slug);
  if (!g) return {};
  return { title: g.titulo, description: g.subtitulo ?? undefined };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = await repo.getGuia(slug);
  if (!g) notFound();

  const backHref = `/colecciones/${g.coleccionId}`;
  return (
    <article className="guia-page">
      <p className="guia-page__back">
        <Link href={backHref}>← Volver a la colección</Link>
      </p>
      <header className="guia-page__header">
        {g.codigo && <p className="muted">{g.codigo}</p>}
        <h1>{g.titulo}</h1>
        {g.subtitulo && <p className="section-lede">{g.subtitulo}</p>}
      </header>
      <div className="guia-page__body">
        {g.bloques.length === 0 ? (
          <p className="muted">Guía aún sin contenido.</p>
        ) : (
          g.bloques.map((b, i) => <GuiaBloque key={i} bloque={b} />)
        )}
      </div>
    </article>
  );
}
