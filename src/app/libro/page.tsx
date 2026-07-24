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
      <section className="home-hero">
        <p className="home-hero__eyebrow">Por Amneris</p>
        <h1 className="home-hero__title">Bocaditos del Corazón</h1>
        <p className="home-hero__lede">
          Guía de alimentación complementaria para bebés de 6 a 24 meses. Cada
          receta se adapta a las tres etapas — solo cambia la textura y la
          porción.
        </p>
      </section>

      <section aria-labelledby="home-explore">
        <h2 id="home-explore" className="section-title">Explora el libro</h2>
        <ul className="grid tile-grid">
          <li className="tile">
            <Link href="/recetas" className="tile__link">
              <span className="tile__title">Todas las recetas</span>
              <span className="tile__count">{recetas.length}</span>
              <span className="tile__meta">Busca por título, ingrediente o alérgeno.</span>
            </Link>
          </li>
          <li className="tile">
            <Link href="/menus" className="tile__link">
              <span className="tile__title">Menús semanales</span>
              <span className="tile__count">{menus.length}</span>
              <span className="tile__meta">Cada menú incluye su lista de compras.</span>
            </Link>
          </li>
          <li className="tile">
            <Link href="/tecnicas" className="tile__link">
              <span className="tile__title">Técnicas de cocina</span>
              <span className="tile__count">{tecnicas.length}</span>
              <span className="tile__meta">Métodos base del libro.</span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="home-etapas">
        <h2 id="home-etapas" className="section-title">Sobre las etapas</h2>
        <p className="muted section-lede">
          La etapa activa se elige en la barra inferior y cambia la textura y
          porción de cada receta. Cada etapa tiene además su propia página con
          contexto y guía.
        </p>
        <ul className="grid etapa-grid">
          {etapasOrdenadas.map((etapa) => (
            <li
              key={etapa.id}
              className="etapa-tile"
              style={{
                ["--tile-primary" as string]: etapa.paleta.primary,
                ["--tile-soft" as string]: etapa.paleta.soft,
                ["--tile-ink" as string]: etapa.paleta.ink,
              }}
            >
              <Link href={`/etapas/${etapa.id}`} className="etapa-tile__link">
                <span className="etapa-tile__num">{etapa.orden}</span>
                <span className="etapa-tile__body">
                  <span className="etapa-tile__title">{etapa.nombre}</span>
                  <span className="etapa-tile__meta">{etapa.rango_edad}</span>
                  <span className="etapa-tile__textura">{etapa.textura}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
