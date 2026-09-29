import type { CSSProperties } from "react";
import type { Coleccion } from "@/lib/schema";
import { TIPO_LABEL, iconoDe, tonoStyle, type ColeccionDato } from "@/lib/colecciones";

// Typographic cover for a colección: its own palette, an organic shape, the
// icon, the name set large in Fraunces and one headline figure. No photos —
// the covers must look finished with text and color alone.

interface Props {
  coleccion: Coleccion;
  dato?: ColeccionDato | null;
  size?: "card" | "hero";
  apagada?: boolean;
}

/** "Bocaditos de reserva: Pollo" → { serie: "Bocaditos de reserva", titulo: "Pollo" } */
export function partirNombre(nombre: string): { serie: string | null; titulo: string } {
  const i = nombre.indexOf(":");
  if (i < 0) return { serie: null, titulo: nombre };
  return { serie: nombre.slice(0, i).trim(), titulo: nombre.slice(i + 1).trim() };
}

export function ColeccionPortada({ coleccion, dato, size = "card", apagada = false }: Props) {
  const { serie, titulo } = partirNombre(coleccion.nombre);
  return (
    <div
      className={`portada portada--${size}`}
      data-apagada={apagada || undefined}
      style={tonoStyle(coleccion) as CSSProperties}
      aria-hidden="true"
    >
      <span className="portada__forma portada__forma--a" />
      <span className="portada__forma portada__forma--b" />
      <span className="portada__lomo" />
      <span className="portada__top">
        <span className="portada__tipo">{TIPO_LABEL[coleccion.tipo]}</span>
        <span className="portada__icono">{iconoDe(coleccion)}</span>
      </span>
      <span className="portada__nombre">
        {serie && <span className="portada__serie">{serie}</span>}
        <span className="portada__titulo">{titulo}</span>
      </span>
      {dato && (
        <span className="portada__dato">
          <strong>{dato.valor}</strong> {dato.label}
        </span>
      )}
      <span className="portada__firma">Amneris</span>
    </div>
  );
}
