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
      <h1>Menús semanales</h1>
      <p className="muted">{menus.length} menús · agrupados por etapa</p>

      {etapasOrdenadas.map((etapa) => {
        const list = grouped.get(etapa.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={etapa.id}>
            <h2>{etapa.nombre}</h2>
            <div className="grid">
              {list.map((m) => (
                <div key={m.id} className="card">
                  <Link href={`/menus/${m.id}`}>{m.nombre}</Link>
                  <div className="meta">
                    {m.menu_recetas.length} recetas · {etapaById.get(m.etapa_id)?.rango_edad}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
