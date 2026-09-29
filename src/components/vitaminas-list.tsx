import type { VitaminaDetalle } from "@/lib/schema";

// Chips de vitaminas/minerales con `nivel` (alta/media/baja) y breve
// beneficio. Diseño simple, sin depender de estilo global.
export function VitaminasList({ vitaminas }: { vitaminas: VitaminaDetalle[] }) {
  return (
    <ul className="vitaminas-list">
      {vitaminas.map((v, i) => (
        <li key={i} className={`vitaminas-list__item vitaminas-list__item--${v.nivel ?? "sin-nivel"}`}>
          <span className="vitaminas-list__nombre">{v.etiquetaId.replace(/-/g, " ")}</span>
          {v.nivel && (
            <span className={`vitaminas-list__nivel vitaminas-list__nivel--${v.nivel}`}>
              {v.nivel}
            </span>
          )}
          {v.beneficio && (
            <span className="vitaminas-list__beneficio">{v.beneficio}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
