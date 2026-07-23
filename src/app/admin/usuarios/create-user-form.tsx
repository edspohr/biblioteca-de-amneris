"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteLink(null);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        displayName: displayName.trim() || null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      inviteLink?: string;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo crear la cuenta.");
      return;
    }
    setInviteLink(data.inviteLink ?? null);
    setEmail("");
    setDisplayName("");
    router.refresh();
  }

  return (
    <details className="card" style={{ padding: "0.75rem 1rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Crear cuenta manualmente
      </summary>
      <p className="muted" style={{ marginTop: "0.75rem" }}>
        Genera una cuenta y un enlace de invitación para que la persona
        elija su contraseña. Copia el enlace y compártelo por WhatsApp o
        correo.
      </p>
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          alignItems: "end",
        }}
      >
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mama@ejemplo.com"
          />
        </label>
        <label className="field">
          <span>Nombre (opcional)</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="María"
          />
        </label>
        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: "var(--color-danger)", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
      {inviteLink && (
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
            Cuenta creada. Comparte este enlace para que la persona elija
            su contraseña:
          </div>
          <input
            type="text"
            readOnly
            value={inviteLink}
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: "100%", fontFamily: "monospace" }}
          />
        </div>
      )}
    </details>
  );
}
