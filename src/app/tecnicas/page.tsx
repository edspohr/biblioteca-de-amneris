import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function TecnicasPage() {
  const [tecnicas, recetas] = await Promise.all([repo.getTecnicas(), repo.getRecetas()]);
  const usoPorTecnica = new Map<string, number>();
  for (const r of recetas) {
    for (const rt of r.receta_tecnicas) {
      usoPorTecnica.set(rt.tecnica_id, (usoPorTecnica.get(rt.tecnica_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <h1>Técnicas de cocina</h1>
      <p className="muted">{tecnicas.length} técnicas · {tecnicas.filter((t) => !t.descripcion).length} pendientes de describir</p>
      <div className="grid">
        {tecnicas
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((t) => (
            <div key={t.id} className="card">
              <Link href={`/tecnicas/${t.id}`}>{t.nombre}</Link>
              <div className="meta">
                Usada en {usoPorTecnica.get(t.id) ?? 0} recetas
              </div>
              {t.descripcion && <div>{t.descripcion}</div>}
              {!t.descripcion && <div className="muted">Sin descripción aún</div>}
            </div>
          ))}
      </div>
    </>
  );
}
