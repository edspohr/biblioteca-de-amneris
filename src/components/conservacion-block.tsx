import type { Conservacion, MetodoConservacion } from "@/lib/schema";

// Bloque estructurado de conservación con íconos por método. Los ids de
// método/técnica quedan tolerantes: si el catálogo no tiene un método, se
// muestra el id como fallback.
interface Props {
  conservaciones: Conservacion[];
  metodos: MetodoConservacion[];
}

const ICON: Record<string, string> = {
  congelado: "🧊",
  refrigerado: "❄️",
  ambiente: "🌡",
};

function formatDuracion(d: number | null): string {
  if (d == null) return "";
  if (d >= 30) {
    const meses = Math.round(d / 30);
    return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  return `${d} ${d === 1 ? "día" : "días"}`;
}

export function ConservacionBlock({ conservaciones, metodos }: Props) {
  if (conservaciones.length === 0) return null;
  const metodoById = new Map(metodos.map((m) => [m.id, m]));
  return (
    <ul className="conservacion-block">
      {conservaciones.map((c, i) => {
        const metodo = metodoById.get(c.metodoId);
        return (
          <li key={i} className="conservacion-block__item">
            <span className="conservacion-block__icon" aria-hidden="true">
              {ICON[c.metodoId] ?? "•"}
            </span>
            <div className="conservacion-block__body">
              <span className="conservacion-block__metodo">
                {metodo?.nombre ?? c.metodoId}
              </span>
              {c.duracionDias != null && (
                <span className="conservacion-block__duracion">
                  Duración: {formatDuracion(c.duracionDias)}
                </span>
              )}
              {c.nota && <p className="conservacion-block__nota">{c.nota}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
