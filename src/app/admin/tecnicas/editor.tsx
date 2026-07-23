"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tecnica } from "@/lib/schema";

interface Props {
  initial: Tecnica[];
  usage: Record<string, { id: string; titulo: string }[]>;
}

export function TecnicasEditor({ initial, usage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nombre: string; descripcion: string }>({
    nombre: "",
    descripcion: "",
  });
  const [newDraft, setNewDraft] = useState({ nombre: "", descripcion: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveEdit(t: Tecnica) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tecnicas/${t.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          nombre: draft.nombre,
          descripcion: draft.descripcion || null,
          seccion_origen: t.seccion_origen,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo guardar");
        return;
      }
      const updated = await res.json();
      setItems((c) => c.map((x) => (x.id === t.id ? updated : x)));
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: Tecnica) {
    const uses = usage[t.id] ?? [];
    if (uses.length > 0) {
      alert(
        `No se puede eliminar "${t.nombre}" porque se usa en ${uses.length} receta(s):\n\n` +
          uses.slice(0, 15).map((u) => `- ${u.titulo}`).join("\n") +
          (uses.length > 15 ? `\n… y ${uses.length - 15} más` : "")
      );
      return;
    }
    if (!confirm(`¿Eliminar la técnica "${t.nombre}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tecnicas/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo eliminar");
        return;
      }
      setItems((c) => c.filter((x) => x.id !== t.id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!newDraft.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tecnicas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre: newDraft.nombre.trim(),
          descripcion: newDraft.descripcion.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo crear");
        return;
      }
      const created = await res.json();
      setItems((c) => [...c, created]);
      setNewDraft({ nombre: "", descripcion: "" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <>
      {error && (
        <div
          style={{
            background: "#fdecea",
            border: "1px solid #a83030",
            padding: "0.5rem 0.75rem",
            borderRadius: 4,
            marginBottom: "1rem",
            color: "#a83030",
          }}
        >
          {error}
        </div>
      )}

      <h2>Crear nueva</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={newDraft.nombre}
          onChange={(e) => setNewDraft({ ...newDraft, nombre: e.target.value })}
          placeholder="Nombre"
          style={{ padding: "0.35rem 0.5rem", minWidth: 180 }}
        />
        <input
          type="text"
          value={newDraft.descripcion}
          onChange={(e) => setNewDraft({ ...newDraft, descripcion: e.target.value })}
          placeholder="Descripción (opcional)"
          style={{ padding: "0.35rem 0.5rem", flex: 1, minWidth: 250 }}
        />
        <button
          type="button"
          onClick={create}
          disabled={busy}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            padding: "0.35rem 1rem",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Crear
        </button>
      </div>

      <h2>Todas las técnicas ({sorted.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Usado en</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const isEditing = editing === t.id;
            const uses = usage[t.id] ?? [];
            return (
              <tr key={t.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.nombre}
                      onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    t.nombre
                  )}
                  <div className="muted" style={{ fontSize: "0.75rem" }}>
                    <code>{t.id}</code>
                  </div>
                </td>
                <td>
                  {isEditing ? (
                    <textarea
                      value={draft.descripcion}
                      onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                      rows={2}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    t.descripcion || <span className="muted">— sin descripción —</span>
                  )}
                </td>
                <td>{uses.length === 0 ? <span className="muted">—</span> : uses.length}</td>
                <td>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(t)} disabled={busy}>
                        Guardar
                      </button>{" "}
                      <button type="button" onClick={() => setEditing(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(t.id);
                          setDraft({ nombre: t.nombre, descripcion: t.descripcion ?? "" });
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent)",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>{" "}·{" "}
                      <button
                        type="button"
                        onClick={() => remove(t)}
                        disabled={busy}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#a83030",
                          cursor: "pointer",
                        }}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
