import type { Subscription, Usuario } from "@/lib/schema";
import { TRIAL_DAYS } from "@/lib/schema";

export type AccessTier = "anon" | "trial" | "activa" | "cortesia" | "vencida";

export interface Access {
  tier: AccessTier;
  // Días completos hasta expiración; null cuando no aplica (anon, activa sin
  // renewsAt, vencida).
  daysLeft: number | null;
  // True cuando el usuario puede ver contenido bloqueado (recetas no-preview,
  // menús, etc.).
  hasFullAccess: boolean;
  // Fecha ISO de expiración relevante (trialEndAt o cortesiaEndAt).
  endsAt: string | null;
}

export const ANON_ACCESS: Access = {
  tier: "anon",
  daysLeft: null,
  hasFullAccess: false,
  endsAt: null,
};

/**
 * Deriva el estado de acceso desde el perfil del usuario.
 *
 * Reglas:
 * - Sin perfil (anónimo) → anon, sin acceso.
 * - `subscription.state === 'trial'` + trialEndAt en el futuro → trial con acceso.
 * - `subscription.state === 'trial'` + trialEndAt vencido → vencida sin acceso.
 * - `subscription.state === 'cortesia'` + cortesiaEndAt en el futuro → acceso.
 * - `subscription.state === 'cortesia'` + vencida → vencida sin acceso.
 * - `subscription.state === 'activa'` → acceso (pago activo cuando exista pasarela).
 * - `subscription.state === 'vencida'` → sin acceso.
 *
 * Superadmins tienen acceso completo pase lo que pase.
 *
 * `now` es inyectable para tests; en producción usar `Date.now()`.
 */
export function computeAccess(
  usuario: Pick<Usuario, "subscription" | "superadmin"> | null,
  now: number = Date.now()
): Access {
  if (!usuario) return ANON_ACCESS;
  if (usuario.superadmin) {
    return { tier: "activa", daysLeft: null, hasFullAccess: true, endsAt: null };
  }
  return accessFromSubscription(usuario.subscription, now);
}

function accessFromSubscription(sub: Subscription, now: number): Access {
  switch (sub.state) {
    case "trial": {
      const end = sub.trialEndAt ? Date.parse(sub.trialEndAt) : NaN;
      if (Number.isFinite(end) && end > now) {
        return {
          tier: "trial",
          daysLeft: daysBetween(now, end),
          hasFullAccess: true,
          endsAt: sub.trialEndAt,
        };
      }
      return {
        tier: "vencida",
        daysLeft: 0,
        hasFullAccess: false,
        endsAt: sub.trialEndAt,
      };
    }
    case "cortesia": {
      const end = sub.cortesiaEndAt ? Date.parse(sub.cortesiaEndAt) : NaN;
      if (Number.isFinite(end) && end > now) {
        return {
          tier: "cortesia",
          daysLeft: daysBetween(now, end),
          hasFullAccess: true,
          endsAt: sub.cortesiaEndAt,
        };
      }
      return {
        tier: "vencida",
        daysLeft: 0,
        hasFullAccess: false,
        endsAt: sub.cortesiaEndAt,
      };
    }
    case "activa": {
      const end = sub.renewsAt ? Date.parse(sub.renewsAt) : NaN;
      return {
        tier: "activa",
        daysLeft: Number.isFinite(end) ? daysBetween(now, end) : null,
        hasFullAccess: true,
        endsAt: sub.renewsAt,
      };
    }
    case "vencida":
      return {
        tier: "vencida",
        daysLeft: 0,
        hasFullAccess: false,
        endsAt: sub.trialEndAt ?? sub.cortesiaEndAt ?? sub.renewsAt,
      };
  }
}

function daysBetween(startMs: number, endMs: number): number {
  const diff = endMs - startMs;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Devuelve la fecha ISO de fin de trial a partir de una fecha de inicio.
 * Usa el reloj UTC — la conversión a America/Santiago se hace al mostrar.
 */
export function trialEndFromStart(startIso: string, days = TRIAL_DAYS): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return end.toISOString();
}
