"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserSummary } from "@/lib/users/service";

const PROVIDER_LABEL: Record<string, string> = {
  "google.com": "Google",
  password: "Correo",
  "phone": "Teléfono",
};

interface Props {
  users: UserSummary[];
  selfUid: string;
}

export function UsersTable({ users, selfUid }: Props) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Correo</th>
            <th>Nombre</th>
            <th>Alta</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Autoría</th>
            <th style={{ minWidth: 240 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.uid} user={u} isSelf={u.uid === selfUid} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: UserSummary; isSelf: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setMessage(null);
    setInvite(null);
    const res = await fetch(`/api/usuarios/${user.uid}`, {
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
        `¿Eliminar la cuenta de ${user.email ?? user.uid}? La persona perderá el acceso inmediatamente y no se puede deshacer.`
      )
    ) {
      return;
    }
    setMessage(null);
    const res = await fetch(`/api/usuarios/${user.uid}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "No se pudo eliminar.");
      return;
    }
    startTransition(() => router.refresh());
  }

  const fecha = new Date(user.createdAt).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <tr style={user.disabled ? { opacity: 0.55 } : undefined}>
        <td>
          {user.email ?? "—"}
          {isSelf && (
            <span
              style={{
                marginLeft: 6,
                fontSize: "0.75rem",
                color: "var(--color-ink-muted)",
              }}
            >
              (tú)
            </span>
          )}
        </td>
        <td>{user.displayName ?? "—"}</td>
        <td>{fecha}</td>
        <td>
          {user.providers
            .map((p) => PROVIDER_LABEL[p] ?? p)
            .join(", ") || "—"}
        </td>
        <td>{user.disabled ? "Deshabilitada" : "Activa"}</td>
        <td>{user.superadmin ? "Sí" : "No"}</td>
        <td>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {user.superadmin ? (
              <button
                type="button"
                className="button button--ghost"
                disabled={pending || isSelf}
                onClick={() =>
                  patch(
                    { superadmin: false },
                    `¿Quitar los permisos de autoría a ${user.email ?? user.uid}?\n\nPerderá acceso al panel /admin, pero la cuenta seguirá pudiendo iniciar sesión.`
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
                    `¿Otorgar permisos de autoría a ${user.email ?? user.uid}?\n\nPodrá crear, editar y eliminar recetas, menús, ingredientes y usuarios.`
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
                  { disabled: !user.disabled },
                  user.disabled
                    ? `¿Reactivar la cuenta de ${user.email ?? user.uid}?`
                    : `¿Deshabilitar la cuenta de ${user.email ?? user.uid}?\n\nNo podrá iniciar sesión hasta que la reactives.`
                )
              }
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
              title={isSelf ? "No puedes deshabilitar tu propia cuenta" : undefined}
            >
              {user.disabled ? "Reactivar" : "Deshabilitar"}
            </button>
            {user.email && (
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
            <div
              role="alert"
              style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginTop: 4 }}
            >
              {message}
            </div>
          )}
          {invite && (
            <div style={{ marginTop: 6, fontSize: "0.8rem" }}>
              <div>
                Enlace de invitación (copia y compártelo con la persona):
              </div>
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
    </>
  );
}
