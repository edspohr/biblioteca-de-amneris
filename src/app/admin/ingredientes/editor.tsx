"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { Ingrediente } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

interface Props {
  initial: Ingrediente[];
  usage: Record<string, { id: string; titulo: string }[]>;
}

const CATEGORIAS_SUGERIDAS = [
  "Proteínas",
  "Vegetales y Granos",
  "Carbohidratos",
  "Frutas",
  "Lácteos",
  "Hierbas y Especias",
  "Otros",
];

export function IngredientesEditor({ initial, usage }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nombre: string; categoria: string }>({
    nombre: "",
    categoria: "",
  });
  const [newDraft, setNewDraft] = useState<{ nombre: string; categoria: string }>({
    nombre: "",
    categoria: CATEGORIAS_SUGERIDAS[0],
  });
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  function startEdit(i: Ingrediente) {
    setEditing(i.id);
    setDraft({ nombre: i.nombre, categoria: i.categoria });
    clearError();
  }

  async function saveEdit(i: Ingrediente) {
    const res = await runSave(() =>
      saveWithVerify<Ingrediente>(`/api/ingredientes/${i.id}`, "PUT", {
        id: i.id,
        ...draft,
      })
    );
    if (!res.ok) return;
    setItems((cur) => cur.map((x) => (x.id === i.id ? res.data : x)));
    setEditing(null);
    router.refresh();
  }

  async function remove(i: Ingrediente) {
    const uses = usage[i.id] ?? [];
    let msg = `¿Eliminar el ingrediente "${i.nombre}"?`;
    if (uses.length > 0) {
      msg += `\n\nNo se podrá eliminar porque se usa en ${uses.length} receta(s):\n\n` +
        uses.slice(0, 15).map((u) => `- ${u.titulo}`).join("\n") +
        (uses.length > 15 ? `\n… y ${uses.length - 15} más` : "");
      alert(msg);
      return;
    }
    if (!confirm(msg)) return;
    const res = await runSave(() =>
      saveWithVerify<{ ok: true }>(`/api/ingredientes/${i.id}`, "DELETE")
    );
    if (!res.ok) return;
    setItems((cur) => cur.filter((x) => x.id !== i.id));
    router.refresh();
  }

  async function create() {
    if (!newDraft.nombre.trim()) return;
    const res = await runSave(() =>
      saveWithVerify<Ingrediente>("/api/ingredientes", "POST", newDraft)
    );
    if (!res.ok) return;
    setItems((cur) => [...cur, res.data]);
    setNewDraft({ nombre: "", categoria: CATEGORIAS_SUGERIDAS[0] });
    router.refresh();
  }

  const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      <h2>Crear nuevo</h2>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={newDraft.nombre}
          onChange={(e) => setNewDraft({ ...newDraft, nombre: e.target.value })}
          placeholder="Nombre"
          style={{ padding: "0.35rem 0.5rem", flex: 1, minWidth: 200 }}
        />
        <input
          type="text"
          value={newDraft.categoria}
          onChange={(e) => setNewDraft({ ...newDraft, categoria: e.target.value })}
          placeholder="Categoría"
          list="cat-list"
          style={{ padding: "0.35rem 0.5rem", minWidth: 180 }}
        />
        <datalist id="cat-list">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
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

      <h2>Todos los ingredientes ({sorted.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Usado en</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((i) => {
            const isEditing = editing === i.id;
            const uses = usage[i.id] ?? [];
            return (
              <tr key={i.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.nombre}
                      onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    i.nombre
                  )}
                  <div className="muted" style={{ fontSize: "0.75rem" }}>
                    <code>{i.id}</code>
                  </div>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.categoria}
                      onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
                      list="cat-list"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    i.categoria
                  )}
                </td>
                <td>
                  {uses.length === 0 ? (
                    <span className="muted">—</span>
                  ) : (
                    <span title={uses.map((u) => u.titulo).join(", ")}>
                      {uses.length} receta{uses.length === 1 ? "" : "s"}
                    </span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(i)} disabled={busy}>
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
                        onClick={() => startEdit(i)}
                        style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer" }}
                      >
                        Editar
                      </button>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        disabled={busy}
                        style={{ background: "transparent", border: "none", color: "#a83030", cursor: "pointer" }}
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
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
        Los ingredientes que se usan en recetas no pueden eliminarse. Primero quítalos de las recetas correspondientes.{" "}
        <Link href="/admin/recetas">Ir a recetas</Link>
      </p>
    </>
  );
}
