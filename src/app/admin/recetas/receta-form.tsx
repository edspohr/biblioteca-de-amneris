"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  Alergeno,
  Coleccion,
  Etapa,
  Ingrediente,
  PasoDetalle,
  Receta,
  Tecnica,
  TipoComida,
  VarianteEtapa,
  VitaminaDetalle,
} from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { SaveStatusBanner } from "@/components/admin/save-status";
import { iconoDe, tonoStyle } from "@/lib/colecciones";

interface Props {
  mode: "create" | "edit";
  initial: Receta;
  etapas: Etapa[];
  ingredientes: Ingrediente[];
  alergenos: Alergeno[];
  tecnicas: Tecnica[];
  colecciones: Coleccion[];
}

const TIPOS: { value: TipoComida; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "colacion", label: "Colación" },
];

const VITAMINAS_BASE = [
  "Vit. A", "Vit. B1", "Vit. B2", "Vit. B6", "Vit. B12", "Vit. C",
  "Vit. D", "Vit. E", "Vit. K", "Hierro", "Calcio", "Zinc",
];

const NIVELES: { value: VitaminaDetalle["nivel"]; label: string }[] = [
  { value: null, label: "—" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

export function RecetaForm({
  mode,
  initial,
  etapas,
  ingredientes: initialIngredientes,
  alergenos,
  tecnicas,
  colecciones,
}: Props) {
  const router = useRouter();
  const [ingredientesCatalog, setIngredientesCatalog] = useState(initialIngredientes);
  const [state, _setState] = useState<Receta>(initial);
  const [dirty, setDirty] = useState(false);
  const setState: typeof _setState = (updater) => {
    setDirty(true);
    _setState(updater);
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { status, runSave, clearError } = useSaveState();
  const saving = status.kind === "saving";

  useUnsavedChanges(dirty && !saving);

  const etapasOrdenadas = useMemo(() => [...etapas].sort((a, b) => a.orden - b.orden), [etapas]);
  const ingredientesOrdenados = useMemo(
    () => [...ingredientesCatalog].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [ingredientesCatalog]
  );
  const coleccionesOrdenadas = useMemo(() => [...colecciones].sort((a, b) => a.orden - b.orden), [colecciones]);
  // Structured steps (acción + observación) are used by the newer
  // collections; older recipes keep plain text steps.
  const usaPasosDetalle = (state.pasosDetalle?.length ?? 0) > 0;
  const vitaminasOpciones = useMemo(
    () => [...VITAMINAS_BASE, ...state.vitaminas.filter((v) => !VITAMINAS_BASE.includes(v))],
    [state.vitaminas]
  );

  function set<K extends keyof Receta>(key: K, value: Receta[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!state.titulo.trim()) errs.titulo = "El título es obligatorio";
    if (!state.tipo_comida) errs.tipo_comida = "Selecciona un tipo de comida";
    const activas = Object.keys(state.variantes);
    if (activas.length === 0) errs.variantes = "La receta tiene que aplicar al menos a una etapa";
    for (const id of activas) {
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

  // -- Etapas -------------------------------------------------------------
  function updateVariante(etapaId: string, patch: Partial<VarianteEtapa>) {
    setState((s) => ({
      ...s,
      variantes: { ...s.variantes, [etapaId]: { ...s.variantes[etapaId], ...patch } },
    }));
  }
  function toggleEtapa(etapaId: string) {
    setState((s) => {
      const next = { ...s.variantes };
      if (next[etapaId]) {
        delete next[etapaId];
      } else {
        const original = initial.variantes[etapaId];
        next[etapaId] = original ?? { textura: "", porcion: "" };
      }
      return { ...s, variantes: next };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    const url = mode === "create" ? "/api/recetas" : `/api/recetas/${state.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const res = await runSave(() => saveWithVerify<Receta>(url, method, state));
    if (!res.ok) {
      if (res.details) {
        const map: Record<string, string> = {};
        for (const d of res.details) map[d.field] = d.message;
        setErrors(map);
      }
      return;
    }
    setDirty(false);
    router.refresh();
    // Small delay so the "Guardado a las HH:MM" toast is visible before the
    // navigation replaces the page. This is UX polish, not a correctness gate:
    // the save is already confirmed persisted at this point (see verifyWrite
    // in src/lib/repo/verify.ts).
    setTimeout(() => router.push(`/recetas/${res.data.id}`), 800);
  }

  // -- Ingredients -------------------------------------------------------
  function addIngrediente() {
    setState((s) => ({
      ...s,
      receta_ingredientes: [...s.receta_ingredientes, { ingrediente_id: "", cantidad: null, unidad: null, nota: null }],
    }));
  }
  function removeIngrediente(idx: number) {
    setState((s) => ({ ...s, receta_ingredientes: s.receta_ingredientes.filter((_, i) => i !== idx) }));
  }
  function updateIngrediente(idx: number, patch: Partial<Receta["receta_ingredientes"][number]>) {
    setState((s) => ({
      ...s,
      receta_ingredientes: s.receta_ingredientes.map((ri, i) => (i === idx ? { ...ri, ...patch } : ri)),
    }));
  }

  async function crearIngrediente(idx: number) {
    const nombre = prompt('Nombre del nuevo ingrediente (en singular, ej. "Manzana verde"):');
    if (!nombre?.trim()) return;
    const categoria = prompt(
      "Categoría (ej. Frutas, Proteínas, Vegetales y Granos, Carbohidratos, Lácteos, Hierbas y Especias, Otros):",
      "Otros"
    );
    if (!categoria?.trim()) return;
    const res = await saveWithVerify<Ingrediente>("/api/ingredientes", "POST", {
      nombre: nombre.trim(),
      categoria: categoria.trim(),
    });
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setIngredientesCatalog((cur) => [...cur, res.data]);
    updateIngrediente(idx, { ingrediente_id: res.data.id });
  }

  // -- Plain steps -------------------------------------------------------
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

  // -- Structured steps --------------------------------------------------
  // `pasos` mirrors the acciones so older readers keep working.
  function setPasosDetalle(next: PasoDetalle[]) {
    const renumerados = next.map((p, i) => ({ ...p, orden: i }));
    setState((s) => ({ ...s, pasosDetalle: renumerados, pasos: renumerados.map((p) => p.accion) }));
  }
  const pasosDetalle = state.pasosDetalle ?? [];
  function movePasoDetalle(idx: number, delta: -1 | 1) {
    const j = idx + delta;
    if (j < 0 || j >= pasosDetalle.length) return;
    const arr = [...pasosDetalle];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setPasosDetalle(arr);
  }

  // -- Allergens / techniques / vitamins ---------------------------------
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
  function confirmarAlergenos() {
    setState((s) => ({
      ...s,
      receta_alergenos: s.receta_alergenos.map(({ alergeno_id }) => ({ alergeno_id })),
    }));
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
  const vitaminasDetalle = state.vitaminasDetalle ?? [];
  function setVitaminasDetalle(next: VitaminaDetalle[]) {
    setState((s) => ({ ...s, vitaminasDetalle: next }));
  }
  function toggleColeccion(id: string) {
    setState((s) => {
      const cur = s.coleccionIds ?? [];
      return { ...s, coleccionIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  }

  const alergenosSugeridos = state.receta_alergenos.filter((a) => a.inferido).length;
  const nEtapas = Object.keys(state.variantes).length;

  return (
    <form onSubmit={onSubmit} className="receta-form">
      <Section titulo="Lo básico" abierta>
        <Field label="Título" error={errors.titulo}>
          <input type="text" value={state.titulo} onChange={(e) => set("titulo", e.target.value)} />
        </Field>
        <div className="form-grid form-grid--3">
          <Field label="Tipo de comida" error={errors.tipo_comida}>
            <select value={state.tipo_comida} onChange={(e) => set("tipo_comida", e.target.value as TipoComida)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minutos de preparación" error={errors.minutos_prep}>
            <input
              type="number"
              value={state.minutos_prep ?? ""}
              onChange={(e) => set("minutos_prep", e.target.value ? parseInt(e.target.value, 10) : null)}
            />
          </Field>
          <Field label="Número (opcional, solo para mostrar)">
            <input
              type="number"
              value={state.numero ?? ""}
              onChange={(e) => set("numero", e.target.value ? parseInt(e.target.value, 10) : null)}
            />
          </Field>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={state.destacadaPreview}
            onChange={(e) => set("destacadaPreview", e.target.checked)}
          />
          <span>Mostrar como receta gratis (visible sin cuenta, para atraer registros).</span>
        </label>
        <Field label="Notas">
          <textarea value={state.notas ?? ""} onChange={(e) => set("notas", e.target.value || null)} rows={2} />
        </Field>
      </Section>

      <Section titulo="Colección" resumen={colResumen(state.coleccionIds ?? [], colecciones)} abierta>
        <p className="form-field__hint">¿En qué libro de tu biblioteca aparece esta receta? Puede estar en más de uno.</p>
        <div className="col-picker">
          {coleccionesOrdenadas.map((c) => {
            const on = (state.coleccionIds ?? []).includes(c.id);
            return (
              <label key={c.id} className="col-picker__opt" data-checked={on || undefined} style={tonoStyle(c) as CSSProperties}>
                <input type="checkbox" checked={on} onChange={() => toggleColeccion(c.id)} />
                <span aria-hidden="true">{iconoDe(c)}</span>
                {c.nombre}
              </label>
            );
          })}
        </div>
      </Section>

      <Section titulo="Por etapa" resumen={`${nEtapas} de ${etapasOrdenadas.length} etapas`} abierta>
        <p className="form-field__hint">
          Marca las etapas a las que aplica la receta y define su textura y porción.
        </p>
        {errors.variantes && <p className="form-error">{errors.variantes}</p>}
        <div className="etapa-editor">
          {etapasOrdenadas.map((etapa) => {
            const v = state.variantes[etapa.id];
            return (
              <div
                key={etapa.id}
                className="etapa-editor__col"
                data-off={!v || undefined}
                style={{
                  ["--tile-primary" as string]: etapa.paleta.primary,
                  ["--tile-soft" as string]: etapa.paleta.soft,
                  ["--tile-ink" as string]: etapa.paleta.ink,
                }}
              >
                <label className="etapa-editor__head">
                  <input type="checkbox" checked={Boolean(v)} onChange={() => toggleEtapa(etapa.id)} />
                  <span>
                    <strong>{etapa.nombre}</strong>
                    <small>{etapa.rango_edad}</small>
                  </span>
                </label>
                {v ? (
                  <>
                    <Field label="Textura" error={errors[`variantes.${etapa.id}.textura`]}>
                      <textarea
                        value={v.textura}
                        onChange={(e) => updateVariante(etapa.id, { textura: e.target.value })}
                        rows={2}
                      />
                    </Field>
                    <Field label="Porción" error={errors[`variantes.${etapa.id}.porcion`]}>
                      <input
                        type="text"
                        value={v.porcion}
                        onChange={(e) => updateVariante(etapa.id, { porcion: e.target.value })}
                      />
                    </Field>
                  </>
                ) : (
                  <p className="etapa-editor__off">No aplica a esta etapa.</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section titulo="Ingredientes" resumen={`${state.receta_ingredientes.length}`} abierta>
        {state.receta_ingredientes.length === 0 && <p className="muted">Ningún ingrediente todavía.</p>}
        <ul className="ing-editor">
          {state.receta_ingredientes.map((ri, idx) => (
            <li key={idx} className="ing-editor__row">
              <div className="ing-editor__name">
                <select
                  value={ri.ingrediente_id}
                  onChange={(e) => updateIngrediente(idx, { ingrediente_id: e.target.value })}
                  aria-label="Ingrediente"
                >
                  <option value="">— selecciona —</option>
                  {ingredientesOrdenados.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.categoria})
                    </option>
                  ))}
                </select>
                <button type="button" className="text-button" onClick={() => crearIngrediente(idx)}>
                  + Crear ingrediente nuevo
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={ri.cantidad ?? ""}
                onChange={(e) => updateIngrediente(idx, { cantidad: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Cant."
                aria-label="Cantidad"
              />
              <input
                type="text"
                value={ri.unidad ?? ""}
                onChange={(e) => updateIngrediente(idx, { unidad: e.target.value || null })}
                placeholder="g, ml…"
                aria-label="Unidad"
              />
              <input
                type="text"
                value={ri.nota ?? ""}
                onChange={(e) => updateIngrediente(idx, { nota: e.target.value || null })}
                placeholder="Nota (opcional)"
                aria-label="Nota"
              />
              <button type="button" className="link-button" onClick={() => removeIngrediente(idx)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="button button--ghost" onClick={addIngrediente}>
          + Agregar ingrediente
        </button>
      </Section>

      <Section
        titulo="Preparación"
        resumen={`${usaPasosDetalle ? pasosDetalle.length : state.pasos.length} pasos`}
        abierta
      >
        {usaPasosDetalle ? (
          <>
            <ol className="paso-editor">
              {pasosDetalle.map((p, idx) => (
                <li key={idx} className="paso-editor__row">
                  <span className="paso-editor__num">{idx + 1}</span>
                  <div className="paso-editor__fields">
                    <textarea
                      value={p.accion}
                      rows={2}
                      aria-label={`Paso ${idx + 1}: acción`}
                      placeholder="Qué hacer"
                      onChange={(e) =>
                        setPasosDetalle(pasosDetalle.map((x, i) => (i === idx ? { ...x, accion: e.target.value } : x)))
                      }
                    />
                    <input
                      type="text"
                      value={p.observacion ?? ""}
                      aria-label={`Paso ${idx + 1}: observación`}
                      placeholder="Observación (opcional): por qué o cómo saber que está listo"
                      onChange={(e) =>
                        setPasosDetalle(
                          pasosDetalle.map((x, i) => (i === idx ? { ...x, observacion: e.target.value || null } : x))
                        )
                      }
                    />
                  </div>
                  <StepActions
                    first={idx === 0}
                    last={idx === pasosDetalle.length - 1}
                    onUp={() => movePasoDetalle(idx, -1)}
                    onDown={() => movePasoDetalle(idx, 1)}
                    onRemove={() => setPasosDetalle(pasosDetalle.filter((_, i) => i !== idx))}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setPasosDetalle([...pasosDetalle, { orden: pasosDetalle.length, accion: "", observacion: null }])}
            >
              + Agregar paso
            </button>
          </>
        ) : (
          <>
            {state.pasos.length === 0 && <p className="muted">Ningún paso todavía.</p>}
            <ol className="paso-editor">
              {state.pasos.map((paso, idx) => (
                <li key={idx} className="paso-editor__row">
                  <span className="paso-editor__num">{idx + 1}</span>
                  <div className="paso-editor__fields">
                    <textarea
                      value={paso}
                      onChange={(e) => updatePaso(idx, e.target.value)}
                      rows={2}
                      aria-label={`Paso ${idx + 1}`}
                    />
                  </div>
                  <StepActions
                    first={idx === 0}
                    last={idx === state.pasos.length - 1}
                    onUp={() => movePaso(idx, -1)}
                    onDown={() => movePaso(idx, 1)}
                    onRemove={() => removePaso(idx)}
                  />
                </li>
              ))}
            </ol>
            <div className="form-actions-inline">
              <button type="button" className="button button--ghost" onClick={addPaso}>
                + Agregar paso
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setPasosDetalle(
                    (state.pasos.length ? state.pasos : [""]).map((accion, i) => ({ orden: i, accion, observacion: null }))
                  )
                }
              >
                Agregar observaciones a los pasos
              </button>
            </div>
          </>
        )}
      </Section>

      <Section
        titulo="Alérgenos"
        resumen={alergenosSugeridos ? `${alergenosSugeridos} por revisar` : `${state.receta_alergenos.length}`}
        abierta={alergenosSugeridos > 0}
      >
        {alergenosSugeridos > 0 && (
          <div className="notice">
            <span>
              Los marcados como <strong>sugerido</strong> se dedujeron de los ingredientes. Revísalos y confírmalos.
            </span>
            <button type="button" className="button button--ghost" onClick={confirmarAlergenos}>
              Confirmar alérgenos
            </button>
          </div>
        )}
        <div className="chip-group">
          {[...alergenos].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((a) => {
            const ra = state.receta_alergenos.find((x) => x.alergeno_id === a.id);
            return (
              <label key={a.id} className="chip chip--toggle" data-active={Boolean(ra)}>
                <input type="checkbox" checked={Boolean(ra)} onChange={() => toggleAlergeno(a.id)} />
                {a.nombre}
                {ra?.inferido && <span className="flag">sugerido</span>}
              </label>
            );
          })}
        </div>
      </Section>

      <Section titulo="Nutrición" resumen={state.kcal_100g != null ? `${state.kcal_100g} kcal / 100 g` : undefined}>
        <div className="form-grid form-grid--3">
          <Field label="Kcal / 100 g" error={errors.kcal_100g}>
            <input
              type="number"
              value={state.kcal_100g ?? ""}
              onChange={(e) => set("kcal_100g", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </Field>
        </div>
        <FieldGroup label="Vitaminas y minerales">
          <div className="chip-group">
            {vitaminasOpciones.map((v) => {
              const on = state.vitaminas.includes(v);
              return (
                <label key={v} className="chip chip--toggle" data-active={on}>
                  <input type="checkbox" checked={on} onChange={() => toggleVitamina(v)} />
                  {v}
                </label>
              );
            })}
          </div>
        </FieldGroup>
        <div className="form-field">
          <span className="form-field__label">Detalle por vitamina (nivel y beneficio)</span>
          {vitaminasDetalle.length > 0 && (
            <ul className="vit-editor">
              {vitaminasDetalle.map((v, idx) => (
                <li key={idx} className="vit-editor__row">
                  <input
                    type="text"
                    value={v.etiquetaId.replace(/-/g, " ")}
                    aria-label="Vitamina o mineral"
                    placeholder="vitamina a"
                    onChange={(e) =>
                      setVitaminasDetalle(
                        vitaminasDetalle.map((x, i) =>
                          i === idx ? { ...x, etiquetaId: e.target.value.toLowerCase().replace(/\s/g, "-") } : x
                        )
                      )
                    }
                  />
                  <select
                    value={v.nivel ?? ""}
                    aria-label="Nivel"
                    onChange={(e) =>
                      setVitaminasDetalle(
                        vitaminasDetalle.map((x, i) =>
                          i === idx ? { ...x, nivel: (e.target.value || null) as VitaminaDetalle["nivel"] } : x
                        )
                      )
                    }
                  >
                    {NIVELES.map((n) => (
                      <option key={n.label} value={n.value ?? ""}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={v.beneficio ?? ""}
                    aria-label="Beneficio"
                    placeholder="Beneficio (ej. visión y crecimiento)"
                    onChange={(e) =>
                      setVitaminasDetalle(
                        vitaminasDetalle.map((x, i) => (i === idx ? { ...x, beneficio: e.target.value || null } : x))
                      )
                    }
                  />
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setVitaminasDetalle(vitaminasDetalle.filter((_, i) => i !== idx))}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => setVitaminasDetalle([...vitaminasDetalle, { etiquetaId: "vitamina", nivel: null, beneficio: null }])}
          >
            + Agregar detalle de vitamina
          </button>
        </div>
      </Section>

      <Section titulo="Conservación y técnicas">
        <div className="form-grid form-grid--2">
          <Field label="Congelable">
            <select
              value={state.congelable == null ? "" : state.congelable ? "si" : "no"}
              onChange={(e) => {
                const v = e.target.value;
                set("congelable", v === "" ? null : v === "si");
              }}
            >
              <option value="">— sin especificar —</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Conservación">
            <input
              type="text"
              value={state.conservacion ?? ""}
              onChange={(e) => set("conservacion", e.target.value || null)}
              placeholder="ej. 48 horas en refrigerador"
            />
          </Field>
        </div>
        <FieldGroup label="Técnicas">
          <div className="chip-group">
            {[...tecnicas].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((t) => {
              const on = state.receta_tecnicas.some((rt) => rt.tecnica_id === t.id);
              return (
                <label key={t.id} className="chip chip--toggle" data-active={on}>
                  <input type="checkbox" checked={on} onChange={() => toggleTecnica(t.id)} />
                  {t.nombre}
                </label>
              );
            })}
          </div>
        </FieldGroup>
      </Section>

      <div className="save-bar">
        <SaveStatusBanner status={status} onDismissError={clearError} />
        {Object.keys(errors).length > 0 && <p className="form-error">Hay campos por revisar más arriba.</p>}
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? "Guardando…" : mode === "create" ? "Crear receta" : "Guardar cambios"}
        </button>
        {dirty && !saving && <span className="save-bar__dirty">Cambios sin guardar</span>}
      </div>
    </form>
  );
}

function colResumen(ids: string[], colecciones: Coleccion[]): string {
  if (ids.length === 0) return "sin colección";
  return ids.map((id) => colecciones.find((c) => c.id === id)?.nombre ?? id).join(", ");
}

function Section({
  titulo,
  resumen,
  abierta = false,
  children,
}: {
  titulo: string;
  resumen?: string;
  abierta?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="form-section" open={abierta}>
      <summary>
        <span className="form-section__title">{titulo}</span>
        {resumen && <span className="form-section__resumen">{resumen}</span>}
      </summary>
      <div className="form-section__body">{children}</div>
    </details>
  );
}

function StepActions({
  first,
  last,
  onUp,
  onDown,
  onRemove,
}: {
  first: boolean;
  last: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="paso-editor__actions">
      <button type="button" onClick={onUp} disabled={first} aria-label="Subir paso">
        ↑
      </button>
      <button type="button" onClick={onDown} disabled={last} aria-label="Bajar paso">
        ↓
      </button>
      <button type="button" onClick={onRemove} aria-label="Quitar paso">
        ✕
      </button>
    </span>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
      {error && <span className="form-error">{error}</span>}
    </label>
  );
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-field" role="group" aria-label={label}>
      <span className="form-field__label">{label}</span>
      {children}
    </div>
  );
}
