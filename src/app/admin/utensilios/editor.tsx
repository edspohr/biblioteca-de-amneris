"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Utensilio, UtensilioTipo } from "@/lib/schema";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { SaveStatusBanner } from "@/components/admin/save-status";

interface Props {
  initial: Utensilio[];
}

const TIPOS: { value: UtensilioTipo; label: string }[] = [
  { value: "envase", label: "Envase" },
  { value: "herramienta", label: "Herramienta" },
  { value: "electrodomestico", label: "Electrodoméstico" },
  { value: "consumible", label: "Consumible" },
];

type Draft = {
  nombre: string;
  tipo: UtensilioTipo;
  paraQue: string;
  aptoCongelador: boolean;
  capacidad: string;
};

const EMPTY_DRAFT: Draft = {
  nombre: "",
  tipo: "envase",
  paraQue: "",
  aptoCongelador: false,
  capacidad: "",
};

export function UtensiliosEditor({ initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const { status, runSave, clearError } = useSaveState();
  const busy = status.kind === "saving";

  function toDraft(u: Utensilio): Draft {
    return {
      nombre: u.nombre,
      tipo: u.tipo,
      paraQue: u.paraQue,
      aptoCongelador: u.aptoCongelador,
      capacidad: u.capacidad ?? "",
    };
  }

  function toPayload(id: string, d: Draft) {
    return {
      id,
      nombre: d.nombre,
      tipo: d.tipo,
      paraQue: d.paraQue,
      aptoCongelador: d.aptoCongelador,
      capacidad: d.capacidad || null,
    };
  }

  async function saveEdit(u: Utensilio) {
    const res = await runSave(() =>
      saveWithVerify<Utensilio>(`/api/utensilios/${u.id}`, "PUT", toPayload(u.id, draft))
    );
    if (!res.ok) return;
    setItems((c) => c.map((x) => (x.id === u.id ? res.data : x)));
    setEditing(null);
    router.refresh();
  }

  async function remove(u: Utensilio) {
    if (!confirm(`¿Eliminar el utensilio "${u.nombre}"?`)) return;
    const res = await runSave(() =>
      saveWithVerify<{ ok: true }>(`/api/utensilios/${u.id}`, "DELETE")
    );
    if (!res.ok) return;
    setItems((c) => c.filter((x) => x.id !== u.id));
    router.refresh();
  }

  async function create() {
    if (!newDraft.nombre.trim() || !newDraft.paraQue.trim()) return;
    const res = await runSave(() =>
      saveWithVerify<Utensilio>("/api/utensilios", "POST", {
        nombre: newDraft.nombre.trim(),
        tipo: newDraft.tipo,
        paraQue: newDraft.paraQue.trim(),
        aptoCongelador: newDraft.aptoCongelador,
        capacidad: newDraft.capacidad.trim() || null,
      })
    );
    if (!res.ok) return;
    setItems((c) => [...c, res.data]);
    setNewDraft(EMPTY_DRAFT);
    router.refresh();
  }

  const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      <h2>Crear nuevo</h2>
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          gridTemplateColumns: "1fr 1fr",
          marginBottom: "1.5rem",
        }}
      >
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Nombre</div>
          <input
            type="text"
            value={newDraft.nombre}
            onChange={(e) => setNewDraft({ ...newDraft, nombre: e.target.value })}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Tipo</div>
          <select
            value={newDraft.tipo}
            onChange={(e) => setNewDraft({ ...newDraft, tipo: e.target.value as UtensilioTipo })}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Para qué sirve</div>
          <input
            type="text"
            value={newDraft.paraQue}
            onChange={(e) => setNewDraft({ ...newDraft, paraQue: e.target.value })}
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Capacidad (opcional)</div>
          <input
            type="text"
            value={newDraft.capacidad}
            onChange={(e) => setNewDraft({ ...newDraft, capacidad: e.target.value })}
            placeholder="p.ej. 150 ml"
            style={{ width: "100%", padding: "0.35rem 0.5rem" }}
          />
        </label>
        <label style={{ alignSelf: "end" }}>
          <input
            type="checkbox"
            checked={newDraft.aptoCongelador}
            onChange={(e) => setNewDraft({ ...newDraft, aptoCongelador: e.target.checked })}
          />
          {" "}Apto congelador
        </label>
        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            style={{
              background: "var(--accent, #7a3e3e)",
              color: "white",
              border: "none",
              padding: "0.4rem 1rem",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Crear
          </button>
        </div>
      </div>

      <h2>Todos los utensilios ({sorted.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Para qué</th>
            <th>Capacidad</th>
            <th>Congelador</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => {
            const isEditing = editing === u.id;
            return (
              <tr key={u.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.nombre}
                      onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <>
                      {u.nombre}
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        <code>{u.id}</code>
                      </div>
                    </>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      value={draft.tipo}
                      onChange={(e) => setDraft({ ...draft, tipo: e.target.value as UtensilioTipo })}
                    >
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  ) : (
                    u.tipo
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.paraQue}
                      onChange={(e) => setDraft({ ...draft, paraQue: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    u.paraQue
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.capacidad}
                      onChange={(e) => setDraft({ ...draft, capacidad: e.target.value })}
                      style={{ width: 90 }}
                    />
                  ) : (
                    u.capacidad ?? <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={draft.aptoCongelador}
                      onChange={(e) => setDraft({ ...draft, aptoCongelador: e.target.checked })}
                    />
                  ) : u.aptoCongelador ? "sí" : "no"}
                </td>
                <td>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEdit(u)} disabled={busy}>
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
                          setEditing(u.id);
                          setDraft(toDraft(u));
                        }}
                        style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer" }}
                      >
                        Editar
                      </button>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => remove(u)}
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
    </>
  );
}
