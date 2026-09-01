import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { IngresarForm } from "./ingresar-form";

export const metadata: Metadata = {
  title: "Ingresar — La Biblioteca de Amneris",
  robots: { index: false, follow: false },
};

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const ctx = await getSessionWithProfile();
  if (ctx) {
    if (!ctx.usuario?.onboardingCompletedAt && !ctx.session.superadmin) {
      redirect("/registro/bienvenida");
    }
    if (next && next.startsWith("/")) redirect(next);
    redirect(ctx.session.superadmin ? "/admin" : "/libro");
  }
  const title = reason === "reader" ? "Entra para seguir leyendo" : "Ingresa a tu cuenta";
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "1rem 0" }}>
      <header style={{ marginBottom: "1.25rem", textAlign: "center" }}>
        <img
          src="/biblioteca-logo.png"
          alt=""
          width={64}
          height={64}
          style={{ margin: "0 auto 0.75rem", display: "block" }}
        />
        <h1 style={{ marginBottom: "0.5rem" }}>{title}</h1>
        <p style={{ color: "var(--color-ink-muted)" }}>
          Continúa con la misma cuenta de Google que usaste para registrarte.
        </p>
      </header>
      <IngresarForm next={next && next.startsWith("/") ? next : undefined} />
      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
        ¿Aún no tienes cuenta? <Link href="/registro">Regístrate gratis</Link>
      </p>
    </div>
  );
}
