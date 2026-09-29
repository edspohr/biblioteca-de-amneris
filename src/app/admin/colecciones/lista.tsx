"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Coleccion } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";
import { ColeccionPortada } from "@/components/coleccion-portada";
import {
  ESTADO_ADMIN,
  TIPO_LABEL,
  estadoEfectivo,
  formatFecha,
  lineaLanzamiento,
  type ColeccionDato,
} from "@/lib/colecciones";

interface Item {
  coleccion: Coleccion;
  datos: ColeccionDato[];
}

// Shelf order editor + overview. Moving a collection renumbers `orden` for
// the whole list (1..n) and saves only the ones whose number changed.
export function ColeccionesLista({ items: initial, hoy }: { items: Item[]; hoy: string }) {
  const router = useRouter();
  const [items, setItems] = useState(() =>
    [...initial].sort((a, b) => a.coleccion.orden - b.coleccion.orden)
  );
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  async function mover(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const renumerados = next.map((it, i) => ({ ...it, coleccion: { ...it.coleccion, orden: i + 1 } }));
    const cambiados = renumerados.filter(
      (it) => items.find((x) => x.coleccion.id === it.coleccion.id)?.coleccion.orden !== it.coleccion.orden
    );
    setItems(renumerados);
    for (const it of cambiados) {
      const res = await runSave(() =>
        saveWithVerify<Coleccion>(`/api/colecciones/${it.coleccion.id}`, "PUT", it.coleccion)
      );
      if (!res.ok) {
        setItems(items);
        return;
      }
    }
    router.refresh();
  }

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />
      <ol className="col-admin-list">
        {items.map(({ coleccion: c, datos }, i) => {
          const efectivo = estadoEfectivo(c, hoy);
          const linea =
            c.estado === "programada" || c.estado === "proximamente"
              ? lineaLanzamiento(c, hoy)
              : c.fechaLanzamiento && efectivo === "publicada"
                ? `Publicada desde el ${formatFecha(c.fechaLanzamiento, hoy)}`
                : null;
          return (
            <li key={c.id} className="col-admin-row">
              <div className="col-admin-row__order">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={busy || i === 0}
                  aria-label={`Subir ${c.nombre}`}
                >
                  ↑
                </button>
                <span>{i + 1}</span>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={busy || i === items.length - 1}
                  aria-label={`Bajar ${c.nombre}`}
                >
                  ↓
                </button>
              </div>
              <Link href={`/admin/colecciones/${c.id}`} className="col-admin-row__cover" tabIndex={-1}>
                <ColeccionPortada coleccion={c} dato={datos[0]} apagada={efectivo !== "publicada"} />
              </Link>
              <div className="col-admin-row__body">
                <p className="col-admin-row__meta">
                  <span className="estado-chip" data-estado={c.estado}>
                    {ESTADO_ADMIN[c.estado].label}
                  </span>
                  {TIPO_LABEL[c.tipo]}
                </p>
                <h2 className="col-admin-row__title">
                  <Link href={`/admin/colecciones/${c.id}`}>{c.nombre}</Link>
                </h2>
                <p className="col-admin-row__bajada">{c.bajada}</p>
                {linea && <p className="col-admin-row__linea">{linea}</p>}
                <p className="col-admin-row__datos">
                  {datos.map((d) => `${d.valor} ${d.label}`).join(" · ")}
                </p>
              </div>
              <div className="col-admin-row__actions">
                <Link href={`/admin/colecciones/${c.id}`} className="button button--primary">
                  Editar
                </Link>
                <Link href={`/colecciones/${c.id}`} className="button button--ghost">
                  Ver ↗
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
