import type { CSSProperties } from "react";
import Link from "next/link";
import type { Coleccion } from "@/lib/schema";
import {
  esNueva,
  estadoEfectivo,
  lineaLanzamiento,
  tonoStyle,
  type ColeccionDato,
} from "@/lib/colecciones";
import { ColeccionPortada } from "./coleccion-portada";

// Shelf card for /libro: a typographic cover plus name, bajada and state.
// Upcoming collections stay visible (they sell the subscription) but don't
// link anywhere unless the viewer is a superadmin.
interface Props {
  coleccion: Coleccion;
  datos: ColeccionDato[];
  isSuperadmin: boolean;
  hoy: string;
}

export function ColeccionCard({ coleccion, datos, isSuperadmin, hoy }: Props) {
  const estado = estadoEfectivo(coleccion, hoy);
  const nueva = esNueva(coleccion, hoy);
  const isLinkable = estado === "publicada" || isSuperadmin;
  const lanzamiento = estado === "proximamente" ? lineaLanzamiento(coleccion, hoy) : null;

  const badge =
    estado === "oculta"
      ? { label: "Solo tú la ves", clase: "coleccion-card__badge--admin" }
      : estado === "proximamente"
        ? { label: "Próximamente", clase: "coleccion-card__badge--soon" }
        : nueva
          ? { label: "Nuevo", clase: "coleccion-card__badge--new" }
          : null;

  const body = (
    <>
      <ColeccionPortada
        coleccion={coleccion}
        dato={datos[0] ?? null}
        apagada={estado === "proximamente"}
      />
      <span className="coleccion-card__body">
        {badge && <span className={`coleccion-card__badge ${badge.clase}`}>{badge.label}</span>}
        <span className="coleccion-card__title">{coleccion.nombre}</span>
        <span className="coleccion-card__bajada">{coleccion.bajada}</span>
        {lanzamiento ? (
          <span className="coleccion-card__launch">{lanzamiento}</span>
        ) : estado === "proximamente" ? (
          <span className="coleccion-card__launch">Incluida en tu suscripción</span>
        ) : (
          <span className="coleccion-card__cta">Abrir colección →</span>
        )}
      </span>
    </>
  );

  const style = tonoStyle(coleccion) as CSSProperties;
  return isLinkable ? (
    <Link href={`/colecciones/${coleccion.id}`} className="coleccion-card coleccion-card--link" style={style}>
      {body}
    </Link>
  ) : (
    <div className="coleccion-card" style={style}>
      {body}
    </div>
  );
}
