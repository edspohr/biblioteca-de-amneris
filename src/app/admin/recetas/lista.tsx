"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Coleccion } from "@/lib/schema";
import { iconoDe, tonoStyle } from "@/lib/colecciones";
import { partirNombre } from "@/components/coleccion-portada";
import { DeleteButton } from "./delete-button";

export type Pendiente = "sin-foto" | "alergenos" | "sin-coleccion";

interface Row {
  id: string;
  titulo: string;
  foto: string | null;
  tipo: string;
  minutos: number | null;
  coleccionIds: string[];
  etapas: number[];
  alergenosPorRevisar: boolean;
  gratis: boolean;
}

const PENDIENTE_LABEL: Record<Pendiente, string> = {
  "sin-foto": "Sin foto",
  alergenos: "Alérgenos por revisar",
  "sin-coleccion": "Sin colección",
};

export function RecetasAdminLista({
  recetas,
  colecciones,
  coleccionInicial,
  pendienteInicial,
}: {
  recetas: Row[];
  colecciones: Coleccion[];
  coleccionInicial: string;
  pendienteInicial: Pendiente | "";
}) {
  const [q, setQ] = useState("");
  const [coleccion, setColeccion] = useState(coleccionInicial);
  const [pendiente, setPendiente] = useState<Pendiente | "">(pendienteInicial);
  const colById = useMemo(() => new Map(colecciones.map((c) => [c.id, c])), [colecciones]);

  const cuenta = (p: Pendiente, base: Row[]) =>
    base.filter((r) =>
      p === "sin-foto" ? !r.foto : p === "alergenos" ? r.alergenosPorRevisar : r.coleccionIds.length === 0
    ).length;

  const deColeccion = coleccion ? recetas.filter((r) => r.coleccionIds.includes(coleccion)) : recetas;
  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return deColeccion.filter((r) => {
      if (pendiente === "sin-foto" && r.foto) return false;
      if (pendiente === "alergenos" && !r.alergenosPorRevisar) return false;
      if (pendiente === "sin-coleccion" && r.coleccionIds.length > 0) return false;
      return !t || r.titulo.toLowerCase().includes(t);
    });
  }, [deColeccion, pendiente, q]);

  return (
    <>
      <div className="admin-filters">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar receta"
          className="picker__search"
          aria-label="Buscar receta"
        />
        <div className="col-chips" role="group" aria-label="Colección">
          <button type="button" className="col-chip" aria-pressed={coleccion === ""} onClick={() => setColeccion("")}>
            Todas
          </button>
          {colecciones.map((c) => (
            <button
              key={c.id}
              type="button"
              className="col-chip"
              aria-pressed={coleccion === c.id}
              onClick={() => setColeccion(c.id)}
              style={tonoStyle(c) as CSSProperties}
            >
              <span aria-hidden="true">{iconoDe(c)}</span> {partirNombre(c.nombre).titulo}
            </button>
          ))}
        </div>
        <div className="col-chips" role="group" aria-label="Pendientes">
          {(Object.keys(PENDIENTE_LABEL) as Pendiente[]).map((p) => {
            const n = cuenta(p, deColeccion);
            if (n === 0 && pendiente !== p) return null;
            return (
              <button
                key={p}
                type="button"
                className="col-chip col-chip--warn"
                aria-pressed={pendiente === p}
                onClick={() => setPendiente(pendiente === p ? "" : p)}
              >
                {PENDIENTE_LABEL[p]} <span className="count-pill">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="muted admin-results">
        {filtradas.length} de {recetas.length} recetas
      </p>

      {filtradas.length === 0 ? (
        <div className="admin-empty">Ninguna receta coincide con los filtros.</div>
      ) : (
        <ul className="receta-admin-list">
          {filtradas.map((r) => (
            <li key={r.id} className="receta-admin-row">
              <Link href={`/admin/recetas/${r.id}/editar`} className="receta-row__thumb" tabIndex={-1}>
                {r.foto ? <Image src={r.foto} alt="" fill sizes="56px" /> : <span aria-hidden="true">📷</span>}
              </Link>
              <div className="receta-admin-row__body">
                <Link href={`/admin/recetas/${r.id}/editar`} className="receta-admin-row__title">
                  {r.titulo}
                </Link>
                <p className="receta-admin-row__meta">
                  {r.coleccionIds.map((id) => {
                    const c = colById.get(id);
                    return c ? (
                      <span key={id} className="col-tag" style={tonoStyle(c) as CSSProperties}>
                        {iconoDe(c)} {partirNombre(c.nombre).titulo}
                      </span>
                    ) : null;
                  })}
                  <span>{r.tipo}</span>
                  {r.minutos != null && <span>{r.minutos} min</span>}
                  <span>{r.etapas.length === 3 ? "3 etapas" : `Etapa ${r.etapas.join(", ")}`}</span>
                  {r.gratis && <span className="flag flag--ok">gratis</span>}
                  {!r.foto && <span className="flag">sin foto</span>}
                  {r.alergenosPorRevisar && <span className="flag">alérgenos por revisar</span>}
                  {r.coleccionIds.length === 0 && <span className="flag">sin colección</span>}
                </p>
              </div>
              <div className="receta-admin-row__actions">
                <Link href={`/admin/recetas/${r.id}/editar`}>Editar</Link>
                <Link href={`/recetas/${r.id}`}>Ver</Link>
                <DeleteButton id={r.id} titulo={r.titulo} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
