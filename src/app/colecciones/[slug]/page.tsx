import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { verifySession } from "@/lib/auth/session";
import { GuiaBloque } from "@/components/guia-bloque";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await repo.getColeccion(slug);
  if (!c) return {};
  return { title: c.nombre, description: c.bajada };
}

export default async function ColeccionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, session] = await Promise.all([repo.getColeccion(slug), verifySession()]);
  if (!c) notFound();

  const isSuperadmin = session?.superadmin === true;
  if (c.estado === "oculta" && !isSuperadmin) notFound();

  return (
    <div className="coleccion-page">
      <p className="coleccion-page__back">
        <Link href="/libro">← La biblioteca</Link>
      </p>

      <header className="plan-hero">
        <p className="plan-hero__eyebrow">
          {c.tipo === "plan" ? "Plan de batch cooking" : c.tipo === "recetario" ? "Recetario" : "Guía"}
          {c.eje ? ` · ${c.eje}` : ""}
          {c.estado === "oculta" ? " · Preview" : ""}
          {c.estado === "proximamente" ? " · Próximamente" : ""}
        </p>
        <h1 className="plan-hero__title">{c.nombre}</h1>
        <p className="plan-hero__bajada">{c.bajada}</p>
      </header>

      {c.estado === "proximamente" ? <ProximamenteSection /> : null}
      {c.estado !== "proximamente" && c.tipo === "recetario" ? (
        <RecetarioSection coleccionId={c.id} />
      ) : null}
      {c.estado !== "proximamente" && c.tipo === "plan" ? (
        <PlanSection coleccionId={c.id} />
      ) : null}
      {c.estado !== "proximamente" && c.tipo === "guia" ? (
        <GuiasSection coleccionId={c.id} />
      ) : null}
    </div>
  );
}

function ProximamenteSection() {
  return (
    <section className="section">
      <p className="muted">
        Esta colección está en preparación. Nos avisará Amneris cuando esté
        lista para publicarse.
      </p>
    </section>
  );
}

async function RecetarioSection({ coleccionId }: { coleccionId: string }) {
  const all = await repo.getRecetas();
  const enColeccion = all.filter((r) =>
    (r.coleccionIds ?? []).includes(coleccionId)
  );
  return (
    <section className="section">
      <h2 className="section-title">Recetas ({enColeccion.length})</h2>
      <p className="muted section-lede">
        Cada receta se adapta a las tres etapas — solo cambia la textura y la porción.
      </p>
      <p>
        <Link href="/recetas" className="button">
          Buscar y filtrar recetas →
        </Link>
      </p>
    </section>
  );
}

async function PlanSection({ coleccionId }: { coleccionId: string }) {
  const [plan, menus, guias, etapas, utensilios] = await Promise.all([
    repo.getPlanes().then((all) => all.find((p) => p.coleccionId === coleccionId)),
    repo.getMenus(),
    repo.getGuias(),
    repo.getEtapas(),
    repo.getUtensilios(),
  ]);
  const menusPlan = menus.filter(
    (m) => m.planId === coleccionId || m.codigo?.match(/^E\d-[PH]\d-S\d$/)
  );
  const guiasPlan = guias.filter((g) => g.coleccionId === coleccionId);

  return (
    <>
      <section className="section">
        <ul className="plan-facts">
          <li>
            <strong>{plan?.diasCubiertos ?? 30}</strong>
            <small>días cubiertos</small>
          </li>
          <li>
            <strong>{Math.round((plan?.duracionTotalMin ?? 240) / 60)} h</strong>
            <small>día de cocina</small>
          </li>
          <li>
            <strong>{menusPlan.length}</strong>
            <small>menús semanales</small>
          </li>
          <li>
            <strong>{guiasPlan.length}</strong>
            <small>guías técnicas</small>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">Antes de empezar</h2>
        {utensilios.length === 0 ? (
          <p className="muted">Aún no hay utensilios listados.</p>
        ) : (
          <ul className="utensilios-list">
            {utensilios.map((u) => (
              <li key={u.id} className="utensilio-item">
                <strong>{u.nombre}</strong>
                {u.paraQue && <p className="muted">{u.paraQue}</p>}
              </li>
            ))}
          </ul>
        )}
        {guiasPlan.length > 0 && (
          <p style={{ marginTop: "1rem" }}>
            <Link href={`/guias/${guiasPlan[0].id}`}>
              Ver guía de equipamiento →
            </Link>
          </p>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Menús ({menusPlan.length})</h2>
        {menusPlan.length === 0 ? (
          <p className="muted">
            Aún no hay menús cargados. Corre <code>npm run import:load -- --apply --create-ingredientes</code> para poblarlos.
          </p>
        ) : (
          <ul className="menu-tiles">
            {menusPlan
              .sort((a, b) => (a.codigo ?? a.id).localeCompare(b.codigo ?? b.id))
              .map((m) => (
                <li key={m.id}>
                  <Link href={`/menus/${m.id}`}>
                    {m.nombre} <span className="muted">({m.celdas?.length ?? m.menu_recetas.length} celdas)</span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Tu producción del mes</h2>
        <ul className="rendimiento-list">
          {etapas.map((e) => {
            const r = e.rendimientoMensualKg;
            if (!r) return null;
            return (
              <li key={e.id}>
                <strong>{e.nombre}</strong> · {r.total.toFixed(1)} kg totales
                <span className="muted">
                  {" "}(desayunos {r.desayunos.toFixed(1)} · almuerzos {r.almuerzos.toFixed(1)} · cenas {r.cenas.toFixed(1)} kg)
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {guiasPlan.length > 0 && (
        <section className="section">
          <h2 className="section-title">Guías técnicas ({guiasPlan.length})</h2>
          <ul className="guias-list">
            {guiasPlan
              .sort((a, b) => a.orden - b.orden)
              .map((g) => (
                <li key={g.id}>
                  <Link href={`/guias/${g.id}`}>
                    {g.titulo || g.codigo}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}

async function GuiasSection({ coleccionId }: { coleccionId: string }) {
  const guias = (await repo.getGuias()).filter((g) => g.coleccionId === coleccionId);
  return (
    <section className="section">
      <h2 className="section-title">Guías ({guias.length})</h2>
      {guias.length === 0 ? (
        <p className="muted">Sin guías todavía.</p>
      ) : (
        <ul>
          {guias.map((g) => (
            <li key={g.id}>
              <Link href={`/guias/${g.id}`}>{g.titulo}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Silence unused-import lint when the plan render doesn't need GuiaBloque
// (it's used indirectly by /guias/[slug] which imports the same module).
void GuiaBloque;
