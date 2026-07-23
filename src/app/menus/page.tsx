import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function MenusPage() {
  const [menus, etapas] = await Promise.all([repo.getMenus(), repo.getEtapas()]);
  const etapaById = new Map(etapas.map((e) => [e.id, e]));

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
        <p className="page-header__eyebrow">Menús</p>
        <h1 className="page-header__title">Menús semanales</h1>
        <p className="page-header__lede muted">
          {menus.length} menús · agrupados por etapa. Cada uno incluye la lista
          de compras derivada de sus recetas.
        </p>
      </header>

      {etapasOrdenadas.map((etapa) => {
        const list = grouped.get(etapa.id) ?? [];
        if (list.length === 0) return null;
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
            <ul className="grid tile-grid">
              {list.map((m) => (
                <li key={m.id} className="tile tile--menu">
                  <Link href={`/menus/${m.id}`} className="tile__link">
                    <span className="tile__title">{m.nombre}</span>
                    <span className="tile__meta">
                      {m.menu_recetas.length} recetas · {etapaById.get(m.etapa_id)?.rango_edad}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
