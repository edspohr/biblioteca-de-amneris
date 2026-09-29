import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { getSessionWithProfile } from "@/lib/auth/session";
import { ColeccionPortada } from "@/components/coleccion-portada";
import { RecetasBrowser } from "@/app/recetas/browser";
import type { Coleccion, Etapa, Guia, Menu, Utensilio } from "@/lib/schema";
import {
  TIPO_LABEL,
  datosColeccion,
  diasParaLanzamiento,
  esNueva,
  estadoEfectivo,
  formatFecha,
  hoyISO,
  menusDeColeccion,
  numeroSemana,
  recetasDeColeccion,
  tonoStyle,
} from "@/lib/colecciones";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await repo.getColeccion(slug);
  if (!c) return {};
  return { title: c.nombre, description: c.bajada };
}

export default async function ColeccionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, ctx, colecciones, recetas, menus, guias, planes] = await Promise.all([
    repo.getColeccion(slug),
    getSessionWithProfile(),
    repo.getColecciones().catch(() => []),
    repo.getRecetas(),
    repo.getMenus(),
    repo.getGuias().catch(() => []),
    repo.getPlanes().catch(() => []),
  ]);
  if (!c) notFound();

  const isSuperadmin = ctx?.session.superadmin === true;
  const hoy = hoyISO();
  const estado = estadoEfectivo(c, hoy);
  if (estado === "oculta" && !isSuperadmin) notFound();

  const datos = datosColeccion(c, { colecciones, recetas, menus, guias, planes });
  const nueva = esNueva(c, hoy);
  // Superadmins preview the full content of upcoming collections too.
  const mostrarContenido = estado === "publicada" || isSuperadmin;

  return (
    <div className="coleccion-page" style={tonoStyle(c) as CSSProperties}>
      <p className="coleccion-page__back">
        <Link href="/libro">← La biblioteca</Link>
      </p>

      <header className="col-hero">
        <div className="col-hero__cover">
          <ColeccionPortada coleccion={c} dato={datos[0]} size="hero" apagada={estado === "proximamente"} />
        </div>
        <div className="col-hero__body">
          <p className="col-hero__eyebrow">
            {nueva && <span className="destacada__new">Nuevo</span>}
            {TIPO_LABEL[c.tipo]}
            {estado === "oculta" ? " · Solo tú la ves" : ""}
            {estado === "proximamente" ? " · Próximamente" : ""}
          </p>
          <h1 className="col-hero__title">{c.nombre}</h1>
          <p className="col-hero__bajada">{c.bajada}</p>
          {c.descripcionCorta && <p className="col-hero__desc">{c.descripcionCorta}</p>}
          {estado !== "proximamente" && (
            <ul className="datos" aria-label="En esta colección">
              {datos.slice(0, 4).map((d) => (
                <li key={d.label}>
                  <strong>{d.valor}</strong>
                  <span>{d.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {estado === "proximamente" && <ProximamenteSection coleccion={c} hoy={hoy} />}
      {mostrarContenido && c.tipo === "recetario" && (
        <RecetarioSection
          coleccion={c}
          colecciones={colecciones}
          menus={menus}
          hasFullAccess={ctx?.access.hasFullAccess ?? false}
        />
      )}
      {mostrarContenido && c.tipo === "plan" && (
        <PlanSection
          coleccion={c}
          colecciones={colecciones}
          menus={menus}
          guias={guias}
          hasFullAccess={ctx?.access.hasFullAccess ?? false}
        />
      )}
      {mostrarContenido && c.tipo === "guia" && (
        <GuiasGrid guias={guias.filter((g) => g.coleccionId === c.id)} />
      )}
    </div>
  );
}

function ProximamenteSection({ coleccion, hoy }: { coleccion: Coleccion; hoy: string }) {
  const dias = diasParaLanzamiento(coleccion, hoy);
  return (
    <section className="proxima-box">
      {dias != null && coleccion.fechaLanzamiento ? (
        <div className="proxima-box__count">
          <strong>{dias === 0 ? "Hoy" : dias}</strong>
          <span>{dias === 0 ? "llega a tu biblioteca" : dias === 1 ? "día para su llegada" : "días para su llegada"}</span>
          <small>{formatFecha(coleccion.fechaLanzamiento, hoy)}</small>
        </div>
      ) : (
        <div className="proxima-box__count">
          <strong>Pronto</strong>
          <span>en preparación</span>
        </div>
      )}
      <div>
        <h2 className="proxima-box__title">Ya es parte de tu suscripción</h2>
        <p>
          Amneris está terminando esta colección. Cuando esté lista aparecerá
          sola en tu biblioteca, sin pagar nada extra.
        </p>
        <p>
          <Link href="/libro">Mientras tanto, explora la biblioteca →</Link>
        </p>
      </div>
    </section>
  );
}

// -- Recetario ------------------------------------------------------------

async function RecetarioSection({
  coleccion,
  colecciones,
  menus,
  hasFullAccess,
}: {
  coleccion: Coleccion;
  colecciones: Coleccion[];
  menus: Menu[];
  hasFullAccess: boolean;
}) {
  const [recetas, ingredientes, alergenos, etapas] = await Promise.all([
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getEtapas(),
  ]);
  const enColeccion = recetasDeColeccion(coleccion.id, recetas);
  const menusCol = menusDeColeccion(coleccion, menus, colecciones);

  return (
    <>
      {menusCol.length > 0 && (
        <section className="col-section">
          <h2 className="col-section__title">
            Menús semanales <span className="col-section__count">{menusCol.length}</span>
          </h2>
          <p className="muted section-lede">Cada menú trae su lista de compras.</p>
          <MenusPorEtapa menus={menusCol} etapas={etapas} />
        </section>
      )}
      <section className="col-section">
        <h2 className="col-section__title">
          Las recetas <span className="col-section__count">{enColeccion.length}</span>
        </h2>
        <p className="muted section-lede">
          Cada receta se adapta a las tres etapas — solo cambia la textura y la porción.
        </p>
        <RecetasBrowser
          recetas={enColeccion}
          ingredientes={ingredientes}
          alergenos={alergenos}
          hasFullAccess={hasFullAccess}
          colecciones={colecciones}
          coleccionFija={coleccion.id}
        />
      </section>
    </>
  );
}

// -- Plan -----------------------------------------------------------------

async function PlanSection({
  coleccion,
  colecciones,
  menus,
  guias,
  hasFullAccess,
}: {
  coleccion: Coleccion;
  colecciones: Coleccion[];
  menus: Menu[];
  guias: Guia[];
  hasFullAccess: boolean;
}) {
  const [recetas, ingredientes, alergenos, etapas, utensilios] = await Promise.all([
    repo.getRecetas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getEtapas(),
    repo.getUtensilios().catch(() => []),
  ]);
  const menusPlan = menusDeColeccion(coleccion, menus, colecciones);
  const guiasPlan = guias.filter((g) => g.coleccionId === coleccion.id).sort((a, b) => a.orden - b.orden);
  const recetasPlan = recetasDeColeccion(coleccion.id, recetas);
  const cronograma = guiasPlan.find((g) => /cronograma/i.test(g.titulo));
  const equipamiento = guiasPlan.find((g) => /equipo|utensilio/i.test(g.titulo));
  const etapasConRendimiento = [...etapas]
    .sort((a, b) => a.orden - b.orden)
    .filter((e) => e.rendimientoMensualKg);

  // Number only the steps that actually render.
  const pasos = [
    utensilios.length > 0 && "Prepárate",
    cronograma && "Tu día de cocina",
    menusPlan.length > 0 && "Tus menús",
    recetasPlan.length > 0 && "Las recetas del plan",
    guiasPlan.length > 0 && "Guías",
  ].filter(Boolean) as string[];
  const Paso = ({ children }: { children: string }) => (
    <h2 className="col-section__title">
      <span className="col-step">{pasos.indexOf(children) + 1}</span>
      {children}
    </h2>
  );

  return (
    <>
      {utensilios.length > 0 && (
        <section className="col-section">
          <Paso>Prepárate</Paso>
          <p className="muted section-lede">Lo que conviene tener a mano antes del día de cocina.</p>
          <UtensiliosLista utensilios={utensilios.slice(0, 6)} />
          {utensilios.length > 6 && (
            <details className="utensilios-mas">
              <summary>Ver {utensilios.length - 6} más</summary>
              <UtensiliosLista utensilios={utensilios.slice(6)} />
            </details>
          )}
          {equipamiento && (
            <p className="col-section__more">
              <Link href={`/guias/${equipamiento.id}`}>Ver guía completa de equipamiento →</Link>
            </p>
          )}
        </section>
      )}

      {cronograma && (
        <section className="col-section">
          <Paso>Tu día de cocina</Paso>
          <Link href={`/guias/${cronograma.id}`} className="col-feature">
            <span className="col-feature__icon" aria-hidden="true">⏱</span>
            <span>
              <strong>{cronograma.titulo}</strong>
              <span className="col-feature__sub">
                {cronograma.subtitulo ?? "El paso a paso de la jornada, fase por fase."}
              </span>
            </span>
            <span className="col-feature__go" aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      {menusPlan.length > 0 && (
        <section className="col-section">
          <Paso>Tus menús</Paso>
          <p className="muted section-lede">
            Cuatro semanas por etapa, con desayuno, almuerzo y cena de cada día.
          </p>
          <MenusPorEtapa menus={menusPlan} etapas={etapas} />
        </section>
      )}

      {recetasPlan.length > 0 && (
        <section className="col-section">
          <Paso>Las recetas del plan</Paso>
          <RecetasBrowser
            recetas={recetasPlan}
            ingredientes={ingredientes}
            alergenos={alergenos}
            hasFullAccess={hasFullAccess}
            colecciones={colecciones}
            coleccionFija={coleccion.id}
          />
        </section>
      )}

      {guiasPlan.length > 0 && (
        <section className="col-section">
          <Paso>Guías</Paso>
          <GuiasGrid guias={guiasPlan} />
        </section>
      )}

      {etapasConRendimiento.length > 0 && (
        <section className="col-section">
          <h2 className="col-section__title">Tu producción del mes</h2>
          <ul className="rendimiento-grid">
            {etapasConRendimiento.map((e) => {
              const r = e.rendimientoMensualKg!;
              return (
                <li
                  key={e.id}
                  style={{
                    ["--tile-soft" as string]: e.paleta.soft,
                    ["--tile-ink" as string]: e.paleta.ink,
                  }}
                >
                  <span className="rendimiento-grid__etapa">{e.nombre}</span>
                  <strong>{r.total.toFixed(1)} kg</strong>
                  <span className="rendimiento-grid__det">
                    Desayunos {r.desayunos.toFixed(1)} · Almuerzos {r.almuerzos.toFixed(1)} · Cenas{" "}
                    {r.cenas.toFixed(1)} kg
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

// -- Shared blocks --------------------------------------------------------

function UtensiliosLista({ utensilios }: { utensilios: Utensilio[] }) {
  return (
    <ul className="utensilios-grid">
      {utensilios.map((u) => (
        <li key={u.id} className="utensilio-card">
          <span className="utensilio-card__check" aria-hidden="true" />
          <span>
            <strong>{u.nombre}</strong>
            <span className="utensilio-card__para">{u.paraQue}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function MenusPorEtapa({ menus, etapas }: { menus: Menu[]; etapas: Etapa[] }) {
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  return (
    <div className="menus-etapas">
      {ordenadas.map((e) => {
        const list = menus
          .filter((m) => m.etapa_id === e.id)
          .sort(
            (a, b) =>
              (numeroSemana(a) ?? 99) - (numeroSemana(b) ?? 99) ||
              (a.codigo ?? a.id).localeCompare(b.codigo ?? b.id)
          );
        if (list.length === 0) return null;
        return (
          <div
            key={e.id}
            className="menus-etapa"
            style={{
              ["--tile-primary" as string]: e.paleta.primary,
              ["--tile-soft" as string]: e.paleta.soft,
              ["--tile-ink" as string]: e.paleta.ink,
            }}
          >
            <p className="menus-etapa__head">
              <span className="menus-etapa__num">{e.orden}</span>
              <strong>{e.nombre}</strong>
              <span className="muted">{e.rango_edad}</span>
            </p>
            <ul className="menus-etapa__list">
              {list.map((m) => {
                const comidas = m.celdas?.length ?? m.menu_recetas.length;
                // Plan menus carry `semana`; older menus only have a name.
                const semana = numeroSemana(m);
                return (
                  <li key={m.id}>
                    <Link href={`/menus/${m.id}`} className="semana-tile">
                      {semana != null ? (
                        <>
                          <span className="semana-tile__label">Semana</span>
                          <span className="semana-tile__num">{semana}</span>
                        </>
                      ) : (
                        <span className="semana-tile__name">{m.nombre}</span>
                      )}
                      <span className="semana-tile__meta">
                        {comidas} {m.celdas ? "comidas" : "recetas"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function GuiasGrid({ guias }: { guias: Guia[] }) {
  if (guias.length === 0) return <p className="muted">Sin guías todavía.</p>;
  return (
    <ul className="guias-grid">
      {guias.map((g, i) => (
        <li key={g.id}>
          <Link href={`/guias/${g.id}`} className="guia-card">
            <span className="guia-card__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="guia-card__title">{g.titulo || g.codigo}</span>
            {g.subtitulo && <span className="guia-card__sub">{g.subtitulo}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
