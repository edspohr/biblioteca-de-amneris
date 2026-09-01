import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { repo } from "@/lib/repo";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = {
  title: "Cuéntanos de ti — La Biblioteca de Amneris",
  robots: { index: false, follow: false },
};

export default async function BienvenidaPage() {
  const ctx = await getSessionWithProfile();
  if (!ctx) redirect("/ingresar?next=/registro/bienvenida");
  // Superadmins skip onboarding — they land straight in /admin.
  if (ctx.session.superadmin) redirect("/admin");
  if (ctx.usuario?.onboardingCompletedAt) redirect("/libro");

  const etapas = await repo.getEtapas();
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "1rem 0" }}>
      <OnboardingWizard
        etapas={etapas}
        initial={{
          displayName: ctx.usuario?.displayName ?? ctx.session.name ?? "",
          babyName: ctx.usuario?.babyName ?? "",
          babyBirthdate: ctx.usuario?.babyBirthdate ?? "",
          phone: ctx.usuario?.phone ?? "",
          source: ctx.usuario?.source ?? null,
          consentAccepted: ctx.usuario?.consent.accepted ?? false,
        }}
      />
    </div>
  );
}
