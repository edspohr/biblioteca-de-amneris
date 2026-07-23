"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Alergeno } from "@/lib/schema";

interface Props {
  initial: Alergeno[];
  usage: Record<string, { id: string; titulo: string }[]>;
}

export function AlergenosEditor({ initial, usage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftNombre, setDraftNombre] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveEdit(a: Alergeno) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/alergenos/${a.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: a.id, nombre: draftNombre }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo guardar");
        return;
      }
      const updated = await res.json();
      setItems((c) => c.map((x) => (x.id === a.id ? updated : x)));
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Alergeno) {
    const uses = usage[a.id] ?? [];
    if (uses.length > 0) {
      alert(
        `No se puede eliminar "${a.nombre}" porque está asignado a ${uses.length} receta(s):\n\n` +
          uses.slice(0, 15).map((u) => `- ${u.titulo}`).join("\n") +
          (uses.length > 15 ? `\n… y ${uses.length - 15} más` : "")
      );
      return;
    }
    if (!confirm(`¿Eliminar el alérgeno "${a.nombre}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/alergenos/${a.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo eliminar");
        return;
      }
      setItems((c) => c.filter((x) => x.id !== a.id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!newNombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/alergenos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nombre: newNombre.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo crear");
        return;
      }
      const created = await res.json();
      setItems((c) => [...c, created]);
      setNewNombre("");
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

      <h2>Crear nuevo</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          placeholder="Nombre del alérgeno"
          style={{ padding: "0.35rem 0.5rem", flex: 1, maxWidth: 300 }}
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

      <h2>Todos los alérgenos ({sorted.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Recetas que lo declaran</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => {
            const isEditing = editing === a.id;
            const uses = usage[a.id] ?? [];
            return (
              <tr key={a.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftNombre}
                      onChange={(e) => setDraftNombre(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    a.nombre
                  )}
                  <div className="muted" style={{ fontSize: "0.75rem" }}>
                    <code>{a.id}</code>
                  </div>
                </td>
                <td>{uses.length === 0 ? <span className="muted">—</span> : uses.length}</td>
                <td>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(a)} disabled={busy}>
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
                          setEditing(a.id);
                          setDraftNombre(a.nombre);
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
                        onClick={() => remove(a)}
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
