import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function EtapaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [etapa, recetas, porciones] = await Promise.all([
    repo.getEtapa(slug),
    repo.getRecetas(),
    repo.getPorcionesTexturas(),
  ]);
  if (!etapa) notFound();

  const scoped: CSSProperties = {
    ["--etapa-primary" as string]: etapa.paleta.primary,
    ["--etapa-accent" as string]: etapa.paleta.accent,
    ["--etapa-soft" as string]: etapa.paleta.soft,
    ["--etapa-ink" as string]: etapa.paleta.ink,
  };

  return (
    <div style={scoped}>
      <p className="muted">
        <Link href="/">← Inicio</Link>
      </p>
      <h1>{etapa.nombre}</h1>
      <p className="muted">
        {etapa.rango_edad} · {etapa.textura}
      </p>
      {etapa.descripcion && <p>{etapa.descripcion}</p>}

      {porciones.length > 0 && (
        <>
          <h2>Porciones y texturas por etapa</h2>
          <table>
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Rango de edad</th>
                <th>Porción</th>
                <th>Textura</th>
              </tr>
            </thead>
            <tbody>
              {porciones.map((p, i) => (
                <tr key={i}>
                  <td>{p.etapa_id}</td>
                  <td>{p.rango_edad}</td>
                  <td>{p.porcion}</td>
                  <td>{p.textura}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Recetas ({recetas.length})</h2>
      <p className="muted">
        Todas las recetas aplican a las 3 etapas. Aquí las verás con la textura y
        porción correspondientes a <strong>{etapa.nombre.toLowerCase()}</strong>.
      </p>
      {recetas.length === 0 ? (
        <p className="empty">Sin recetas registradas.</p>
      ) : (
        <div className="grid">
          {recetas.map((r) => {
            const v = r.variantes[etapa.id];
            return (
              <div key={r.id} className="card">
                {r.foto && <img src={r.foto} alt="" />}
                <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
                <div className="meta">
                  {TIPOS_LABEL[r.tipo_comida] ?? r.tipo_comida}
                  {r.minutos_prep != null ? ` · ${r.minutos_prep} min` : ""}
                </div>
                {v && (
                  <div className="meta">
                    <strong>Textura:</strong> {v.textura}
                    <br />
                    <strong>Porción:</strong> {v.porcion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
