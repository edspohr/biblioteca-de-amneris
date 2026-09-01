import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { CuentaForm } from "./cuenta-form";
import { LogoutButton } from "./logout-button";
import {
  ANNUAL_PRICE_CLP,
  ANNUAL_SAVINGS_MONTHS,
  MONTHLY_PRICE_CLP,
  formatCLP,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Mi cuenta — La Biblioteca de Amneris",
  robots: { index: false, follow: false },
};

export default async function CuentaPage() {
  const ctx = await getSessionWithProfile();
  if (!ctx) redirect("/ingresar?next=/cuenta");
  if (!ctx.usuario?.onboardingCompletedAt && !ctx.session.superadmin) {
    redirect("/registro/bienvenida");
  }

  const u = ctx.usuario;
  const access = ctx.access;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "1rem 0" }}>
      <h1>Mi cuenta</h1>

      <section className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Estado de tu acceso</h2>
        <p style={{ margin: "0.25rem 0" }}>
          <strong>{estadoLabel(access.tier)}</strong>
          {access.daysLeft !== null && (
            <> · {access.daysLeft} día{access.daysLeft === 1 ? "" : "s"} restante{access.daysLeft === 1 ? "" : "s"}</>
          )}
        </p>
        {access.tier === "cortesia" && u?.subscription.cortesiaValueCLP && (
          <p style={{ color: "var(--color-ink-muted)" }}>
            Acceso de regalo valorado en {formatCLP(u.subscription.cortesiaValueCLP)}
            {u.subscription.cortesiaNote ? ` · ${u.subscription.cortesiaNote}` : ""}
          </p>
        )}
        {access.tier === "vencida" && (
          <p style={{ color: "var(--color-ink-muted)" }}>
            Tu prueba terminó. Muy pronto podrás suscribirte a la biblioteca por{" "}
            <strong>{formatCLP(MONTHLY_PRICE_CLP)} al mes</strong> o{" "}
            <strong>{formatCLP(ANNUAL_PRICE_CLP)} al año</strong> (ahorra{" "}
            {ANNUAL_SAVINGS_MONTHS} meses) — incluye todas las próximas
            secciones sin pagar extra.
          </p>
        )}
        {access.tier === "trial" && (
          <p style={{ color: "var(--color-ink-muted)" }}>
            Cuando activemos los pagos, la suscripción será{" "}
            {formatCLP(MONTHLY_PRICE_CLP)} al mes o {formatCLP(ANNUAL_PRICE_CLP)}{" "}
            al año (ahorra {ANNUAL_SAVINGS_MONTHS} meses). Cada nueva sección de la
            biblioteca queda incluida.
          </p>
        )}
      </section>

      <CuentaForm
        initial={{
          displayName: u?.displayName ?? ctx.session.name ?? "",
          email: u?.email ?? ctx.session.email ?? "",
          phone: u?.phone ?? "",
          babyName: u?.babyName ?? "",
          babyBirthdate: u?.babyBirthdate ?? "",
        }}
      />

      <section style={{ marginTop: "1.5rem", display: "grid", gap: "0.5rem" }}>
        <LogoutButton />
        <a
          className="button button--ghost"
          href="mailto:amnerispinto@gmail.com?subject=Solicito%20eliminar%20mi%20cuenta"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          Solicitar eliminación de mi cuenta
        </a>
        {/* TODO: reemplazar mailto por endpoint dedicado que dispare workflow legal. */}
      </section>
    </div>
  );
}

function estadoLabel(tier: string): string {
  switch (tier) {
    case "trial":
      return "Período de prueba activo";
    case "activa":
      return "Suscripción activa";
    case "cortesia":
      return "Acceso de cortesía";
    case "vencida":
      return "Acceso limitado (modo lectura pública)";
    default:
      return "Sin acceso";
  }
}
