"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

export interface RecetaLite {
  id: string;
  titulo: string;
  foto: string | null;
  tipo: string;
  enColeccion: boolean;
  otras: string[]; // names of other collections it belongs to
}

// Recipes of a colección: list with "Quitar", plus a picker to add existing
// recipes. Writes go through /api/colecciones/[id]/recetas.
export function ColeccionContenido({ coleccionId, recetas: initial }: { coleccionId: string; recetas: RecetaLite[] }) {
  const router = useRouter();
  const [recetas, setRecetas] = useState(initial);
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  const dentro = recetas.filter((r) => r.enColeccion);
  const fuera = useMemo(() => {
    const t = q.trim().toLowerCase();
    return recetas.filter((r) => !r.enColeccion && (!t || r.titulo.toLowerCase().includes(t)));
  }, [recetas, q]);

  async function cambiar(agregar: string[], quitar: string[]) {
    const res = await runSave(() =>
      saveWithVerify<{ ok: true }>(`/api/colecciones/${coleccionId}/recetas`, "POST", { agregar, quitar })
    );
    if (!res.ok) return;
    setRecetas((cur) =>
      cur.map((r) =>
        agregar.includes(r.id) ? { ...r, enColeccion: true } : quitar.includes(r.id) ? { ...r, enColeccion: false } : r
      )
    );
    setSel(new Set());
    router.refresh();
  }

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <section className="form-card" id="contenido">
      <div className="form-card__head">
        <h2 className="form-card__title">
          Recetas de la colección <span className="count-pill">{dentro.length}</span>
        </h2>
        <button type="button" className="button button--ghost" onClick={() => setAbierto((v) => !v)}>
          {abierto ? "Cerrar" : "+ Agregar recetas"}
        </button>
      </div>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      {abierto && (
        <div className="picker">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar receta por nombre"
            className="picker__search"
          />
          <ul className="picker__list">
            {fuera.slice(0, 60).map((r) => (
              <li key={r.id}>
                <label className="picker__item">
                  <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
                  <span>
                    {r.titulo}
                    {r.otras.length > 0 && <span className="muted"> · en {r.otras.join(", ")}</span>}
                  </span>
                </label>
              </li>
            ))}
            {fuera.length === 0 && <li className="muted">No hay recetas que coincidan.</li>}
          </ul>
          <button
            type="button"
            className="button button--primary"
            disabled={busy || sel.size === 0}
            onClick={() => cambiar([...sel], [])}
          >
            {sel.size === 0 ? "Elige recetas" : `Agregar ${sel.size} ${sel.size === 1 ? "receta" : "recetas"}`}
          </button>
        </div>
      )}

      {dentro.length === 0 ? (
        <p className="muted">Esta colección todavía no tiene recetas.</p>
      ) : (
        <ul className="receta-rows">
          {dentro.map((r) => (
            <li key={r.id} className="receta-row">
              <span className="receta-row__thumb">
                {r.foto ? <Image src={r.foto} alt="" fill sizes="48px" /> : <span aria-hidden="true">📷</span>}
              </span>
              <span className="receta-row__body">
                <Link href={`/admin/recetas/${r.id}/editar`}>{r.titulo}</Link>
                <span className="receta-row__meta">
                  {r.tipo}
                  {!r.foto && <span className="flag">sin foto</span>}
                </span>
              </span>
              <button
                type="button"
                className="link-button"
                disabled={busy}
                onClick={() => {
                  if (confirm(`¿Quitar «${r.titulo}» de esta colección? La receta no se borra.`)) cambiar([], [r.id]);
                }}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
