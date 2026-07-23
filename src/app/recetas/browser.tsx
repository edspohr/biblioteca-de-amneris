"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const activeCount =
    (tipoComida ? 1 : 0) +
    (maxMinutos ? 1 : 0) +
    (congelableOnly ? 1 : 0) +
    excludedAlergenos.size;

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  return (
    <>
      <div className="filter-bar">
        <label className="filter-bar__search">
          <span className="visually-hidden">Buscar receta</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o ingrediente"
            enterKeyHint="search"
          />
        </label>
        <button
          type="button"
          className="filter-bar__open"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          Filtros
          {activeCount > 0 && <span className="filter-bar__badge">{activeCount}</span>}
        </button>
      </div>

      <div className="results-count">
        {filtered.length} de {recetas.length} recetas · aplican a todas las etapas
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Ninguna receta coincide con los filtros.</div>
      ) : (
        <ul className="grid recipe-grid">
          {filtered.map((r) => (
            <li key={r.id} className="card recipe-card">
              <Link href={`/recetas/${r.id}`} className="recipe-card__link">
                {r.foto ? (
                  <div className="recipe-card__photo">
                    <Image
                      src={r.foto}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="recipe-card__photo recipe-card__photo--placeholder" aria-hidden="true" />
                )}
                <span className="recipe-card__title">{r.titulo}</span>
                <span className="meta">
                  {TIPOS.find((t) => t.value === r.tipo_comida)?.label ?? r.tipo_comida}
                  {r.minutos_prep != null ? ` · ${r.minutos_prep} min` : ""}
                  {r.congelable === true ? " · congelable" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {sheetOpen && (
        <div
          className="sheet-backdrop"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de recetas"
        data-open={sheetOpen}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <h2 id="filter-sheet-title">Filtros</h2>
          <button
            type="button"
            className="sheet__close"
            onClick={() => setSheetOpen(false)}
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
        </div>
        <div className="sheet__body">
          <label className="field">
            <span>Tipo de comida</span>
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
          <label className="field">
            <span>Máximo de minutos</span>
            <input
              type="number"
              value={maxMinutos}
              onChange={(e) => setMaxMinutos(e.target.value)}
              min={0}
              placeholder="sin límite"
              inputMode="numeric"
            />
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={congelableOnly}
              onChange={(e) => setCongelableOnly(e.target.checked)}
            />
            <span>Solo recetas congelables</span>
          </label>
          <fieldset className="field">
            <legend>Excluir alérgenos</legend>
            <div className="chip-group">
              {alergenos
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map((a) => {
                  const on = excludedAlergenos.has(a.id);
                  return (
                    <label
                      key={a.id}
                      className="chip chip--toggle"
                      data-active={on}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleAlergeno(a.id)}
                      />
                      {a.nombre}
                    </label>
                  );
                })}
            </div>
          </fieldset>
        </div>
        <div className="sheet__footer">
          <button type="button" className="button button--ghost" onClick={reset}>
            Limpiar
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setSheetOpen(false)}
          >
            Ver {filtered.length} recetas
          </button>
        </div>
      </aside>
    </>
  );
}
