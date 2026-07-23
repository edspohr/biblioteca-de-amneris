import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function EtapaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [etapa, recetas, porciones] = await Promise.all([
    repo.getEtapa(slug),
    repo.getRecetas(),
    repo.getPorcionesTexturas(),
  ]);
  if (!etapa) notFound();

  const scoped: CSSProperties = {
    ["--etapa-primary" as string]: etapa.paleta.primary,
    ["--etapa-accent" as string]: etapa.paleta.accent,
    ["--etapa-soft" as string]: etapa.paleta.soft,
    ["--etapa-ink" as string]: etapa.paleta.ink,
  };

  return (
    <div style={scoped}>
      <p className="receta__back">
        <Link href="/">← Inicio</Link>
      </p>
      <header className="page-header">
        <p className="page-header__eyebrow">Etapa {etapa.orden}</p>
        <h1 className="page-header__title">{etapa.nombre}</h1>
        <p className="page-header__lede muted">
          {etapa.rango_edad} · {etapa.textura}
        </p>
      </header>
      {etapa.descripcion && <p>{etapa.descripcion}</p>}

      {porciones.length > 0 && (
        <>
          <h2>Porciones y texturas por etapa</h2>
          <ul className="data-list" role="list">
            {porciones.map((p, i) => (
              <li key={i} className="data-list__item">
                <div className="data-list__title">{p.etapa_id}</div>
                <dl>
                  <div>
                    <dt>Rango de edad</dt>
                    <dd>{p.rango_edad}</dd>
                  </div>
                  <div>
                    <dt>Porción</dt>
                    <dd>{p.porcion}</dd>
                  </div>
                  <div>
                    <dt>Textura</dt>
                    <dd>{p.textura}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Recetas ({recetas.length})</h2>
      <p className="muted">
        Todas las recetas aplican a las 3 etapas. Aquí las verás con la textura y
        porción correspondientes a <strong>{etapa.nombre.toLowerCase()}</strong>.
      </p>
      {recetas.length === 0 ? (
        <p className="empty">Sin recetas registradas.</p>
      ) : (
        <ul className="grid recipe-grid">
          {recetas.map((r) => {
            const v = r.variantes[etapa.id];
            return (
              <li key={r.id} className="card recipe-card">
                <Link href={`/recetas/${r.id}`} className="recipe-card__link">
                  {r.foto ? (
                    <div className="recipe-card__photo">
                      <Image
                        src={r.foto}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="recipe-card__photo recipe-card__photo--placeholder" aria-hidden="true" />
                  )}
                  <span className="recipe-card__title">{r.titulo}</span>
                  <span className="meta">
                    {TIPOS_LABEL[r.tipo_comida] ?? r.tipo_comida}
                    {r.minutos_prep != null ? ` · ${r.minutos_prep} min` : ""}
                  </span>
                  {v && (
                    <span className="meta meta--variant">
                      <strong>Textura:</strong> {v.textura} · <strong>Porción:</strong> {v.porcion}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
