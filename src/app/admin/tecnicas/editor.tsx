"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tecnica } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

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
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  async function saveEdit(t: Tecnica) {
    const res = await runSave(() =>
      saveWithVerify<Tecnica>(`/api/tecnicas/${t.id}`, "PUT", {
        id: t.id,
        nombre: draft.nombre,
        descripcion: draft.descripcion || null,
        seccion_origen: t.seccion_origen,
      })
    );
    if (!res.ok) return;
    setItems((c) => c.map((x) => (x.id === t.id ? res.data : x)));
    setEditing(null);
    router.refresh();
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
    const res = await runSave(() =>
      saveWithVerify<{ ok: true }>(`/api/tecnicas/${t.id}`, "DELETE")
    );
    if (!res.ok) return;
    setItems((c) => c.filter((x) => x.id !== t.id));
    router.refresh();
  }

  async function create() {
    if (!newDraft.nombre.trim()) return;
    const res = await runSave(() =>
      saveWithVerify<Tecnica>("/api/tecnicas", "POST", {
        nombre: newDraft.nombre.trim(),
        descripcion: newDraft.descripcion.trim() || null,
      })
    );
    if (!res.ok) return;
    setItems((c) => [...c, res.data]);
    setNewDraft({ nombre: "", descripcion: "" });
    router.refresh();
  }

  const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />

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
