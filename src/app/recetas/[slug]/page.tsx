import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { RecetaVarianteTabs } from "./variante-tabs";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function RecetaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [receta, ingredientes, alergenos, tecnicas, etapas] = await Promise.all([
    repo.getReceta(slug),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
    repo.getEtapas(),
  ]);
  if (!receta) notFound();

  const ingById = new Map(ingredientes.map((i) => [i.id, i]));
  const alergById = new Map(alergenos.map((a) => [a.id, a]));
  const tecById = new Map(tecnicas.map((t) => [t.id, t]));

  return (
    <>
      <p className="muted">
        <Link href="/recetas">← Todas las recetas</Link>
      </p>
      <div className="recipe-hero">
        {receta.foto ? <img src={receta.foto} alt={receta.titulo} /> : <div />}
        <div>
          <h1>{receta.titulo}</h1>
          <p className="muted">
            {TIPOS_LABEL[receta.tipo_comida] ?? receta.tipo_comida}
            {receta.numero != null ? ` · Receta ${receta.numero}` : ""}
            {receta.minutos_prep != null ? ` · ${receta.minutos_prep} min` : ""}
            {receta.kcal_100g != null ? ` · ${receta.kcal_100g} kcal / 100 g` : ""}
          </p>

          <RecetaVarianteTabs receta={receta} etapas={etapas} />

          <p>
            <strong>Congelable:</strong>{" "}
            {receta.congelable === true ? "Sí" : receta.congelable === false ? "No" : "—"}
          </p>
          {receta.conservacion && (
            <p>
              <strong>Conservación:</strong> {receta.conservacion}
            </p>
          )}

          {receta.receta_alergenos.length > 0 && (
            <p>
              <strong>Alérgenos:</strong>{" "}
              {receta.receta_alergenos.map((ra) => {
                const a = alergById.get(ra.alergeno_id);
                return a ? (
                  <span key={ra.alergeno_id} className="chip">
                    {a.nombre}
                  </span>
                ) : null;
              })}
            </p>
          )}

          {receta.receta_tecnicas.length > 0 && (
            <p>
              <strong>Técnicas:</strong>{" "}
              {receta.receta_tecnicas.map((rt, idx) => {
                const t = tecById.get(rt.tecnica_id);
                if (!t) return null;
                return (
                  <span key={rt.tecnica_id}>
                    {idx > 0 && ", "}
                    <Link href={`/tecnicas/${t.id}`}>{t.nombre}</Link>
                  </span>
                );
              })}
            </p>
          )}

          {receta.vitaminas.length > 0 && (
            <p>
              <strong>Vitaminas:</strong>{" "}
              {receta.vitaminas.map((v) => (
                <span key={v} className="chip">
                  {v}
                </span>
              ))}
            </p>
          )}

          {receta.notas && (
            <p>
              <strong>Notas:</strong> {receta.notas}
            </p>
          )}
        </div>
      </div>

      <h2>Ingredientes</h2>
      {receta.receta_ingredientes.length === 0 ? (
        <p className="muted">Sin ingredientes registrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Cantidad</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {receta.receta_ingredientes.map((ri, idx) => {
              const ing = ingById.get(ri.ingrediente_id);
              return (
                <tr key={`${ri.ingrediente_id}-${idx}`}>
                  <td>{ing?.nombre ?? ri.ingrediente_id}</td>
                  <td>
                    {ri.cantidad != null ? ri.cantidad : ""}
                    {ri.unidad ? ` ${ri.unidad}` : ""}
                  </td>
                  <td>{ri.nota ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h2>Preparación</h2>
      {receta.pasos.length === 0 ? (
        <p className="muted">Sin pasos registrados.</p>
      ) : (
        <ol className="steps">
          {receta.pasos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
    </>
  );
}
