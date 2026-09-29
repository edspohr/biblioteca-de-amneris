import Link from "next/link";
import { repo } from "@/lib/repo";

export default async function AdminGuiasPage() {
  const [guias, colecciones] = await Promise.all([
    repo.getGuias().catch(() => []),
    repo.getColecciones().catch(() => []),
  ]);
  const nombreColeccion = new Map(colecciones.map((c) => [c.id, c.nombre]));
  const porColeccion = new Map<string, typeof guias>();
  for (const g of guias) {
    const arr = porColeccion.get(g.coleccionId) ?? [];
    arr.push(g);
    porColeccion.set(g.coleccionId, arr);
  }

  return (
    <>
      <h1>Guías</h1>
      <p className="muted">
        Las guías cargan la narrativa que va junto a cada colección (intro,
        cronograma del día de cocina, guías de seguridad, etc.). Cada guía es una
        secuencia de bloques tipados: párrafo, lista, tabla o aviso.
      </p>

      {guias.length === 0 ? (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Sin guías. Se cargan vía <code>npm run import:load -- --apply</code>.
        </p>
      ) : (
        [...porColeccion.entries()].map(([coleccionId, list]) => (
          <section key={coleccionId} style={{ marginTop: "1.5rem" }}>
            <h2>{nombreColeccion.get(coleccionId) ?? coleccionId}</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.4rem" }}>
              {[...list]
                .sort((a, b) => a.orden - b.orden)
                .map((g) => (
                  <li
                    key={g.id}
                    style={{
                      border: "1px solid var(--border, #e0d5c8)",
                      borderRadius: 6,
                      padding: "0.6rem 0.8rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>{g.titulo || g.codigo || g.id}</strong>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {g.codigo && <code>{g.codigo}</code>}
                        {g.codigo ? " · " : ""}
                        <code>{g.id}</code> · {g.bloques.length} bloques
                      </div>
                    </div>
                    <Link href={`/admin/guias/${g.id}/editar`}>Editar</Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
