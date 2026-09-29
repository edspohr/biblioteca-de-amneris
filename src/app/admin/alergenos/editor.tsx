"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Alergeno } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

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
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  async function saveEdit(a: Alergeno) {
    const res = await runSave(() =>
      saveWithVerify<Alergeno>(`/api/alergenos/${a.id}`, "PUT", {
        id: a.id,
        nombre: draftNombre,
      })
    );
    if (!res.ok) return;
    setItems((c) => c.map((x) => (x.id === a.id ? res.data : x)));
    setEditing(null);
    router.refresh();
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
    const res = await runSave(() =>
      saveWithVerify<{ ok: true }>(`/api/alergenos/${a.id}`, "DELETE")
    );
    if (!res.ok) return;
    setItems((c) => c.filter((x) => x.id !== a.id));
    router.refresh();
  }

  async function create() {
    if (!newNombre.trim()) return;
    const res = await runSave(() =>
      saveWithVerify<Alergeno>("/api/alergenos", "POST", {
        nombre: newNombre.trim(),
      })
    );
    if (!res.ok) return;
    setItems((c) => [...c, res.data]);
    setNewNombre("");
    router.refresh();
  }

  const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />

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
