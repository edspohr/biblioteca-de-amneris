"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Guia, Bloque } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { SaveStatusBanner } from "@/components/admin/save-status";

interface Props {
  initial: Guia;
}

function emptyBloque(kind: Bloque["kind"]): Bloque {
  switch (kind) {
    case "parrafo":
      return { kind: "parrafo", texto: "" };
    case "lista":
      return { kind: "lista", ordenada: false, items: [""] };
    case "tabla":
      return { kind: "tabla", columnas: ["Columna 1"], filas: [[""]] };
    case "aviso":
      return { kind: "aviso", tipo: "tip", texto: "" };
  }
}

export function GuiaForm({ initial }: Props) {
  const router = useRouter();
  const [state, _setState] = useState<Guia>(initial);
  const [dirty, setDirty] = useState(false);
  const setState: typeof _setState = (u) => {
    setDirty(true);
    _setState(u);
  };
  const { status, runSave, clearError } = useSaveState();
  const saving = status.kind === "saving";
  useUnsavedChanges(dirty && !saving);

  function updateBloque(idx: number, next: Bloque) {
    setState((s) => ({ ...s, bloques: s.bloques.map((b, i) => (i === idx ? next : b)) }));
  }
  function removeBloque(idx: number) {
    if (!confirm("¿Eliminar este bloque?")) return;
    setState((s) => ({ ...s, bloques: s.bloques.filter((_, i) => i !== idx) }));
  }
  function moveBloque(idx: number, delta: -1 | 1) {
    setState((s) => {
      const arr = [...s.bloques];
      const j = idx + delta;
      if (j < 0 || j >= arr.length) return s;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...s, bloques: arr };
    });
  }
  function addBloque(kind: Bloque["kind"]) {
    setState((s) => ({ ...s, bloques: [...s.bloques, emptyBloque(kind)] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const res = await runSave(() =>
      saveWithVerify<Guia>(`/api/guias/${state.id}`, "PUT", state)
    );
    if (!res.ok) return;
    setDirty(false);
    setTimeout(() => {
      router.push("/admin/guias");
      router.refresh();
    }, 800);
  }

  return (
    <form onSubmit={onSubmit}>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Título</div>
          <input
            type="text"
            value={state.titulo}
            onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Código (opcional)</div>
          <input
            type="text"
            value={state.codigo ?? ""}
            onChange={(e) => setState((s) => ({ ...s, codigo: e.target.value || null }))}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Subtítulo (opcional)</div>
          <input
            type="text"
            value={state.subtitulo ?? ""}
            onChange={(e) => setState((s) => ({ ...s, subtitulo: e.target.value || null }))}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Orden</div>
          <input
            type="number"
            value={state.orden}
            onChange={(e) => setState((s) => ({ ...s, orden: parseInt(e.target.value || "0", 10) }))}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Colección</div>
          <code>{state.coleccionId}</code>
        </div>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Bloques ({state.bloques.length})</h2>
      <ol style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
        {state.bloques.map((b, idx) => (
          <li
            key={idx}
            style={{
              border: "1px solid var(--border, #e0d5c8)",
              borderRadius: 6,
              padding: "0.6rem 0.8rem",
              background: "var(--panel, white)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <strong style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--muted)" }}>
                {idx + 1}. {b.kind}
              </strong>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button type="button" onClick={() => moveBloque(idx, -1)} disabled={idx === 0}>↑</button>
                <button type="button" onClick={() => moveBloque(idx, 1)} disabled={idx === state.bloques.length - 1}>↓</button>
                <button type="button" onClick={() => removeBloque(idx)} style={{ color: "#a83030" }}>
                  Quitar
                </button>
              </div>
            </div>
            <BloqueEditor bloque={b} onChange={(next) => updateBloque(idx, next)} />
          </li>
        ))}
      </ol>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => addBloque("parrafo")}>+ Párrafo</button>
        <button type="button" onClick={() => addBloque("lista")}>+ Lista</button>
        <button type="button" onClick={() => addBloque("tabla")}>+ Tabla</button>
        <button type="button" onClick={() => addBloque("aviso")}>+ Aviso</button>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "var(--accent, #7a3e3e)",
            color: "white",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {saving ? "Guardando…" : "Guardar guía"}
        </button>
      </div>
    </form>
  );
}

function BloqueEditor({ bloque, onChange }: { bloque: Bloque; onChange: (b: Bloque) => void }) {
  switch (bloque.kind) {
    case "parrafo":
      return (
        <textarea
          value={bloque.texto}
          onChange={(e) => onChange({ ...bloque, texto: e.target.value })}
          rows={3}
          style={{ width: "100%" }}
        />
      );
    case "lista":
      return (
        <div>
          <label style={{ display: "block", marginBottom: "0.4rem" }}>
            <input
              type="checkbox"
              checked={bloque.ordenada}
              onChange={(e) => onChange({ ...bloque, ordenada: e.target.checked })}
            />{" "}
            Lista ordenada (numerada)
          </label>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {bloque.items.map((it, i) => (
              <li key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.3rem" }}>
                <input
                  type="text"
                  value={it}
                  onChange={(e) => {
                    const items = [...bloque.items];
                    items[i] = e.target.value;
                    onChange({ ...bloque, items });
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = bloque.items.filter((_, j) => j !== i);
                    onChange({ ...bloque, items: items.length === 0 ? [""] : items });
                  }}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onChange({ ...bloque, items: [...bloque.items, ""] })}
          >
            + Item
          </button>
        </div>
      );
    case "tabla":
      return (
        <TablaEditor bloque={bloque} onChange={onChange} />
      );
    case "aviso":
      return (
        <div>
          <label style={{ display: "block", marginBottom: "0.4rem" }}>
            Tipo:{" "}
            <select
              value={bloque.tipo}
              onChange={(e) => onChange({ ...bloque, tipo: e.target.value as "tip" | "advertencia" })}
            >
              <option value="tip">Tip (💡)</option>
              <option value="advertencia">Advertencia (⚠️)</option>
            </select>
          </label>
          <textarea
            value={bloque.texto}
            onChange={(e) => onChange({ ...bloque, texto: e.target.value })}
            rows={2}
            style={{ width: "100%" }}
          />
        </div>
      );
  }
}

function TablaEditor({
  bloque,
  onChange,
}: {
  bloque: Extract<Bloque, { kind: "tabla" }>;
  onChange: (b: Bloque) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            {bloque.columnas.map((c, i) => (
              <th key={i}>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const columnas = [...bloque.columnas];
                    columnas[i] = e.target.value;
                    onChange({ ...bloque, columnas });
                  }}
                />
              </th>
            ))}
            <th>
              <button
                type="button"
                onClick={() => {
                  const columnas = [...bloque.columnas, `Col ${bloque.columnas.length + 1}`];
                  const filas = bloque.filas.map((r) => [...r, ""]);
                  onChange({ ...bloque, columnas, filas });
                }}
              >
                + col
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {bloque.filas.map((fila, r) => (
            <tr key={r}>
              {fila.map((cell, c) => (
                <td key={c}>
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => {
                      const filas = bloque.filas.map((row, ri) =>
                        ri === r ? row.map((v, ci) => (ci === c ? e.target.value : v)) : row
                      );
                      onChange({ ...bloque, filas });
                    }}
                  />
                </td>
              ))}
              <td>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...bloque, filas: bloque.filas.filter((_, i) => i !== r) })
                  }
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
        onClick={() =>
          onChange({
            ...bloque,
            filas: [...bloque.filas, bloque.columnas.map(() => "")],
          })
        }
        style={{ marginTop: "0.4rem" }}
      >
        + Fila
      </button>
    </div>
  );
}
