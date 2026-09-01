"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioWithAccess } from "@/lib/users/service";
import { monthsSince } from "@/lib/etapa-activa/age";
import { formatCLP, MONTHLY_PRICE_CLP } from "@/lib/pricing";

const PROVIDER_LABEL: Record<string, string> = {
  "google.com": "Google",
  password: "Correo",
  phone: "Teléfono",
};

const STATE_LABEL: Record<string, string> = {
  trial: "En prueba",
  activa: "Activa",
  cortesia: "Cortesía",
  vencida: "Vencida",
  anon: "—",
};

interface Props {
  rows: UsuarioWithAccess[];
  selfUid: string;
}

export function UsersTable({ rows, selfUid }: Props) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Correo</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Fuente</th>
            <th>Bebé</th>
            <th>Estado</th>
            <th>Vence</th>
            <th>Autoría</th>
            <th style={{ minWidth: 260 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <UserRow key={r.summary.uid} row={r} isSelf={r.summary.uid === selfUid} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ row, isSelf }: { row: UsuarioWithAccess; isSelf: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [modal, setModal] = useState<"cortesia" | "trial" | null>(null);

  const u = row.summary;
  const p = row.profile;
  const s = p?.subscription;
  const babyMonths = p?.babyBirthdate ? monthsSince(p.babyBirthdate) : null;
  const vence =
    row.access.tier === "trial"
      ? s?.trialEndAt
      : row.access.tier === "cortesia"
      ? s?.cortesiaEndAt
      : null;

  async function patch(body: Record<string, unknown>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setMessage(null);
    setInvite(null);
    const res = await fetch(`/api/usuarios/${u.uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      inviteLink?: string;
    };
    if (!res.ok) {
      setMessage(data.error || "No se pudo aplicar el cambio.");
      return;
    }
    if (data.inviteLink) setInvite(data.inviteLink);
    startTransition(() => router.refresh());
  }

  async function del() {
    if (
      !confirm(
        `¿Eliminar la cuenta de ${u.email ?? u.uid}? La persona perderá el acceso inmediatamente y no se puede deshacer.`
      )
    ) {
      return;
    }
    setMessage(null);
    const res = await fetch(`/api/usuarios/${u.uid}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "No se pudo eliminar.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <>
      <tr style={u.disabled ? { opacity: 0.55 } : undefined}>
        <td>
          {u.email ?? "—"}
          {isSelf && (
            <span style={{ marginLeft: 6, fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>
              (tú)
            </span>
          )}
        </td>
        <td>{p?.displayName ?? u.displayName ?? "—"}</td>
        <td>{p?.phone ?? "—"}</td>
        <td>{p?.source ?? "—"}</td>
        <td>
          {p?.babyName ?? "—"}
          {babyMonths !== null && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>
              {babyMonths} meses
            </div>
          )}
        </td>
        <td>{STATE_LABEL[row.access.tier] ?? row.access.tier}</td>
        <td>{vence ? new Date(vence).toLocaleDateString("es-CL") : "—"}</td>
        <td>{u.superadmin ? "Sí" : "No"}</td>
        <td>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              type="button"
              className="button button--ghost"
              disabled={pending}
              onClick={() => setModal("cortesia")}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
            >
              Dar cortesía
            </button>
            <button
              type="button"
              className="button button--ghost"
              disabled={pending}
              onClick={() => setModal("trial")}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
            >
              Extender trial
            </button>
            {u.superadmin ? (
              <button
                type="button"
                className="button button--ghost"
                disabled={pending || isSelf}
                onClick={() =>
                  patch(
                    { superadmin: false },
                    `¿Quitar los permisos de autoría a ${u.email ?? u.uid}?`
                  )
                }
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                title={isSelf ? "No puedes revocar tus propios permisos" : undefined}
              >
                Quitar autoría
              </button>
            ) : (
              <button
                type="button"
                className="button button--ghost"
                disabled={pending}
                onClick={() =>
                  patch(
                    { superadmin: true },
                    `¿Otorgar permisos de autoría a ${u.email ?? u.uid}?`
                  )
                }
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
              >
                Dar autoría
              </button>
            )}
            <button
              type="button"
              className="button button--ghost"
              disabled={pending || isSelf}
              onClick={() =>
                patch(
                  { disabled: !u.disabled },
                  u.disabled
                    ? `¿Reactivar la cuenta de ${u.email ?? u.uid}?`
                    : `¿Deshabilitar la cuenta de ${u.email ?? u.uid}?`
                )
              }
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
              title={isSelf ? "No puedes deshabilitar tu propia cuenta" : undefined}
            >
              {u.disabled ? "Reactivar" : "Deshabilitar"}
            </button>
            {u.email && (
              <button
                type="button"
                className="button button--ghost"
                disabled={pending}
                onClick={() => patch({ resendInvite: true })}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
              >
                Enlace de invitación
              </button>
            )}
            <button
              type="button"
              className="button button--ghost"
              disabled={pending || isSelf}
              onClick={del}
              style={{
                fontSize: "0.8rem",
                padding: "0.25rem 0.6rem",
                color: "var(--color-danger)",
              }}
              title={isSelf ? "No puedes eliminar tu propia cuenta" : undefined}
            >
              Eliminar
            </button>
          </div>
          {message && (
            <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginTop: 4 }}>
              {message}
            </div>
          )}
          {invite && (
            <div style={{ marginTop: 6, fontSize: "0.8rem" }}>
              <div>Enlace de invitación (copia y compártelo):</div>
              <input
                type="text"
                readOnly
                value={invite}
                onFocus={(e) => e.currentTarget.select()}
                style={{ width: "100%", marginTop: 2, fontFamily: "monospace" }}
              />
            </div>
          )}
        </td>
      </tr>
      {modal === "cortesia" && (
        <CortesiaModal
          uid={u.uid}
          email={u.email ?? u.uid}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            startTransition(() => router.refresh());
          }}
        />
      )}
      {modal === "trial" && (
        <ExtenderTrialModal
          uid={u.uid}
          email={u.email ?? u.uid}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </>
  );
}

function CortesiaModal({
  uid,
  email,
  onClose,
  onDone,
}: {
  uid: string;
  email: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [valueCLP, setValueCLP] = useState(MONTHLY_PRICE_CLP);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${uid}/cortesia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endsAt,
          valueCLP,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo aplicar la cortesía.");
      }
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Dar cortesía a ${email}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Fecha de expiración</span>
          <input
            type="date"
            required
            value={endsAt}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Valor CLP (se mostrará al usuario como {formatCLP(valueCLP)})</span>
          <input
            type="number"
            required
            min={0}
            step={100}
            value={valueCLP}
            onChange={(e) => setValueCLP(Number(e.target.value))}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nota interna (opcional — ej. &quot;alianza con Baby&Co&quot;)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </label>
        {error && <p role="alert" style={{ color: "var(--color-danger)" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Guardando…" : "Confirmar cortesía"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ExtenderTrialModal({
  uid,
  email,
  onClose,
  onDone,
}: {
  uid: string;
  email: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dias, setDias] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${uid}/extender-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo extender el trial.");
      }
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Extender trial de ${email}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Días adicionales</span>
          <input
            type="number"
            required
            min={1}
            max={365}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </label>
        {error && <p role="alert" style={{ color: "var(--color-danger)" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Guardando…" : `Extender ${dias} días`}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={9} style={{ padding: 0 }}>
        <div
          className="card"
          style={{
            margin: "0.5rem 0",
            padding: "1rem",
            background: "var(--color-surface, #FFFBF3)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <strong>{title}</strong>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{ background: "none", border: 0, fontSize: "1.2rem", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </td>
    </tr>
  );
}
