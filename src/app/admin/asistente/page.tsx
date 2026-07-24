import {
  clusterQuestions,
  loadRecentMessages,
} from "@/lib/asistente/analytics";

export default async function AdminAsistentePage() {
  const messages = await loadRecentMessages(30);
  const clusters = clusterQuestions(messages);
  const uniqSessions = new Set(messages.map((m) => m.sessionId)).size;

  return (
    <>
      <h1>Asistente — preguntas frecuentes</h1>
      <p className="muted">
        Últimos 30 días. Se guarda solo la pregunta y un resumen corto de la
        respuesta; el contenido completo se elimina en la limpieza mensual.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0 1.5rem",
        }}
      >
        <Metric label="Mensajes totales" value={messages.length} />
        <Metric label="Sesiones únicas" value={uniqSessions} />
        <Metric label="Preguntas distintas" value={clusters.length} />
      </section>

      {clusters.length === 0 ? (
        <p>Sin actividad todavía.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Veces</th>
                <th>Pregunta</th>
                <th>Herramientas usadas</th>
                <th>Última vez</th>
              </tr>
            </thead>
            <tbody>
              {clusters.slice(0, 100).map((c) => (
                <tr key={c.key}>
                  <td>
                    <strong>{c.count}</strong>
                  </td>
                  <td>{c.sample}</td>
                  <td style={{ color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
                    {c.toolsInvoked.length > 0 ? c.toolsInvoked.join(", ") : "—"}
                  </td>
                  <td style={{ color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
                    {new Date(c.lastAtMs).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{value}</div>
      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
        {label}
      </div>
    </div>
  );
}
