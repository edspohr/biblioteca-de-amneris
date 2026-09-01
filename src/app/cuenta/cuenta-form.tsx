"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initial {
  displayName: string;
  email: string;
  phone: string;
  babyName: string;
  babyBirthdate: string;
}

export function CuentaForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone);
  const [babyName, setBabyName] = useState(initial.babyName);
  const [babyBirthdate, setBabyBirthdate] = useState(initial.babyBirthdate);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/usuarios/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          phone: phone.trim() || null,
          babyName: babyName.trim() || null,
          babyBirthdate: babyBirthdate || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No pudimos guardar tus datos.");
      }
      setMsg("Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: "1.25rem", display: "grid", gap: "0.75rem" }}>
      <h2 style={{ marginTop: 0 }}>Tus datos</h2>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Nombre</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ padding: "0.6rem 0.75rem" }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Correo</span>
        <input type="email" value={initial.email} disabled style={{ padding: "0.6rem 0.75rem" }} />
        <small style={{ color: "var(--color-ink-muted)" }}>
          El correo no se puede cambiar aquí. Escríbenos si necesitas moverlo.
        </small>
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>WhatsApp</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: "0.6rem 0.75rem" }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Nombre del bebé</span>
        <input
          type="text"
          value={babyName}
          onChange={(e) => setBabyName(e.target.value)}
          style={{ padding: "0.6rem 0.75rem" }}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Fecha de nacimiento del bebé</span>
        <input
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={babyBirthdate}
          onChange={(e) => setBabyBirthdate(e.target.value)}
          style={{ padding: "0.6rem 0.75rem", minHeight: 44 }}
        />
      </label>

      {error && <p role="alert" style={{ color: "var(--color-danger, #b3261e)" }}>{error}</p>}
      {msg && <p style={{ color: "var(--color-ink)" }}>{msg}</p>}

      <button
        type="submit"
        className="button button--primary"
        disabled={saving}
        style={{ minHeight: 44 }}
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
