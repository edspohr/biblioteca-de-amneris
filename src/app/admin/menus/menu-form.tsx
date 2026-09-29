"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Etapa,
  Ingrediente,
  Menu,
  MenuReceta,
  Receta,
  TipoComida,
} from "@/lib/schema";
import { computeListaCompras } from "@/lib/derived/lista-compras";
import { saveWithVerify } from "@/lib/admin/save-with-verify";
import { useSaveState } from "@/lib/admin/use-save-state";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";
import { SaveStatusBanner } from "@/components/admin/save-status";
import { DIAS_LARGOS, diaCorto, normalizarDia } from "@/lib/dias";
import type { Coleccion, MenuCelda } from "@/lib/schema";

const DIAS = DIAS_LARGOS;

const MOMENTOS: { id: TipoComida; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "merienda", label: "Merienda" },
  { id: "cena", label: "Cena" },
  { id: "colacion", label: "Colación" },
];

interface Props {
  mode: "create" | "edit";
  initial?: Menu;
  etapas: Etapa[];
  recetas: Receta[];
  ingredientes: Ingrediente[];
  colecciones: Coleccion[];
}

type SlotKey = `${(typeof DIAS)[number]}::${TipoComida}`;
function slotKey(dia: string, momento: TipoComida): SlotKey {
  return `${dia}::${momento}` as SlotKey;
}

export function MenuForm({ mode, initial, etapas, recetas, ingredientes, colecciones }: Props) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [etapaId, setEtapaId] = useState(initial?.etapa_id ?? etapas[0]?.id ?? "");
  // Menus without planId belong to the original recetario (see
  // coleccionDeMenu); only plan collections are stored explicitly.
  const planes = colecciones.filter((c) => c.tipo === "plan").sort((a, b) => a.orden - b.orden);
  const [planId, setPlanId] = useState(initial?.planId ?? "");
  const [semana, setSemana] = useState<string>(initial?.semana != null ? String(initial.semana) : "");
  const [slots, setSlots] = useState<Record<SlotKey, string>>(() => {
    const out: Record<string, string> = {};
    for (const mr of initial?.menu_recetas ?? []) {
      const dia = normalizarDia(mr.dia);
      if (dia) out[slotKey(dia, mr.momento)] = mr.receta_id;
    }
    return out;
  });
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status, runSave, clearError } = useSaveState();
  const saving = status.kind === "saving";
  useUnsavedChanges(dirty && !saving);

  // Recipes visible in each cell picker: filter to the etapa is optional (all
  // recipes serve all etapas per the invariant), so we just show everything
  // sorted by title with a search-friendly select.
  const recetasSorted = useMemo(
    () => [...recetas].sort((a, b) => a.titulo.localeCompare(b.titulo)),
    [recetas]
  );

  const menuRecetas: MenuReceta[] = useMemo(() => {
    const out: MenuReceta[] = [];
    for (const dia of DIAS) {
      for (const m of MOMENTOS) {
        const rid = slots[slotKey(dia, m.id)];
        if (rid) out.push({ dia, momento: m.id, receta_id: rid });
      }
    }
    return out;
  }, [slots]);

  const shoppingList = useMemo(() => {
    if (menuRecetas.length === 0 || !etapaId) return null;
    const virtualMenu: Menu = {
      id: initial?.id ?? "preview",
      etapa_id: etapaId,
      nombre: nombre || "Vista previa",
      dia: null,
      menu_recetas: menuRecetas,
    };
    return computeListaCompras(virtualMenu, recetas, ingredientes);
  }, [menuRecetas, etapaId, nombre, initial?.id, recetas, ingredientes]);

  function setSlot(dia: string, momento: TipoComida, recetaId: string) {
    setDirty(true);
    setSlots((prev) => {
      const next = { ...prev };
      const k = slotKey(dia, momento);
      if (!recetaId) delete next[k];
      else next[k] = recetaId;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    clearError();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!etapaId) {
      setError("Debes elegir una etapa.");
      return;
    }
    const semanaNum = semana ? parseInt(semana, 10) : undefined;
    // Plan menus keep their 7×3 grid (`celdas`) in sync with the slots.
    const celdas: MenuCelda[] | undefined =
      planId || initial?.celdas
        ? menuRecetas
            .filter((mr) => mr.dia)
            .map((mr) => ({ dia: diaCorto(mr.dia as (typeof DIAS)[number]), tipoComida: mr.momento, recetaId: mr.receta_id }))
        : undefined;
    // Start from the stored doc so fields this form doesn't edit (codigo,
    // listaCompras, tip, advertencia…) survive the save.
    const { planId: _p, semana: _s, celdas: _c, ...resto } = initial ?? ({} as Partial<Menu>);
    void _p;
    void _s;
    void _c;
    const body = {
      ...resto,
      nombre: nombre.trim(),
      etapa_id: etapaId,
      dia: null,
      menu_recetas: menuRecetas,
      ...(planId ? { planId } : {}),
      ...(semanaNum ? { semana: semanaNum } : {}),
      ...(celdas ? { celdas } : {}),
    };
    const url = mode === "create" ? "/api/menus" : `/api/menus/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const payload = mode === "create" ? body : { ...body, id: initial!.id };
    const res = await runSave(() =>
      saveWithVerify<{ id: string }>(url, method, payload)
    );
    if (!res.ok) return;
    setDirty(false);
    setTimeout(() => {
      router.push("/admin/menus");
      router.refresh();
    }, 800);
  }

  return (
    <form onSubmit={handleSubmit}>
      <SaveStatusBanner status={status} onDismissError={clearError} />

      <label className="field">
        <span>Nombre del menú</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => {
            setDirty(true);
            setNombre(e.target.value);
          }}
          placeholder="p.ej. Semana 1 · Etapa 2"
          required
        />
      </label>

      <label className="field">
        <span>Etapa</span>
        <select
          value={etapaId}
          onChange={(e) => {
            setDirty(true);
            setEtapaId(e.target.value);
          }}
          required
        >
          {etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Colección</span>
          <select
            value={planId}
            onChange={(e) => {
              setDirty(true);
              setPlanId(e.target.value);
            }}
          >
            <option value="">Recetario (menús semanales)</option>
            {planes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Semana (1 a 4)</span>
          <input
            type="number"
            min={1}
            max={4}
            value={semana}
            onChange={(e) => {
              setDirty(true);
              setSemana(e.target.value);
            }}
            placeholder="opcional"
          />
        </label>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Recetas por día y momento</h2>
      <p className="muted">
        Elige una receta para cada momento del día. Deja vacío lo que no
        aplique.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Día</th>
              {MOMENTOS.map((m) => (
                <th key={m.id}>{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIAS.map((dia) => (
              <tr key={dia}>
                <th scope="row">{dia}</th>
                {MOMENTOS.map((m) => (
                  <td key={m.id}>
                    <select
                      value={slots[slotKey(dia, m.id)] ?? ""}
                      onChange={(e) => setSlot(dia, m.id, e.target.value)}
                      style={{ maxWidth: 240 }}
                    >
                      <option value="">—</option>
                      {recetasSorted.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.titulo}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--color-danger)", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
        <button
          type="submit"
          className="button button--primary"
          disabled={saving}
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear menú" : "Guardar cambios"}
        </button>
      </div>

      {shoppingList && Object.keys(shoppingList.por_categoria).length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Vista previa de la lista de compras</h2>
          <p className="muted">
            Se calcula en tiempo real a partir de las recetas del menú.
          </p>
          {Object.entries(shoppingList.por_categoria)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([categoria, items]) => (
              <div key={categoria} style={{ marginBottom: "1.25rem" }}>
                <h3 style={{ marginBottom: "0.5rem" }}>{categoria}</h3>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  {items.map((it) => (
                    <li key={it.ingrediente.id}>
                      <strong>{it.ingrediente.nombre}</strong>
                      {it.total_numerico.length > 0 && (
                        <>
                          {" — "}
                          {it.total_numerico
                            .map((t) => `${t.cantidad} ${t.unidad}`)
                            .join(", ")}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
    </form>
  );
}
