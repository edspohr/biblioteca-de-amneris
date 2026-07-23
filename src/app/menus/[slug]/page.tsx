import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { computeListaCompras } from "@/lib/derived/lista-compras";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [menu, recetas, ingredientes, etapa] = await Promise.all([
    repo.getMenu(slug),
    repo.getRecetas(),
    repo.getIngredientes(),
    (async () => {
      const m = await repo.getMenu(slug);
      return m ? repo.getEtapa(m.etapa_id) : null;
    })(),
  ]);
  if (!menu) notFound();

  const recetaById = new Map(recetas.map((r) => [r.id, r]));
  const lista = computeListaCompras(menu, recetas, ingredientes);

  // Group menu_recetas by day, then by momento within day
  const porDia = new Map<string, { momento: string; receta_id: string }[]>();
  for (const mr of menu.menu_recetas) {
    const key = mr.dia ?? "Sin día";
    const arr = porDia.get(key) ?? [];
    arr.push({ momento: mr.momento, receta_id: mr.receta_id });
    porDia.set(key, arr);
  }
  const diasOrdenados = [...porDia.keys()].sort((a, b) => {
    const ia = DIAS.indexOf(a);
    const ib = DIAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <article
      className="menu"
      style={
        etapa
          ? ({
              ["--etapa-primary" as string]: etapa.paleta.primary,
              ["--etapa-soft" as string]: etapa.paleta.soft,
              ["--etapa-ink" as string]: etapa.paleta.ink,
            } as CSSProperties)
          : undefined
      }
    >
      <p className="receta__back">
        <Link href="/menus">← Todos los menús</Link>
      </p>
      <header className="page-header">
        <p className="page-header__eyebrow">Menú semanal</p>
        <h1 className="page-header__title">{menu.nombre}</h1>
        {etapa && (
          <p className="page-header__lede muted">
            <Link href={`/etapas/${etapa.id}`}>{etapa.nombre}</Link> ·{" "}
            {etapa.rango_edad}
          </p>
        )}
      </header>

      <h2 className="section-title">Plan semanal</h2>
      {diasOrdenados.length === 0 ? (
        <p className="empty">Este menú no tiene recetas asignadas.</p>
      ) : (
        <ul className="day-list" role="list">
          {diasOrdenados.map((dia) => {
            const rows = porDia.get(dia) ?? [];
            return (
              <li key={dia} className="day-list__day">
                <h3 className="day-list__title">{dia}</h3>
                <ul className="day-list__meals">
                  {rows.map((row, idx) => {
                    const r = recetaById.get(row.receta_id);
                    return (
                      <li key={`${dia}-${idx}`} className="day-list__meal">
                        <span className="day-list__momento">
                          {TIPOS_LABEL[row.momento] ?? row.momento}
                        </span>
                        <span className="day-list__receta">
                          {r ? (
                            <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
                          ) : (
                            <span className="muted">Receta no encontrada</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="section-title">Lista de compras</h2>
      <p className="muted">
        Calculada a partir de los ingredientes de las recetas del menú.
      </p>
      {Object.keys(lista.por_categoria).length === 0 ? (
        <p className="empty">No hay ingredientes para calcular.</p>
      ) : (
        <div className="shopping-list">
          {Object.entries(lista.por_categoria)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, items]) => (
              <section key={cat} className="shopping-list__cat">
                <h3 className="shopping-list__cat-title">{cat}</h3>
                <ul className="shopping-list__items">
                  {items.map((item) => (
                    <li key={item.ingrediente.id} className="shopping-list__item">
                      <span className="shopping-list__name">
                        {item.ingrediente.nombre}
                      </span>
                      {item.total_numerico.length > 0 && (
                        <span className="shopping-list__qty">
                          {item.total_numerico
                            .map((t) => `${round(t.cantidad)} ${t.unidad}`)
                            .join(" + ")}
                        </span>
                      )}
                      {item.cantidades.length > 0 && (
                        <span className="shopping-list__note muted">
                          {item.cantidades.join(", ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </article>
  );
}

function round(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return (Math.round(n * 100) / 100).toString();
}
