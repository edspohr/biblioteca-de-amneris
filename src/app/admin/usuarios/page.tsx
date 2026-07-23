import { verifySession } from "@/lib/auth/session";
import { getUserMetrics, listAllUsers } from "@/lib/users/service";
import { UsersTable } from "./users-table";
import { CreateUserForm } from "./create-user-form";

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, session, users] = await Promise.all([
    searchParams,
    verifySession(),
    listAllUsers(),
  ]);
  const metrics = await getUserMetrics(users);

  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.uid.toLowerCase().includes(query)
      )
    : users;

  const selfUid = session?.uid ?? "";

  return (
    <>
      <h1>Usuarios</h1>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0 1.5rem",
        }}
      >
        <Metric label="Cuentas totales" value={metrics.total} />
        <Metric label="Nuevas este mes" value={metrics.newThisMonth} />
        <Metric label="Con permisos de autoría" value={metrics.superadmins} />
      </section>

      <CreateUserForm />

      <form
        method="get"
        action="/admin/usuarios"
        style={{ margin: "1.5rem 0 0.75rem", display: "flex", gap: "0.5rem" }}
      >
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por correo, nombre o UID…"
          style={{ flex: 1, maxWidth: 360 }}
        />
        <button type="submit" className="button button--ghost">
          Buscar
        </button>
      </form>
      <p className="muted">
        Mostrando {filtered.length} de {users.length} cuentas.
      </p>

      <UsersTable users={filtered} selfUid={selfUid} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="card"
      style={{ padding: "0.75rem 1rem" }}
    >
      <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{value}</div>
      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
        {label}
      </div>
    </div>
  );
}
