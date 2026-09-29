import type { CSSProperties } from "react";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { verifySession } from "@/lib/auth/session";
import { ColeccionCard } from "@/components/coleccion-card";
import { ColeccionPortada } from "@/components/coleccion-portada";
import {
  TIPO_LABEL,
  datosColeccion,
  esNueva,
  estadoEfectivo,
  hoyISO,
  tonoStyle,
} from "@/lib/colecciones";

export default async function HomePage() {
  const [etapas, recetas, menus, tecnicas, colecciones, guias, planes, session] =
    await Promise.all([
      repo.getEtapas(),
      repo.getRecetas(),
      repo.getMenus(),
      repo.getTecnicas(),
      // Colecciones puede estar vacía todavía si el seed no corrió; tolera errores.
      repo.getColecciones().catch(() => []),
      repo.getGuias().catch(() => []),
      repo.getPlanes().catch(() => []),
      verifySession(),
    ]);
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const isSuperadmin = session?.superadmin === true;
  const hoy = hoyISO();
  const contenido = { colecciones, recetas, menus, guias, planes };

  const visibles = colecciones
    .map((c) => ({ c, estado: estadoEfectivo(c, hoy), datos: datosColeccion(c, contenido) }))
    .filter((x) => x.estado !== "oculta" || isSuperadmin)
    .sort((a, b) => a.c.orden - b.c.orden);
  const disponibles = visibles.filter((x) => x.estado !== "proximamente");
  const proximas = visibles.filter((x) => x.estado === "proximamente");

  // The latest delivery leads the page: most recent launch date, then the
  // highest `orden` (collections are appended in release order).
  const destacada = [...disponibles]
    .filter((x) => x.estado === "publicada")
    .sort(
      (a, b) =>
        (b.c.fechaLanzamiento ?? "").localeCompare(a.c.fechaLanzamiento ?? "") ||
        b.c.orden - a.c.orden
    )[0];

  return (
    <>
      <header className="libro-intro">
        <p className="libro-intro__eyebrow">La Biblioteca de Amneris</p>
        <h1 className="libro-intro__title">Alimentar a tu bebé, resuelto.</h1>
      </header>

      {destacada && (
        <section
          className="destacada"
          aria-labelledby="destacada-title"
          style={tonoStyle(destacada.c) as CSSProperties}
        >
          <Link href={`/colecciones/${destacada.c.id}`} className="destacada__cover" tabIndex={-1}>
            <ColeccionPortada coleccion={destacada.c} dato={destacada.datos[0]} size="hero" />
          </Link>
          <div className="destacada__body">
            <p className="destacada__eyebrow">
              {esNueva(destacada.c, hoy) ? (
                <span className="destacada__new">Nuevo</span>
              ) : null}
              {esNueva(destacada.c, hoy) ? "Recién llegada a tu biblioteca" : "Lo más reciente"}
              {" · "}
              {TIPO_LABEL[destacada.c.tipo]}
            </p>
            <h2 id="destacada-title" className="destacada__title">
              {destacada.c.nombre}
            </h2>
            <p className="destacada__bajada">{destacada.c.bajada}</p>
            {destacada.c.descripcionCorta && (
              <p className="destacada__desc">{destacada.c.descripcionCorta}</p>
            )}
            <ul className="datos" aria-label="En esta colección">
              {destacada.datos.slice(0, 4).map((d) => (
                <li key={d.label}>
                  <strong>{d.valor}</strong>
                  <span>{d.label}</span>
                </li>
              ))}
            </ul>
            <Link href={`/colecciones/${destacada.c.id}`} className="button button--primary destacada__cta">
              Empezar
            </Link>
          </div>
        </section>
      )}

      {disponibles.length > 0 && (
        <section aria-labelledby="home-colecciones">
          <div className="shelf-head">
            <h2 id="home-colecciones" className="section-title">
              Tu biblioteca
            </h2>
            <p className="muted shelf-head__lede">
              {disponibles.length === 1
                ? "Una colección disponible."
                : `${disponibles.length} colecciones disponibles.`}{" "}
              Todas incluidas en tu suscripción.
            </p>
          </div>
          <ul className="shelf">
            {disponibles.map(({ c, datos }) => (
              <li key={c.id}>
                <ColeccionCard coleccion={c} datos={datos} isSuperadmin={isSuperadmin} hoy={hoy} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {proximas.length > 0 && (
        <section aria-labelledby="home-proximas" className="proximas">
          <h2 id="home-proximas" className="section-title">
            Lo que viene
          </h2>
          <p className="muted section-lede">
            Cada nueva colección llega sola a tu biblioteca, sin pagar extra.
          </p>
          <ul className="shelf shelf--soon">
            {proximas.map(({ c, datos }) => (
              <li key={c.id}>
                <ColeccionCard coleccion={c} datos={datos} isSuperadmin={isSuperadmin} hoy={hoy} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="home-explore">
        <h2 id="home-explore" className="section-title">Explora todo</h2>
        <ul className="explora">
          <li>
            <Link href="/recetas" className="explora__link">
              <strong>{recetas.length}</strong>
              <span>recetas</span>
            </Link>
          </li>
          <li>
            <Link href="/menus" className="explora__link">
              <strong>{menus.length}</strong>
              <span>menús</span>
            </Link>
          </li>
          <li>
            <Link href="/tecnicas" className="explora__link">
              <strong>{tecnicas.length}</strong>
              <span>técnicas</span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="home-etapas">
        <h2 id="home-etapas" className="section-title">Sobre las etapas</h2>
        <p className="muted section-lede">
          La etapa activa se elige en la barra de etapas y cambia la textura y
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
