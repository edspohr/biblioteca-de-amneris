"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Alergeno, Ingrediente, Receta, TipoComida } from "@/lib/schema";

interface Props {
  recetas: Receta[];
  ingredientes: Ingrediente[];
  alergenos: Alergeno[];
}

const TIPOS: { value: TipoComida; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "colacion", label: "Colación" },
];

export function RecetasBrowser({ recetas, ingredientes, alergenos }: Props) {
  const [tipoComida, setTipoComida] = useState<TipoComida | "">("");
  const [maxMinutos, setMaxMinutos] = useState("");
  const [congelableOnly, setCongelableOnly] = useState(false);
  const [excludedAlergenos, setExcludedAlergenos] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const ingByNorm = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of ingredientes) m.set(i.id, i.nombre.toLowerCase());
    return m;
  }, [ingredientes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const max = maxMinutos ? parseInt(maxMinutos, 10) : null;
    return recetas.filter((r) => {
      if (tipoComida && r.tipo_comida !== tipoComida) return false;
      if (max != null && (r.minutos_prep == null || r.minutos_prep > max)) return false;
      if (congelableOnly && r.congelable !== true) return false;
      if (excludedAlergenos.size) {
        for (const a of r.receta_alergenos) {
          if (excludedAlergenos.has(a.alergeno_id)) return false;
        }
      }
      if (q) {
        if (r.titulo.toLowerCase().includes(q)) return true;
        for (const ri of r.receta_ingredientes) {
          const name = ingByNorm.get(ri.ingrediente_id);
          if (name && name.includes(q)) return true;
        }
        return false;
      }
      return true;
    });
  }, [recetas, tipoComida, maxMinutos, congelableOnly, excludedAlergenos, query, ingByNorm]);

  function toggleAlergeno(id: string) {
    const next = new Set(excludedAlergenos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExcludedAlergenos(next);
  }

  function reset() {
    setTipoComida("");
    setMaxMinutos("");
    setCongelableOnly(false);
    setExcludedAlergenos(new Set());
    setQuery("");
  }

  return (
    <>
      <div className="filters">
        <label>
          Buscar
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="título o ingrediente"
          />
        </label>
        <label>
          Tipo de comida
          <select
            value={tipoComida}
            onChange={(e) => setTipoComida(e.target.value as TipoComida | "")}
          >
            <option value="">Todas</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Máx. minutos
          <input
            type="number"
            value={maxMinutos}
            onChange={(e) => setMaxMinutos(e.target.value)}
            min={0}
            placeholder="sin límite"
          />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "0.35rem" }}>
          <input
            type="checkbox"
            checked={congelableOnly}
            onChange={(e) => setCongelableOnly(e.target.checked)}
          />
          Solo congelables
        </label>
        <div className="allergen-group">
          <span>Excluir alérgenos</span>
          <div className="row">
            {alergenos
              .sort((a, b) => a.nombre.localeCompare(b.nombre))
              .map((a) => (
                <label key={a.id} className="chip" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={excludedAlergenos.has(a.id)}
                    onChange={() => toggleAlergeno(a.id)}
                    style={{ marginRight: "0.25rem" }}
                  />
                  {a.nombre}
                </label>
              ))}
          </div>
        </div>
        <button type="button" className="secondary" onClick={reset}>
          Limpiar filtros
        </button>
      </div>

      <div className="results-count">
        {filtered.length} de {recetas.length} recetas · aplican a todas las etapas
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Ninguna receta coincide con los filtros.</div>
      ) : (
        <div className="grid">
          {filtered.map((r) => (
            <div key={r.id} className="card">
              {r.foto && <img src={r.foto} alt="" />}
              <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
              <div className="meta">
                {TIPOS.find((t) => t.value === r.tipo_comida)?.label ?? r.tipo_comida}
                {r.minutos_prep != null ? ` · ${r.minutos_prep} min` : ""}
                {r.congelable === true ? " · congelable" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
