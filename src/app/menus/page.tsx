import type { CSSProperties } from "react";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { getSessionWithProfile } from "@/lib/auth/session";
import {
  coleccionDeMenu,
  estadoEfectivo,
  hoyISO,
  iconoDe,
  numeroSemana,
  tonoStyle,
} from "@/lib/colecciones";
import type { Coleccion, Menu } from "@/lib/schema";
import { MenuTiles } from "./menu-tiles";

export default async function MenusPage() {
  const [menus, etapas, colecciones, ctx] = await Promise.all([
    repo.getMenus(),
    repo.getEtapas(),
    repo.getColecciones().catch(() => []),
    getSessionWithProfile(),
  ]);
  const hasFullAccess = ctx?.access.hasFullAccess ?? false;
  const isSuperadmin = ctx?.session.superadmin === true;
  const hoy = hoyISO();

  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);
  const grupos: { coleccion: Coleccion | null; menus: Menu[] }[] = [...colecciones]
    .filter((c) => estadoEfectivo(c, hoy) === "publicada" || isSuperadmin)
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({
      coleccion: c,
      menus: menus.filter((m) => coleccionDeMenu(m, colecciones) === c.id),
    }))
    .filter((g) => g.menus.length > 0);
  // Menus whose collection isn't loaded (e.g. before the colecciones seed).
  const sinColeccion = menus.filter((m) => {
    const id = coleccionDeMenu(m, colecciones);
    return !id || !colecciones.some((c) => c.id === id);
  });
  if (sinColeccion.length > 0) grupos.push({ coleccion: null, menus: sinColeccion });

  const total = grupos.reduce((n, g) => n + g.menus.length, 0);
  let inviteShown = false;

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">La biblioteca · todas las colecciones</p>
        <h1 className="page-header__title">Menús semanales</h1>
        <p className="page-header__lede muted">
          {total} menús · agrupados por colección y etapa. Cada uno incluye la
          lista de compras derivada de sus recetas.
        </p>
      </header>

      {grupos.map(({ coleccion, menus: list }) => (
        <section
          key={coleccion?.id ?? "otros"}
          className="menus-col"
          style={coleccion ? (tonoStyle(coleccion) as CSSProperties) : undefined}
        >
          {coleccion ? (
            <h2 className="menus-col__title">
              <span aria-hidden="true">{iconoDe(coleccion)}</span>
              <Link href={`/colecciones/${coleccion.id}`}>{coleccion.nombre}</Link>
            </h2>
          ) : (
            <h2 className="menus-col__title">Otros menús</h2>
          )}
          {etapasOrdenadas.map((etapa) => {
            const deEtapa = list
              .filter((m) => m.etapa_id === etapa.id)
              .sort(
                (a, b) =>
                  (numeroSemana(a) ?? 99) - (numeroSemana(b) ?? 99) ||
                  (a.codigo ?? a.nombre).localeCompare(b.codigo ?? b.nombre)
              );
            if (deEtapa.length === 0) return null;
            const showInvite = !hasFullAccess && !inviteShown;
            if (showInvite) inviteShown = true;
            return (
              <div
                key={etapa.id}
                className="menu-etapa-section"
                style={{
                  ["--etapa-primary" as string]: etapa.paleta.primary,
                  ["--etapa-soft" as string]: etapa.paleta.soft,
                  ["--etapa-ink" as string]: etapa.paleta.ink,
                }}
              >
                <h3 className="menus-col__etapa">
                  {etapa.nombre} <span className="muted">· {etapa.rango_edad}</span>
                </h3>
                <MenuTiles
                  hasFullAccess={hasFullAccess}
                  showInlineInvite={showInvite}
                  tiles={deEtapa.map((m) => ({
                    id: m.id,
                    // "Semana 1 · Etapa 1" → "Semana 1": the etapa is already the heading.
                    nombre: m.nombre.replace(/\s*·\s*Etapa\s*\d+\s*$/i, ""),
                    recetas: m.celdas?.length ?? m.menu_recetas.length,
                    rangoEdad: undefined,
                  }))}
                />
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
