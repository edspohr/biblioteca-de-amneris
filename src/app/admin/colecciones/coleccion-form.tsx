"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Coleccion, ColeccionEje, ColeccionEstado, ColeccionTipo, ColeccionTono } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { SaveStatusBanner } from "@/components/admin/save-status";
import { ColeccionPortada } from "@/components/coleccion-portada";
import {
  ESTADO_ADMIN,
  ESTADOS_ORDEN,
  TONOS,
  TONO_IDS,
  estadoEfectivo,
  hoyISO,
  iconoDe,
  lineaLanzamiento,
  tonoDe,
  tonoStyle,
  type ColeccionDato,
} from "@/lib/colecciones";

interface Props {
  initial: Coleccion | null;
  dato?: ColeccionDato | null;
  siguienteOrden?: number;
}

const TIPOS: { value: ColeccionTipo; label: string; hint: string }[] = [
  { value: "recetario", label: "Recetario", hint: "Un libro de recetas sueltas, para cualquier día." },
  { value: "plan", label: "Plan de cocina", hint: "Un día de cocina que resuelve el mes: menús, guías y recetas." },
  { value: "guia", label: "Guía", hint: "Solo textos: consejos, tablas y paso a paso." },
];

const EJES: { value: ColeccionEje | ""; label: string }[] = [
  { value: "", label: "Sin ingrediente principal" },
  { value: "pollo", label: "Pollo" },
  { value: "pescado", label: "Pescado" },
  { value: "vacuno", label: "Vacuno" },
  { value: "vegetal", label: "Vegetal" },
  { value: "mixto", label: "Mixto" },
];

const ICONOS = ["🧡", "🐔", "🐟", "🥩", "🥕", "🥑", "🍎", "🍲", "🥣", "🍳", "🧁", "🌱", "📖", "⭐"];

type Draft = {
  nombre: string;
  bajada: string;
  descripcionCorta: string;
  tipo: ColeccionTipo;
  eje: ColeccionEje | "";
  tono: ColeccionTono | null;
  icono: string;
  estado: ColeccionEstado;
  fechaLanzamiento: string;
};

function toDraft(c: Coleccion | null): Draft {
  return {
    nombre: c?.nombre ?? "",
    bajada: c?.bajada ?? "",
    descripcionCorta: c?.descripcionCorta ?? "",
    tipo: c?.tipo ?? "recetario",
    eje: c?.eje ?? "",
    tono: c?.tono ?? null,
    icono: c?.icono ?? "",
    estado: c?.estado ?? "oculta",
    fechaLanzamiento: c?.fechaLanzamiento ?? "",
  };
}

export function ColeccionForm({ initial, dato, siguienteOrden = 0 }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [saved, setSaved] = useState<Draft>(() => toDraft(initial));
  const [intentado, setIntentado] = useState(false);
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // What the cover preview renders: the stored doc with the draft on top.
  const preview: Coleccion = useMemo(
    () => ({
      id: initial?.id ?? "nueva",
      orden: initial?.orden ?? siguienteOrden,
      portadaUrl: initial?.portadaUrl ?? null,
      nombre: draft.nombre || "Nombre de la colección",
      bajada: draft.bajada || "La bajada aparece aquí.",
      descripcionCorta: draft.descripcionCorta || null,
      tipo: draft.tipo,
      eje: draft.eje || null,
      tono: draft.tono,
      icono: draft.icono || null,
      estado: draft.estado,
      fechaLanzamiento: draft.fechaLanzamiento || null,
    }),
    [draft, initial, siguienteOrden]
  );

  const hoy = hoyISO();
  const errores: Partial<Record<keyof Draft, string>> = {};
  if (!draft.nombre.trim()) errores.nombre = "Escribe un nombre.";
  if (!draft.bajada.trim()) errores.bajada = "Escribe una bajada corta.";
  if (draft.estado === "programada" && !draft.fechaLanzamiento)
    errores.fechaLanzamiento = "Para programarla necesitas elegir el día.";
  const tieneErrores = Object.keys(errores).length > 0;

  async function guardar() {
    setIntentado(true);
    if (tieneErrores) return;
    const payload = {
      ...(initial ?? { orden: siguienteOrden, portadaUrl: null }),
      nombre: draft.nombre.trim(),
      bajada: draft.bajada.trim(),
      descripcionCorta: draft.descripcionCorta.trim() || null,
      tipo: draft.tipo,
      eje: draft.eje || null,
      tono: draft.tono,
      icono: draft.icono.trim() || null,
      estado: draft.estado,
      fechaLanzamiento: draft.fechaLanzamiento || null,
    };
    const res = initial
      ? await runSave(() => saveWithVerify<Coleccion>(`/api/colecciones/${initial.id}`, "PUT", payload))
      : await runSave(() => saveWithVerify<Coleccion>("/api/colecciones", "POST", payload));
    if (!res.ok) return;
    setSaved(draft);
    if (!initial) {
      router.push(`/admin/colecciones/${res.data.id}`);
    } else {
      router.refresh();
    }
  }

  const estadoPreview = estadoEfectivo(preview, hoy);
  const linea = lineaLanzamiento(preview, hoy);
  const err = (k: keyof Draft) =>
    intentado && errores[k] ? <span className="form-error">{errores[k]}</span> : null;

  return (
    <div className="col-form">
      <div className="col-form__fields">
        <section className="form-card">
          <h2 className="form-card__title">Lo básico</h2>
          <label className="form-field">
            <span className="form-field__label">Nombre</span>
            <input
              value={draft.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Bocaditos de reserva: Pescado"
            />
            <span className="form-field__hint">
              Si usas dos puntos, la portada separa la serie del título: «Bocaditos de reserva: <strong>Pescado</strong>».
            </span>
            {err("nombre")}
          </label>
          <label className="form-field">
            <span className="form-field__label">Bajada</span>
            <input
              value={draft.bajada}
              onChange={(e) => set("bajada", e.target.value)}
              placeholder="Cocina un día y aliméntalo todo un mes."
            />
            <span className="form-field__hint">Una frase que diga qué resuelve.</span>
            {err("bajada")}
          </label>
          <label className="form-field">
            <span className="form-field__label">Descripción (opcional)</span>
            <textarea
              rows={3}
              value={draft.descripcionCorta}
              onChange={(e) => set("descripcionCorta", e.target.value)}
              placeholder="Dos o tres líneas que cuenten qué trae la colección."
            />
          </label>
        </section>

        <section className="form-card">
          <h2 className="form-card__title">¿Qué tipo de colección es?</h2>
          <div className="choice-grid" role="radiogroup" aria-label="Tipo">
            {TIPOS.map((t) => (
              <label key={t.value} className="choice" data-checked={draft.tipo === t.value || undefined}>
                <input
                  type="radio"
                  name="tipo"
                  checked={draft.tipo === t.value}
                  onChange={() => set("tipo", t.value)}
                />
                <strong>{t.label}</strong>
                <span>{t.hint}</span>
              </label>
            ))}
          </div>
          <label className="form-field">
            <span className="form-field__label">Ingrediente principal</span>
            <select value={draft.eje} onChange={(e) => set("eje", e.target.value as ColeccionEje | "")}>
              {EJES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="form-card">
          <h2 className="form-card__title">Portada</h2>
          <div className="form-field">
            <span className="form-field__label">Color</span>
            <div className="swatches" role="radiogroup" aria-label="Color de la portada">
              {TONO_IDS.map((id) => {
                const p = TONOS[id];
                const activo = tonoDe(preview) === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    className="swatch"
                    onClick={() => set("tono", id)}
                    style={{ ["--sw-soft" as string]: p.soft, ["--sw-primary" as string]: p.primary, ["--sw-accent" as string]: p.accent } as CSSProperties}
                  >
                    <span className="swatch__dot" aria-hidden="true" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-field">
            <span className="form-field__label">Ícono</span>
            <div className="icon-picker" role="radiogroup" aria-label="Ícono de la portada">
              {ICONOS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  role="radio"
                  aria-checked={iconoDe(preview) === ic}
                  className="icon-picker__opt"
                  onClick={() => set("icono", ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card__title">Publicación</h2>
          <ol className="estado-steps" role="radiogroup" aria-label="Estado">
            {ESTADOS_ORDEN.map((e) => (
              <li key={e}>
                <label className="estado-step" data-checked={draft.estado === e || undefined}>
                  <input
                    type="radio"
                    name="estado"
                    checked={draft.estado === e}
                    onChange={() => set("estado", e)}
                  />
                  <strong>{ESTADO_ADMIN[e].label}</strong>
                  <span>{ESTADO_ADMIN[e].hint}</span>
                </label>
              </li>
            ))}
          </ol>
          <label className="form-field">
            <span className="form-field__label">
              Fecha de lanzamiento{draft.estado === "programada" ? "" : " (opcional)"}
            </span>
            <input
              type="date"
              value={draft.fechaLanzamiento}
              onChange={(e) => set("fechaLanzamiento", e.target.value)}
            />
            <span className="form-field__hint">
              {draft.estado === "programada"
                ? "Ese día, a las 00:00 de Chile, la colección se publica sola."
                : "Se muestra como «Llega el …» mientras está anunciada, y activa la etiqueta «Nuevo» por 30 días al publicarse."}
            </span>
            {err("fechaLanzamiento")}
          </label>
        </section>
      </div>

      <aside className="col-form__preview" style={tonoStyle(preview) as CSSProperties}>
        <p className="col-form__preview-label">Así se verá</p>
        <div className="col-form__preview-cover">
          <ColeccionPortada coleccion={preview} dato={dato} apagada={estadoPreview === "proximamente"} />
        </div>
        <p className="col-form__preview-title">{preview.nombre}</p>
        <p className="col-form__preview-bajada">{preview.bajada}</p>
        <p className="col-form__preview-state">
          {estadoPreview === "publicada"
            ? "Visible para todas las lectoras"
            : estadoPreview === "proximamente"
              ? linea ?? "Aparece como «Próximamente»"
              : "Solo tú la ves"}
        </p>

        <div className="col-form__save">
          <SaveStatusBanner status={status} onDismissError={clearError} />
          <button type="button" className="button button--primary" onClick={guardar} disabled={busy || (!dirty && !!initial)}>
            {busy ? "Guardando…" : initial ? (dirty ? "Guardar cambios" : "Sin cambios") : "Crear colección"}
          </button>
          {intentado && tieneErrores && <p className="form-error">Revisa los campos marcados.</p>}
        </div>
      </aside>
    </div>
  );
}
