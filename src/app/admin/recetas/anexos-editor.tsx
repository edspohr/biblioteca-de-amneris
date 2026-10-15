"use client";

import { useState } from "react";
import type { Anexo, TipoAnexo } from "@/lib/schema";

interface Props {
  // null while creating: files can only be uploaded once the recipe exists.
  recetaId: string | null;
  anexos: Anexo[];
  onChange: (next: Anexo[]) => void;
  errors: Record<string, string>;
}

const ETIQUETA: Record<TipoAnexo, string> = {
  texto: "Texto",
  imagen: "Imagen",
  documento: "Documento",
  enlace: "Enlace",
};

const ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
].join(",");

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function AnexosEditor({ recetaId, anexos, onChange, errors }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Anexo>) {
    onChange(anexos.map((a, i) => (i === idx ? ({ ...a, ...patch } as Anexo) : a)));
  }
  function move(idx: number, delta: -1 | 1) {
    const j = idx + delta;
    if (j < 0 || j >= anexos.length) return;
    const arr = [...anexos];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange(arr);
  }
  function agregar(tipo: "texto" | "enlace") {
    onChange([...anexos, { id: nuevoId(), tipo, titulo: "", texto: tipo === "texto" ? "" : null, url: null }]);
  }

  async function subir(files: FileList) {
    if (!recetaId) return;
    setError(null);
    setSubiendo(true);
    const nuevos: Anexo[] = [];
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const res = await fetch(`/api/recetas/${recetaId}/anexos`, { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(`${file.name}: ${data.error || "no se pudo subir."}`);
        nuevos.push({
          id: nuevoId(),
          tipo: data.tipo,
          titulo: file.name.replace(/\.[^.]+$/, ""),
          texto: null,
          url: data.url,
          storagePath: data.storagePath,
          nombreArchivo: data.nombreArchivo,
          mimeType: data.mimeType,
          bytes: data.bytes,
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (nuevos.length) onChange([...anexos, ...nuevos]);
      setSubiendo(false);
    }
  }

  return (
    <div className="anexos-editor">
      <p className="muted" style={{ marginTop: 0 }}>
        Material complementario que la lectora ve plegado al final de la receta: notas, fotos de apoyo,
        documentos o enlaces (por ejemplo, un video).
      </p>

      {anexos.length > 0 && (
        <ol className="anexos-editor__list">
          {anexos.map((a, idx) => (
            <li key={a.id} className="anexos-editor__item">
              <div className="anexos-editor__head">
                <span className="chip">{ETIQUETA[a.tipo]}</span>
                <input
                  type="text"
                  value={a.titulo}
                  placeholder="Título (ej. Cómo cortar el pollo en cubos)"
                  aria-label={`Anexo ${idx + 1}: título`}
                  onChange={(e) => update(idx, { titulo: e.target.value })}
                />
                <div className="paso-editor__actions">
                  <button type="button" className="text-button" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Subir">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={idx === anexos.length - 1}
                    onClick={() => move(idx, 1)}
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                  <button type="button" className="link-button" onClick={() => onChange(anexos.filter((_, i) => i !== idx))}>
                    Quitar
                  </button>
                </div>
              </div>

              {a.tipo === "texto" && (
                <textarea
                  value={a.texto ?? ""}
                  rows={4}
                  placeholder="Escribe aquí la información adicional"
                  aria-label={`Anexo ${idx + 1}: texto`}
                  onChange={(e) => update(idx, { texto: e.target.value })}
                />
              )}
              {a.tipo === "enlace" && (
                <input
                  type="url"
                  value={a.url ?? ""}
                  placeholder="https://…"
                  aria-label={`Anexo ${idx + 1}: enlace`}
                  onChange={(e) => update(idx, { url: e.target.value.trim() || null })}
                />
              )}
              {a.tipo === "imagen" && a.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="anexos-editor__thumb" />
              )}
              {a.tipo === "documento" && a.url && (
                <a href={a.url} target="_blank" rel="noreferrer">
                  📄 {a.nombreArchivo}
                  {a.bytes ? ` · ${formatBytes(a.bytes)}` : ""}
                </a>
              )}
              {a.tipo === "imagen" && (
                <input
                  type="text"
                  value={a.texto ?? ""}
                  placeholder="Descripción (opcional)"
                  aria-label={`Anexo ${idx + 1}: descripción`}
                  onChange={(e) => update(idx, { texto: e.target.value || null })}
                />
              )}
              {errors[`anexos.${idx}`] && <span className="form-error">{errors[`anexos.${idx}`]}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="form-actions-inline">
        <button type="button" className="button button--ghost" onClick={() => agregar("texto")}>
          + Texto
        </button>
        <button type="button" className="button button--ghost" onClick={() => agregar("enlace")}>
          + Enlace
        </button>
        {recetaId ? (
          <label className="button button--ghost" style={{ cursor: subiendo ? "progress" : "pointer" }}>
            {subiendo ? "Subiendo…" : "+ Foto o documento"}
            <input
              type="file"
              multiple
              accept={ACCEPT}
              disabled={subiendo}
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.length) void subir(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <span className="muted">Crea la receta para poder adjuntar fotos y documentos.</span>
        )}
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Máximo 10 MB por archivo. Imágenes JPG, PNG o WebP; documentos PDF, Word, Excel, PowerPoint, TXT o CSV. Los
        archivos quedan adjuntos al pulsar «Guardar cambios».
      </p>
    </div>
  );
}
