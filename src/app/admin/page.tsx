import type { CSSProperties } from "react";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { getUserMetrics, listAllUsers } from "@/lib/users/service";
import { verifySession } from "@/lib/auth/session";
import { ColeccionPortada } from "@/components/coleccion-portada";
import type { Coleccion, Etapa, Guia, Menu, Receta } from "@/lib/schema";
import {
  datosColeccion,
  diasParaLanzamiento,
  esNueva,
  estadoEfectivo,
  formatFecha,
  hoyISO,
  menusDeColeccion,
  recetasDeColeccion,
  tonoStyle,
} from "@/lib/colecciones";

export default async function AdminHome() {
  const [recetas, menus, ingredientes, alergenos, tecnicas, colecciones, utensilios, guias, planes, etapas, users] =
    await Promise.all([
      repo.getRecetas(),
      repo.getMenus(),
      repo.getIngredientes(),
      repo.getAlergenos(),
      repo.getTecnicas(),
      repo.getColecciones().catch(() => []),
      repo.getUtensilios().catch(() => []),
      repo.getGuias().catch(() => []),
      repo.getPlanes().catch(() => []),
      repo.getEtapas(),
      listAllUsers(),
    ]);
  const session = await verifySession();
  const nombre = session?.name?.split(" ")[0];
  const userMetrics = await getUserMetrics(users);
  const hoy = hoyISO();

  // Next launch: upcoming collections first (soonest date), then drafts.
  const proxima = [...colecciones]
    .filter((c) => estadoEfectivo(c, hoy) !== "publicada")
    .sort((a, b) => {
      const rank = (c: Coleccion) => (estadoEfectivo(c, hoy) === "proximamente" ? 0 : 1);
      return (
        rank(a) - rank(b) ||
        (a.fechaLanzamiento ?? "9999").localeCompare(b.fechaLanzamiento ?? "9999") ||
        a.orden - b.orden
      );
    })[0];
  const recientes = colecciones.filter((c) => esNueva(c, hoy));

  const sinFoto = recetas.filter((r) => !r.foto);
  const alergenosPorRevisar = recetas.filter((r) => r.receta_alergenos.some((a) => a.inferido));
  const sinColeccion = recetas.filter((r) => (r.coleccionIds ?? []).length === 0);

  const pendientes = [
    {
      n: sinFoto.length,
      label: sinFoto.length === 1 ? "receta sin foto" : "recetas sin foto",
      href: "/admin/recetas?pendiente=sin-foto",
    },
    {
      n: alergenosPorRevisar.length,
      label: "con alérgenos sugeridos por revisar",
      href: "/admin/recetas?pendiente=alergenos",
    },
    {
      n: sinColeccion.length,
      label: sinColeccion.length === 1 ? "receta sin colección" : "recetas sin colección",
      href: "/admin/recetas?pendiente=sin-coleccion",
    },
  ].filter((p) => p.n > 0);

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Panel de autoría</p>
          <h1 className="admin-head__title">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
          <p className="admin-head__lede">Esto es lo que está pasando en tu biblioteca.</p>
        </div>
      </header>

      <div className="dash">
        {proxima && (
          <section className="dash-card dash-card--launch" style={tonoStyle(proxima) as CSSProperties}>
            <ProximoLanzamiento
              coleccion={proxima}
              hoy={hoy}
              recetas={recetas}
              menus={menus}
              guias={guias}
              etapas={etapas}
              colecciones={colecciones}
              dato={datosColeccion(proxima, { colecciones, recetas, menus, guias, planes })[0]}
            />
          </section>
        )}

        <section className="dash-card">
          <h2 className="dash-card__title">Pendientes</h2>
          {pendientes.length === 0 ? (
            <p className="dash-ok">✓ Todo al día. No hay nada pendiente.</p>
          ) : (
            <ul className="dash-todo">
              {pendientes.map((p) => (
                <li key={p.href}>
                  <Link href={p.href}>
                    <strong>{p.n}</strong> {p.label} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <h2 className="dash-card__title">Lectoras</h2>
          <ul className="dash-stats">
            <li>
              <strong>{userMetrics.total}</strong>
              <span>registradas</span>
            </li>
            <li>
              <strong>{userMetrics.newThisMonth}</strong>
              <span>nuevas este mes</span>
            </li>
          </ul>
          <p className="dash-card__more">
            <Link href="/admin/usuarios">Ver usuarios →</Link>
          </p>
        </section>

        {recientes.length > 0 && (
          <section className="dash-card">
            <h2 className="dash-card__title">Recién publicado</h2>
            <ul className="dash-list">
              {recientes.map((c) => (
                <li key={c.id}>
                  <Link href={`/colecciones/${c.id}`}>{c.nombre}</Link>
                  {c.fechaLanzamiento && (
                    <span className="muted"> · desde el {formatFecha(c.fechaLanzamiento, hoy)}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <h2 className="admin-section-title">Tu contenido</h2>
      <ul className="dash-counts">
        {[
          { href: "/admin/colecciones", label: "Colecciones", n: colecciones.length },
          { href: "/admin/recetas", label: "Recetas", n: recetas.length },
          { href: "/admin/menus", label: "Menús", n: menus.length },
          { href: "/admin/guias", label: "Guías", n: guias.length },
          { href: "/admin/ingredientes", label: "Ingredientes", n: ingredientes.length },
          { href: "/admin/alergenos", label: "Alérgenos", n: alergenos.length },
          { href: "/admin/tecnicas", label: "Técnicas", n: tecnicas.length },
          { href: "/admin/utensilios", label: "Utensilios", n: utensilios.length },
        ].map((x) => (
          <li key={x.href}>
            <Link href={x.href}>
              <strong>{x.n}</strong>
              <span>{x.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function ProximoLanzamiento({
  coleccion: c,
  hoy,
  recetas,
  menus,
  guias,
  etapas,
  colecciones,
  dato,
}: {
  coleccion: Coleccion;
  hoy: string;
  recetas: Receta[];
  menus: Menu[];
  guias: Guia[];
  etapas: Etapa[];
  colecciones: Coleccion[];
  dato: ReturnType<typeof datosColeccion>[number] | undefined;
}) {
  const estado = estadoEfectivo(c, hoy);
  const dias = diasParaLanzamiento(c, hoy);
  const recetasCol = recetasDeColeccion(c.id, recetas);
  const menusCol = menusDeColeccion(c, menus, colecciones);
  const guiasCol = guias.filter((g) => g.coleccionId === c.id);
  const sinFoto = recetasCol.filter((r) => !r.foto).length;
  const etapasSinMenu = etapas.filter((e) => !menusCol.some((m) => m.etapa_id === e.id));

  const checks: { ok: boolean; texto: string; href?: string }[] = [
    {
      ok: Boolean(c.fechaLanzamiento),
      texto: c.fechaLanzamiento ? `Fecha: ${formatFecha(c.fechaLanzamiento, hoy)}` : "Elegir fecha de lanzamiento",
      href: `/admin/colecciones/${c.id}`,
    },
    {
      ok: Boolean(c.descripcionCorta),
      texto: c.descripcionCorta ? "Descripción lista" : "Escribir la descripción",
      href: `/admin/colecciones/${c.id}`,
    },
  ];
  if (c.tipo !== "guia") {
    checks.push({
      ok: recetasCol.length > 0,
      texto: recetasCol.length ? `${recetasCol.length} recetas cargadas` : "Agregar recetas",
      href: `/admin/colecciones/${c.id}#contenido`,
    });
    if (recetasCol.length > 0) {
      checks.push({
        ok: sinFoto === 0,
        texto: sinFoto ? `${sinFoto} recetas sin foto` : "Todas las recetas con foto",
        href: `/admin/recetas?coleccion=${c.id}&pendiente=sin-foto`,
      });
    }
  }
  if (c.tipo === "plan") {
    checks.push({
      ok: etapasSinMenu.length === 0,
      texto:
        etapasSinMenu.length === 0
          ? `${menusCol.length} menús en las 3 etapas`
          : `Faltan menús en ${etapasSinMenu.map((e) => `etapa ${e.orden}`).join(", ")}`,
      href: "/admin/menus",
    });
    checks.push({
      ok: guiasCol.length > 0,
      texto: guiasCol.length ? `${guiasCol.length} guías` : "Agregar guías",
      href: "/admin/guias",
    });
  }
  checks.push({
    ok: c.estado === "programada" || c.estado === "publicada",
    texto:
      c.estado === "programada"
        ? "Publicación programada ✓"
        : c.estado === "oculta"
          ? "Está en borrador: anúnciala o prográmala"
          : "Anunciada: prográmala para que se publique sola",
    href: `/admin/colecciones/${c.id}`,
  });
  const listos = checks.filter((x) => x.ok).length;

  return (
    <div className="launch">
      <div className="launch__cover">
        <ColeccionPortada coleccion={c} dato={dato} />
      </div>
      <div className="launch__body">
        <p className="dash-card__eyebrow">
          {estado === "oculta" ? "Próxima colección · borrador" : "Próximo lanzamiento"}
        </p>
        <h2 className="launch__title">{c.nombre}</h2>
        {dias != null && (
          <p className="launch__count">
            <strong>{dias === 0 ? "Hoy" : dias}</strong>{" "}
            {dias === 0 ? "es el lanzamiento" : dias === 1 ? "día para el lanzamiento" : "días para el lanzamiento"}
          </p>
        )}
        <div className="launch__progress" aria-label={`${listos} de ${checks.length} listos`}>
          <span style={{ width: `${(listos / checks.length) * 100}%` }} />
        </div>
        <ul className="launch__checks">
          {checks.map((x) => (
            <li key={x.texto} data-ok={x.ok || undefined}>
              <span className="launch__check" aria-hidden="true">
                {x.ok ? "✓" : ""}
              </span>
              {x.href && !x.ok ? <Link href={x.href}>{x.texto}</Link> : x.texto}
            </li>
          ))}
        </ul>
        <p>
          <Link href={`/admin/colecciones/${c.id}`} className="button button--primary">
            Preparar colección
          </Link>
        </p>
      </div>
    </div>
  );
}
