import { repo } from "@/lib/repo";
import { getSessionWithProfile } from "@/lib/auth/session";
import { SECCION_ACTIVA } from "@/lib/marca";
import { MenuTiles } from "./menu-tiles";

export default async function MenusPage() {
  const [menus, etapas, ctx] = await Promise.all([
    repo.getMenus(),
    repo.getEtapas(),
    getSessionWithProfile(),
  ]);
  const etapaById = new Map(etapas.map((e) => [e.id, e]));
  const hasFullAccess = ctx?.access.hasFullAccess ?? false;

  const grouped = new Map<string, typeof menus>();
  for (const m of menus) {
    const arr = grouped.get(m.etapa_id) ?? [];
    arr.push(m);
    grouped.set(m.etapa_id, arr);
  }

  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">Sección · {SECCION_ACTIVA.nombre}</p>
        <h1 className="page-header__title">Menús semanales</h1>
        <p className="page-header__lede muted">
          {menus.length} menús · agrupados por etapa. Cada uno incluye la lista
          de compras derivada de sus recetas.
        </p>
      </header>

      {(() => {
        let inviteShown = false;
        return etapasOrdenadas.map((etapa) => {
          const list = grouped.get(etapa.id) ?? [];
          if (list.length === 0) return null;
          const showInvite = !hasFullAccess && !inviteShown;
          if (showInvite) inviteShown = true;
          return (
            <section
              key={etapa.id}
              className="menu-etapa-section"
              style={{
                ["--etapa-primary" as string]: etapa.paleta.primary,
                ["--etapa-soft" as string]: etapa.paleta.soft,
                ["--etapa-ink" as string]: etapa.paleta.ink,
              }}
            >
              <h2 className="section-title">{etapa.nombre}</h2>
              <MenuTiles
                hasFullAccess={hasFullAccess}
                showInlineInvite={showInvite}
                tiles={list.map((m) => ({
                  id: m.id,
                  nombre: m.nombre,
                  recetas: m.menu_recetas.length,
                  rangoEdad: etapaById.get(m.etapa_id)?.rango_edad,
                }))}
              />
            </section>
          );
        });
      })()}
    </>
  );
}
