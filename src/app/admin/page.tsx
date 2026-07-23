import Link from "next/link";
import { repo } from "@/lib/repo";
import { getUserMetrics, listAllUsers } from "@/lib/users/service";

export default async function AdminHome() {
  const [recetas, menus, ingredientes, alergenos, tecnicas, users] =
    await Promise.all([
      repo.getRecetas(),
      repo.getMenus(),
      repo.getIngredientes(),
      repo.getAlergenos(),
      repo.getTecnicas(),
      listAllUsers(),
    ]);
  const userMetrics = await getUserMetrics(users);

  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">Autoría</p>
        <h1 className="page-header__title">Panel de autoría</h1>
        <p className="page-header__lede muted">
          Desde aquí puedes crear, editar y eliminar recetas, menús, y las
          personas con acceso al libro.
        </p>
      </header>
      <ul className="grid tile-grid">
        <li className="tile">
          <Link href="/admin/recetas" className="tile__link">
            <span className="tile__title">Recetas</span>
            <span className="tile__count">{recetas.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/menus" className="tile__link">
            <span className="tile__title">Menús</span>
            <span className="tile__count">{menus.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/ingredientes" className="tile__link">
            <span className="tile__title">Ingredientes</span>
            <span className="tile__count">{ingredientes.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/alergenos" className="tile__link">
            <span className="tile__title">Alérgenos</span>
            <span className="tile__count">{alergenos.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/tecnicas" className="tile__link">
            <span className="tile__title">Técnicas</span>
            <span className="tile__count">{tecnicas.length}</span>
          </Link>
        </li>
        <li className="tile">
          <Link href="/admin/usuarios" className="tile__link">
            <span className="tile__title">Usuarios</span>
            <span className="tile__count">{userMetrics.total}</span>
          </Link>
        </li>
      </ul>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        <MetricCard label="Usuarios registrados" value={userMetrics.total} />
        <MetricCard label="Nuevos este mes" value={userMetrics.newThisMonth} />
        <MetricCard
          label="Con permisos de autoría"
          value={userMetrics.superadmins}
        />
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{value}</div>
      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
        {label}
      </div>
    </div>
  );
}
