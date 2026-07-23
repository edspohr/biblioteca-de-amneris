import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { RecetaVarianteTabs } from "./variante-tabs";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function RecetaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [receta, ingredientes, alergenos, tecnicas, etapas] = await Promise.all([
    repo.getReceta(slug),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
    repo.getEtapas(),
  ]);
  if (!receta) notFound();

  const ingById = new Map(ingredientes.map((i) => [i.id, i]));
  const alergById = new Map(alergenos.map((a) => [a.id, a]));
  const tecById = new Map(tecnicas.map((t) => [t.id, t]));

  return (
    <article className="receta">
      <p className="receta__back">
        <Link href="/recetas">← Todas las recetas</Link>
      </p>

      <header className="receta__hero">
        {receta.foto ? (
          <div className="receta__photo">
            <Image
              src={receta.foto}
              alt={receta.titulo}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              priority
            />
          </div>
        ) : null}
        <div className="receta__hero-body">
          <p className="receta__eyebrow">
            {TIPOS_LABEL[receta.tipo_comida] ?? receta.tipo_comida}
            {receta.numero != null ? ` · Receta ${receta.numero}` : ""}
          </p>
          <h1 className="receta__title">{receta.titulo}</h1>
          <ul className="receta__meta">
            {receta.minutos_prep != null && (
              <li>
                <span aria-hidden="true">⏱</span> {receta.minutos_prep} min
              </li>
            )}
            {receta.kcal_100g != null && (
              <li>
                <span aria-hidden="true">🔥</span> {receta.kcal_100g} kcal / 100 g
              </li>
            )}
            {receta.congelable === true && (
              <li>
                <span aria-hidden="true">🧊</span> Congelable
              </li>
            )}
          </ul>
        </div>
      </header>

      <RecetaVarianteTabs receta={receta} etapas={etapas} />

      <section className="receta__section" aria-labelledby="sec-ing">
        <h2 id="sec-ing" className="receta__section-title">Ingredientes</h2>
        {receta.receta_ingredientes.length === 0 ? (
          <p className="muted">Sin ingredientes registrados.</p>
        ) : (
          <ul className="ingredient-list">
            {receta.receta_ingredientes.map((ri, idx) => {
              const ing = ingById.get(ri.ingrediente_id);
              return (
                <li key={`${ri.ingrediente_id}-${idx}`} className="ingredient-list__row">
                  <span className="ingredient-list__name">
                    {ing?.nombre ?? ri.ingrediente_id}
                  </span>
                  <span className="ingredient-list__qty">
                    {ri.cantidad != null ? ri.cantidad : ""}
                    {ri.unidad ? ` ${ri.unidad}` : ""}
                  </span>
                  {ri.nota && (
                    <span className="ingredient-list__note">{ri.nota}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="receta__section" aria-labelledby="sec-prep">
        <h2 id="sec-prep" className="receta__section-title">Preparación</h2>
        {receta.pasos.length === 0 ? (
          <p className="muted">Sin pasos registrados.</p>
        ) : (
          <ol className="steps">
            {receta.pasos.map((p, i) => (
              <li key={i} className="steps__item">
                <span className="steps__num" aria-hidden="true">{i + 1}</span>
                <span className="steps__text">{p}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="receta__section receta__section--info" aria-labelledby="sec-info">
        <h2 id="sec-info" className="receta__section-title">Información</h2>
        <dl className="info-grid">
          {receta.conservacion && (
            <div className="info-grid__item">
              <dt>Conservación</dt>
              <dd>{receta.conservacion}</dd>
            </div>
          )}
          {receta.receta_alergenos.length > 0 && (
            <div className="info-grid__item">
              <dt>Alérgenos</dt>
              <dd>
                {receta.receta_alergenos.map((ra) => {
                  const a = alergById.get(ra.alergeno_id);
                  return a ? (
                    <span key={ra.alergeno_id} className="chip chip--warn">
                      {a.nombre}
                    </span>
                  ) : null;
                })}
              </dd>
            </div>
          )}
          {receta.receta_tecnicas.length > 0 && (
            <div className="info-grid__item">
              <dt>Técnicas</dt>
              <dd>
                {receta.receta_tecnicas.map((rt, idx) => {
                  const t = tecById.get(rt.tecnica_id);
                  if (!t) return null;
                  return (
                    <span key={rt.tecnica_id}>
                      {idx > 0 && ", "}
                      <Link href={`/tecnicas/${t.id}`}>{t.nombre}</Link>
                    </span>
                  );
                })}
              </dd>
            </div>
          )}
          {receta.vitaminas.length > 0 && (
            <div className="info-grid__item">
              <dt>Vitaminas</dt>
              <dd>
                {receta.vitaminas.map((v) => (
                  <span key={v} className="chip">
                    {v}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {receta.notas && (
            <div className="info-grid__item info-grid__item--wide">
              <dt>Notas</dt>
              <dd>{receta.notas}</dd>
            </div>
          )}
        </dl>
      </section>
    </article>
  );
}
