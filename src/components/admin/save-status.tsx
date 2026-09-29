"use client";

import type { SaveStatus } from "@/lib/admin/use-save-state";

interface Props {
  status: SaveStatus;
  onDismissError?: () => void;
  onRetry?: () => void;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// Persistent error banner + success toast. Rendered near the submit button in
// every admin form. The error state does NOT auto-dismiss — the author has to
// see it and either fix or retry.
export function SaveStatusBanner({ status, onDismissError, onRetry }: Props) {
  if (status.kind === "error") {
    return (
      <div
        role="alert"
        style={{
          background: "#fdecea",
          border: "1px solid #a83030",
          padding: "0.75rem 0.9rem",
          borderRadius: 4,
          margin: "0.75rem 0",
          color: "#7a1f1f",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          No se pudo guardar
        </div>
        <div style={{ fontSize: "0.9rem" }}>{status.message}</div>
        {status.details && status.details.length > 0 && (
          <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
            {status.details.map((d, i) => (
              <li key={i}>
                <code>{d.field || "(sin campo)"}</code>: {d.message}
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8, display: "flex", gap: "0.5rem" }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: "#a83030",
                color: "white",
                border: "none",
                padding: "0.3rem 0.7rem",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Reintentar
            </button>
          )}
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              style={{
                background: "transparent",
                color: "#7a1f1f",
                border: "1px solid #a83030",
                padding: "0.3rem 0.7rem",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status.kind === "saved") {
    const h = pad(status.at.getHours());
    const m = pad(status.at.getMinutes());
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          background: "#eaf7ef",
          border: "1px solid #7FBFA0",
          padding: "0.5rem 0.8rem",
          borderRadius: 4,
          margin: "0.75rem 0",
          color: "#2F5D46",
          fontSize: "0.9rem",
        }}
      >
        Guardado a las {h}:{m}.
      </div>
    );
  }

  if (status.kind === "saving") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "0.4rem 0.8rem",
          margin: "0.75rem 0",
          fontSize: "0.9rem",
          color: "var(--muted, #666)",
        }}
      >
        Guardando…
      </div>
    );
  }

  return null;
}
