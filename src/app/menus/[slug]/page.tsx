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
    <>
      <p className="muted">
        <Link href="/menus">← Todos los menús</Link>
      </p>
      <h1>{menu.nombre}</h1>
      {etapa && (
        <p className="muted">
          <Link href={`/etapas/${etapa.id}`}>{etapa.nombre}</Link> · {etapa.rango_edad}
        </p>
      )}

      <h2>Plan semanal</h2>
      {diasOrdenados.length === 0 ? (
        <p className="empty">Este menú no tiene recetas asignadas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Día</th>
              <th>Momento</th>
              <th>Receta</th>
            </tr>
          </thead>
          <tbody>
            {diasOrdenados.flatMap((dia) =>
              (porDia.get(dia) ?? []).map((row, idx) => {
                const r = recetaById.get(row.receta_id);
                return (
                  <tr key={`${dia}-${idx}`}>
                    <td>{idx === 0 ? dia : ""}</td>
                    <td>{TIPOS_LABEL[row.momento] ?? row.momento}</td>
                    <td>
                      {r ? (
                        <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
                      ) : (
                        <span className="muted">Receta no encontrada</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      <h2>Lista de compras</h2>
      <p className="muted">
        Calculada a partir de los ingredientes de las recetas del menú.
      </p>
      {Object.keys(lista.por_categoria).length === 0 ? (
        <p className="empty">No hay ingredientes para calcular.</p>
      ) : (
        Object.entries(lista.por_categoria)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cat, items]) => (
            <div key={cat}>
              <h3>{cat}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item.ingrediente.id}>
                    <strong>{item.ingrediente.nombre}</strong>
                    {item.total_numerico.length > 0 && (
                      <>
                        {" — "}
                        {item.total_numerico
                          .map((t) => `${round(t.cantidad)} ${t.unidad}`)
                          .join(" + ")}
                      </>
                    )}
                    {item.cantidades.length > 0 && (
                      <span className="muted">
                        {" "}
                        (
                        {item.cantidades.join(", ")}
                        )
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
      )}
    </>
  );
}

function round(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return (Math.round(n * 100) / 100).toString();
}
