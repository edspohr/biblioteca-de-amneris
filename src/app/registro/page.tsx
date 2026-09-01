import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { RegistroForm } from "./registro-form";

export const metadata: Metadata = {
  title: "Crear cuenta — La Biblioteca de Amneris",
  robots: { index: false, follow: false },
};

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const ctx = await getSessionWithProfile();
  if (ctx) {
    if (!ctx.usuario?.onboardingCompletedAt && !ctx.session.superadmin) {
      redirect("/registro/bienvenida");
    }
    redirect(ctx.session.superadmin ? "/admin" : next && next.startsWith("/") ? next : "/libro");
  }
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1rem 0" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Crea tu cuenta</h1>
        <p style={{ color: "var(--color-ink-muted)" }}>
          30 días de prueba gratis, sin tarjeta. Encuentra la receta adecuada
          para tu bebé en 15 a 20 segundos, con menú semanal y lista de
          compras.
        </p>
      </header>
      <RegistroForm next={next && next.startsWith("/") ? next : undefined} />
      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
        ¿Ya tienes cuenta? <Link href="/ingresar">Ingresa aquí</Link>
      </p>
    </div>
  );
}
