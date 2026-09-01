import { verifySession } from "@/lib/auth/session";
import {
  getUserMetrics,
  listAllUsers,
  listUsuariosWithProfile,
} from "@/lib/users/service";
import { UsersTable } from "./users-table";
import { CreateUserForm } from "./create-user-form";

const STATE_LABELS: Record<string, string> = {
  trial: "En prueba",
  activa: "Suscripción activa",
  cortesia: "Cortesía",
  vencida: "Prueba vencida",
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  recomendacion: "Recomendación",
  flyer: "Flyer/QR",
  google: "Google",
  otro: "Otro",
};

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; source?: string }>;
}) {
  const [{ q, state, source }, session, rows] = await Promise.all([
    searchParams,
    verifySession(),
    listUsuariosWithProfile(),
  ]);
  const summaries = await listAllUsers();
  const metrics = await getUserMetrics(summaries, rows);

  const query = (q ?? "").trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (state && r.access.tier !== state) return false;
    if (source && r.profile?.source !== source) return false;
    if (!query) return true;
    return (
      r.summary.email?.toLowerCase().includes(query) ||
      r.summary.displayName?.toLowerCase().includes(query) ||
      r.summary.uid.toLowerCase().includes(query) ||
      (r.profile?.phone ?? "").toLowerCase().includes(query)
    );
  });

  const selfUid = session?.uid ?? "";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Usuarios</h1>
        <a
          className="button button--ghost"
          href="/api/usuarios/export.csv"
          style={{ minHeight: 40 }}
        >
          Descargar CSV
        </a>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0 1.5rem",
        }}
      >
        <Metric label="Cuentas totales" value={metrics.total} />
        <Metric label="Nuevas este mes" value={metrics.newThisMonth} />
        <Metric label="Trials activos" value={metrics.trialActivos} />
        <Metric label="Cortesías" value={metrics.cortesiaActivas} />
        <Metric label="Trials vencidos" value={metrics.trialVencidos} />
        <Metric label="Con autoría" value={metrics.superadmins} />
      </section>

      <CreateUserForm />

      <form
        method="get"
        action="/admin/usuarios"
        style={{
          margin: "1.5rem 0 0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por correo, nombre, teléfono, UID…"
          style={{ flex: "1 1 220px", minWidth: 200 }}
        />
        <select name="state" defaultValue={state ?? ""}>
          <option value="">Todos los estados</option>
          {Object.entries(STATE_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select name="source" defaultValue={source ?? ""}>
          <option value="">Todas las fuentes</option>
          {Object.entries(SOURCE_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <button type="submit" className="button button--ghost">
          Filtrar
        </button>
      </form>
      <p className="muted">
        Mostrando {filtered.length} de {rows.length} cuentas.
      </p>

      <UsersTable rows={filtered} selfUid={selfUid} />
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
