import { repo } from "@/lib/repo";

export default async function AdminMetodosPage() {
  const metodos = await repo.getMetodosConservacion().catch(() => []);
  return (
    <>
      <h1>Métodos de conservación</h1>
      <p className="muted">
        Catálogo cerrado, solo lectura. Se edita vía{" "}
        <code>scripts/seed-metodos-conservacion.ts</code>. Refrigerado, congelado
        y ambiente cubren todo lo que hoy usan las recetas. Nuevos métodos (vacío,
        salado, deshidratado) se agregan al script.
      </p>
      {metodos.length === 0 ? (
        <p className="muted">
          Sin métodos cargados. Corre <code>npm run seed:metodos -- --apply</code>.
        </p>
      ) : (
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Temperatura</th>
            </tr>
          </thead>
          <tbody>
            {metodos.map((m) => (
              <tr key={m.id}>
                <td><code>{m.id}</code></td>
                <td>{m.nombre}</td>
                <td>{m.descripcion ?? <span className="muted">—</span>}</td>
                <td>
                  {m.temperaturaC
                    ? `${m.temperaturaC.min} a ${m.temperaturaC.max} °C`
                    : <span className="muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
