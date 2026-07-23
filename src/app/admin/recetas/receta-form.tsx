"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Alergeno, Etapa, Ingrediente, Receta, Tecnica, TipoComida, VarianteEtapa } from "@/lib/schema";
import { ETAPA_IDS } from "@/lib/schema";

interface Props {
  mode: "create" | "edit";
  initial: Receta;
  etapas: Etapa[];
  ingredientes: Ingrediente[];
  alergenos: Alergeno[];
  tecnicas: Tecnica[];
}

const TIPOS: { value: TipoComida; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "colacion", label: "Colación" },
];

export function RecetaForm({
  mode,
  initial,
  etapas,
  ingredientes: initialIngredientes,
  alergenos,
  tecnicas,
}: Props) {
  const router = useRouter();
  const [ingredientesCatalog, setIngredientesCatalog] = useState(initialIngredientes);
  const [state, setState] = useState<Receta>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const etapasOrdenadas = useMemo(
    () => [...etapas].sort((a, b) => a.orden - b.orden),
    [etapas]
  );
  const ingredientesOrdenados = useMemo(
    () => [...ingredientesCatalog].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [ingredientesCatalog]
  );

  function set<K extends keyof Receta>(key: K, value: Receta[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!state.titulo.trim()) errs.titulo = "El título es obligatorio";
    if (!state.tipo_comida) errs.tipo_comida = "Selecciona un tipo de comida";
    for (const id of ETAPA_IDS) {
      const v = state.variantes[id];
      if (!v?.textura?.trim()) errs[`variantes.${id}.textura`] = "La textura es obligatoria";
      if (!v?.porcion?.trim()) errs[`variantes.${id}.porcion`] = "La porción es obligatoria";
    }
    if (state.minutos_prep != null && (!Number.isInteger(state.minutos_prep) || state.minutos_prep <= 0)) {
      errs.minutos_prep = "Los minutos deben ser un entero mayor a 0";
    }
    if (state.kcal_100g != null && state.kcal_100g < 0) {
      errs.kcal_100g = "Las calorías no pueden ser negativas";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function updateVariante(etapaId: string, patch: Partial<VarianteEtapa>) {
    setState((s) => ({
      ...s,
      variantes: {
        ...s.variantes,
        [etapaId]: { ...s.variantes[etapaId], ...patch },
      },
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/recetas" : `/api/recetas/${state.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.details && Array.isArray(err.details)) {
          const map: Record<string, string> = {};
          for (const d of err.details) map[d.field] = d.message;
          setErrors(map);
        }
        setGlobalError(err.error ?? "No se pudo guardar la receta");
        return;
      }
      const saved = await res.json();
      router.push(`/admin/recetas`);
      router.refresh();
      // Navigate to the detail view so Amneris can see the result
      setTimeout(() => router.push(`/recetas/${saved.id}`), 100);
    } finally {
      setSaving(false);
    }
  }

  // Ingredient row helpers
  function addIngrediente() {
    setState((s) => ({
      ...s,
      receta_ingredientes: [
        ...s.receta_ingredientes,
        { ingrediente_id: "", cantidad: null, unidad: null, nota: null },
      ],
    }));
  }
  function removeIngrediente(idx: number) {
    setState((s) => ({
      ...s,
      receta_ingredientes: s.receta_ingredientes.filter((_, i) => i !== idx),
    }));
  }
  function updateIngrediente(idx: number, patch: Partial<Receta["receta_ingredientes"][number]>) {
    setState((s) => ({
      ...s,
      receta_ingredientes: s.receta_ingredientes.map((ri, i) =>
        i === idx ? { ...ri, ...patch } : ri
      ),
    }));
  }

  async function crearIngrediente(idx: number) {
    const nombre = prompt(
      "Nombre del nuevo ingrediente (en singular, ej. \"Manzana verde\"):"
    );
    if (!nombre?.trim()) return;
    const categoria = prompt(
      "Categoría (ej. Frutas, Proteínas, Vegetales y Granos, Carbohidratos, Lácteos, Hierbas y Especias, Otros):",
      "Otros"
    );
    if (!categoria?.trim()) return;
    const res = await fetch("/api/ingredientes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), categoria: categoria.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "No se pudo crear el ingrediente");
      return;
    }
    const created: Ingrediente = await res.json();
    setIngredientesCatalog((cur) => [...cur, created]);
    updateIngrediente(idx, { ingrediente_id: created.id });
  }

  // Steps
  function addPaso() {
    setState((s) => ({ ...s, pasos: [...s.pasos, ""] }));
  }
  function updatePaso(idx: number, value: string) {
    setState((s) => ({ ...s, pasos: s.pasos.map((p, i) => (i === idx ? value : p)) }));
  }
  function removePaso(idx: number) {
    setState((s) => ({ ...s, pasos: s.pasos.filter((_, i) => i !== idx) }));
  }
  function movePaso(idx: number, delta: -1 | 1) {
    setState((s) => {
      const arr = [...s.pasos];
      const j = idx + delta;
      if (j < 0 || j >= arr.length) return s;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...s, pasos: arr };
    });
  }

  // Allergens & techniques toggles
  function toggleAlergeno(id: string) {
    setState((s) => {
      const has = s.receta_alergenos.some((a) => a.alergeno_id === id);
      return {
        ...s,
        receta_alergenos: has
          ? s.receta_alergenos.filter((a) => a.alergeno_id !== id)
          : [...s.receta_alergenos, { alergeno_id: id }],
      };
    });
  }
  function toggleTecnica(id: string) {
    setState((s) => {
      const has = s.receta_tecnicas.some((t) => t.tecnica_id === id);
      return {
        ...s,
        receta_tecnicas: has
          ? s.receta_tecnicas.filter((t) => t.tecnica_id !== id)
          : [...s.receta_tecnicas, { tecnica_id: id }],
      };
    });
  }
  function toggleVitamina(v: string) {
    setState((s) => {
      const has = s.vitaminas.includes(v);
      return { ...s, vitaminas: has ? s.vitaminas.filter((x) => x !== v) : [...s.vitaminas, v] };
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {globalError && (
        <div
          style={{
            background: "#fdecea",
            border: "1px solid #a83030",
            padding: "0.6rem 0.8rem",
            borderRadius: 4,
            marginBottom: "1rem",
            color: "#a83030",
          }}
        >
          {globalError}
        </div>
      )}

      <Field label="Título" error={errors.titulo}>
        <input
          type="text"
          value={state.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          style={{ width: "100%" }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Tipo de comida" error={errors.tipo_comida}>
          <select
            value={state.tipo_comida}
            onChange={(e) => set("tipo_comida", e.target.value as TipoComida)}
            style={{ width: "100%" }}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Número (opcional, solo para mostrar)">
          <input
            type="number"
            value={state.numero ?? ""}
            onChange={(e) =>
              set("numero", e.target.value ? parseInt(e.target.value, 10) : null)
            }
            style={{ width: "100%" }}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <Field label="Minutos de preparación" error={errors.minutos_prep}>
          <input
            type="number"
            value={state.minutos_prep ?? ""}
            onChange={(e) =>
              set("minutos_prep", e.target.value ? parseInt(e.target.value, 10) : null)
            }
            style={{ width: "100%" }}
          />
        </Field>
        <Field label="Kcal / 100 g" error={errors.kcal_100g}>
          <input
            type="number"
            value={state.kcal_100g ?? ""}
            onChange={(e) =>
              set("kcal_100g", e.target.value ? parseFloat(e.target.value) : null)
            }
            style={{ width: "100%" }}
          />
        </Field>
        <Field label="Congelable">
          <select
            value={state.congelable == null ? "" : state.congelable ? "si" : "no"}
            onChange={(e) => {
              const v = e.target.value;
              set("congelable", v === "" ? null : v === "si");
            }}
            style={{ width: "100%" }}
          >
            <option value="">— sin especificar —</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </Field>
      </div>

      <Field label="Conservación">
        <input
          type="text"
          value={state.conservacion ?? ""}
          onChange={(e) => set("conservacion", e.target.value || null)}
          placeholder="ej. 48 horas en refrigerador"
          style={{ width: "100%" }}
        />
      </Field>

      <Field label="Notas">
        <textarea
          value={state.notas ?? ""}
          onChange={(e) => set("notas", e.target.value || null)}
          rows={2}
          style={{ width: "100%" }}
        />
      </Field>

      <h2>Variantes por etapa</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        La receta aplica a las 3 etapas. Aquí definís la textura y porción de
        cada una.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {etapasOrdenadas.map((etapa) => {
          const v = state.variantes[etapa.id] ?? { textura: "", porcion: "" };
          return (
            <div
              key={etapa.id}
              style={{
                borderTop: `4px solid ${etapa.paleta.primary}`,
                background: etapa.paleta.soft,
                padding: "0.75rem",
                borderRadius: 6,
                color: etapa.paleta.ink,
              }}
            >
              <strong>{etapa.nombre}</strong>
              <div className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                {etapa.rango_edad}
              </div>
              <Field label="Textura" error={errors[`variantes.${etapa.id}.textura`]}>
                <textarea
                  value={v.textura}
                  onChange={(e) => updateVariante(etapa.id, { textura: e.target.value })}
                  rows={2}
                  style={{ width: "100%" }}
                />
              </Field>
              <Field label="Porción" error={errors[`variantes.${etapa.id}.porcion`]}>
                <input
                  type="text"
                  value={v.porcion}
                  onChange={(e) => updateVariante(etapa.id, { porcion: e.target.value })}
                  style={{ width: "100%" }}
                />
              </Field>
            </div>
          );
        })}
      </div>

      <h2>Ingredientes</h2>
      {state.receta_ingredientes.length === 0 && (
        <p className="muted">Ningún ingrediente todavía.</p>
      )}
      <table>
        <thead>
          <tr>
            <th style={{ width: "45%" }}>Ingrediente</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Nota</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {state.receta_ingredientes.map((ri, idx) => (
            <tr key={idx}>
              <td>
                <select
                  value={ri.ingrediente_id}
                  onChange={(e) => updateIngrediente(idx, { ingrediente_id: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">— selecciona —</option>
                  {ingredientesOrdenados.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.categoria})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => crearIngrediente(idx)}
                  style={{
                    marginTop: 4,
                    background: "transparent",
                    border: "1px solid #7a3e3e",
                    color: "#7a3e3e",
                    padding: "0.2rem 0.5rem",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  ➕ Crear nuevo ingrediente
                </button>
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  value={ri.cantidad ?? ""}
                  onChange={(e) =>
                    updateIngrediente(idx, {
                      cantidad: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={ri.unidad ?? ""}
                  onChange={(e) => updateIngrediente(idx, { unidad: e.target.value || null })}
                  placeholder="g, ml, cucharada…"
                  style={{ width: 100 }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={ri.nota ?? ""}
                  onChange={(e) => updateIngrediente(idx, { nota: e.target.value || null })}
                  placeholder="opcional"
                  style={{ width: "100%" }}
                />
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => removeIngrediente(idx)}
                  style={{
                    background: "transparent",
                    color: "#a83030",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addIngrediente}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          padding: "0.4rem 0.8rem",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        + Agregar ingrediente
      </button>

      <h2>Pasos de preparación</h2>
      {state.pasos.length === 0 && <p className="muted">Ningún paso todavía.</p>}
      <ol className="steps">
        {state.pasos.map((paso, idx) => (
          <li key={idx} style={{ marginBottom: "0.5rem" }}>
            <textarea
              value={paso}
              onChange={(e) => updatePaso(idx, e.target.value)}
              rows={2}
              style={{ width: "calc(100% - 200px)", verticalAlign: "top" }}
            />
            <span style={{ marginLeft: 8 }}>
              <button type="button" onClick={() => movePaso(idx, -1)} disabled={idx === 0}>
                ↑
              </button>{" "}
              <button
                type="button"
                onClick={() => movePaso(idx, 1)}
                disabled={idx === state.pasos.length - 1}
              >
                ↓
              </button>{" "}
              <button type="button" onClick={() => removePaso(idx)}>
                Quitar
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={addPaso}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          padding: "0.4rem 0.8rem",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        + Agregar paso
      </button>

      <h2>Alérgenos</h2>
      <div>
        {alergenos.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((a) => {
          const checked = state.receta_alergenos.some((ra) => ra.alergeno_id === a.id);
          return (
            <label key={a.id} className="chip" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleAlergeno(a.id)}
                style={{ marginRight: 4 }}
              />
              {a.nombre}
            </label>
          );
        })}
      </div>

      <h2>Técnicas</h2>
      <div>
        {tecnicas.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((t) => {
          const checked = state.receta_tecnicas.some((rt) => rt.tecnica_id === t.id);
          return (
            <label key={t.id} className="chip" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTecnica(t.id)}
                style={{ marginRight: 4 }}
              />
              {t.nombre}
            </label>
          );
        })}
      </div>

      <h2>Vitaminas</h2>
      <div>
        {["Vit. A", "Vit. B1", "Vit. B2", "Vit. B6", "Vit. B12", "Vit. C", "Vit. D", "Vit. E", "Vit. K", "Hierro", "Calcio", "Zinc"].map((v) => {
          const checked = state.vitaminas.includes(v);
          return (
            <label key={v} className="chip" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleVitamina(v)}
                style={{ marginRight: 4 }}
              />
              {v}
            </label>
          );
        })}
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear receta" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.85rem",
          color: "var(--muted)",
          marginBottom: "0.2rem",
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <div style={{ color: "#a83030", fontSize: "0.85rem", marginTop: 2 }}>{error}</div>
      )}
    </div>
  );
}
