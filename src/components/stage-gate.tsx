import Link from "next/link";
import type { Etapa } from "@/lib/schema";

// Muestra un aviso cuando la receta activa no tiene variante para la etapa
// activa del usuario, y ofrece las etapas que sí aplican. Reemplaza el
// comportamiento anterior (una receta aplicaba a las 3 etapas por invariante).
interface Props {
  etapaActivaNombre: string;
  etapaActivaRango: string;
  etapasQueAplican: Etapa[];
  slugReceta: string;
}

export function StageGate({
  etapaActivaNombre,
  etapaActivaRango,
  etapasQueAplican,
  slugReceta,
}: Props) {
  return (
    <div className="stage-gate">
      <p className="stage-gate__title">
        Esta receta está pensada para otras edades.
      </p>
      <p className="stage-gate__body">
        Tienes activa <strong>{etapaActivaNombre}</strong> ({etapaActivaRango}).
        Se recomienda a partir de:
      </p>
      <ul className="stage-gate__list">
        {etapasQueAplican.map((e) => (
          <li
            key={e.id}
            style={{
              borderLeft: `4px solid ${e.paleta.primary}`,
              paddingLeft: "0.5rem",
            }}
          >
            <strong>{e.nombre}</strong> · {e.rango_edad}
          </li>
        ))}
      </ul>
      <p className="stage-gate__hint">
        Puedes seguir explorando la biblioteca desde{" "}
        <Link href={`/recetas`}>todas las recetas</Link> y filtrar por etapa.
      </p>
    </div>
  );
}
