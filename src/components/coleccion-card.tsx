import Link from "next/link";
import type { Coleccion } from "@/lib/schema";

// Card de colección para el hub /libro. Muestra badge por estado y esconde
// el link cuando la colección está `proximamente` u `oculta` sin admin.
interface Props {
  coleccion: Coleccion;
  isSuperadmin: boolean;
}

const ESTADO_LABEL: Record<string, { label: string; clase: string }> = {
  publicada: { label: "Disponible", clase: "coleccion-card__badge--pub" },
  proximamente: { label: "Próximamente", clase: "coleccion-card__badge--soon" },
  oculta: { label: "Preview admin", clase: "coleccion-card__badge--admin" },
};

export function ColeccionCard({ coleccion, isSuperadmin }: Props) {
  const estado = ESTADO_LABEL[coleccion.estado];
  const isLinkable =
    coleccion.estado === "publicada" ||
    (coleccion.estado === "oculta" && isSuperadmin);
  const href = `/colecciones/${coleccion.id}`;

  const body = (
    <>
      <span className={`coleccion-card__badge ${estado?.clase ?? ""}`}>
        {estado?.label ?? coleccion.estado}
      </span>
      <h3 className="coleccion-card__title">{coleccion.nombre}</h3>
      <p className="coleccion-card__bajada">{coleccion.bajada}</p>
      {coleccion.descripcionCorta && (
        <p className="coleccion-card__desc">{coleccion.descripcionCorta}</p>
      )}
    </>
  );

  return isLinkable ? (
    <Link href={href} className="coleccion-card coleccion-card--link">
      {body}
    </Link>
  ) : (
    <div className="coleccion-card">{body}</div>
  );
}
