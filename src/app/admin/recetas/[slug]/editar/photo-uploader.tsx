"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  recetaId: string;
  currentFoto: string | null;
}

export function PhotoUploader({ recetaId, currentFoto }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFoto);

  async function handleFile(file: File) {
    setError(null);
    setStatus("uploading");
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch(`/api/recetas/${recetaId}/foto`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        foto?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la foto.");
      }
      setPreviewUrl(data.foto ?? null);
      setStatus("done");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message ?? "No se pudo subir la foto.");
      setStatus("idle");
    }
  }

  return (
    <section
      className="card"
      style={{ padding: "1rem", margin: "1.5rem 0" }}
    >
      <h2 style={{ marginTop: 0 }}>Foto de la receta</h2>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Foto actual de la receta"
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: 8,
            marginBottom: "0.75rem",
            display: "block",
          }}
        />
      ) : (
        <p style={{ color: "var(--color-ink-muted)" }}>
          Esta receta aún no tiene foto.
        </p>
      )}

      <label className="button button--ghost" style={{ cursor: "pointer" }}>
        {status === "uploading" ? "Subiendo…" : "Elegir imagen"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={status === "uploading"}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </label>

      {status === "done" && !error && (
        <p
          style={{
            color: "var(--color-success)",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Foto actualizada.
        </p>
      )}
      {error && (
        <p
          role="alert"
          style={{
            color: "var(--color-danger)",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </p>
      )}
      <p
        style={{
          color: "var(--color-ink-muted)",
          fontSize: "0.8rem",
          marginTop: "0.5rem",
        }}
      >
        Máximo 10 MB. Formatos: JPG, PNG o WebP. La imagen se redimensiona a
        1200 px de ancho.
      </p>
    </section>
  );
}
