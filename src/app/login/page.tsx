import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Bocaditos del Corazón",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string; reason?: string }>;
}) {
  const { next, mode, reason } = await searchParams;
  const user = await verifySession();
  if (user) {
    // Already logged in: send them where they were going, or to /admin if
    // they're a superadmin, else to the reader.
    if (next && next.startsWith("/")) redirect(next);
    redirect(user.superadmin ? "/admin" : "/libro");
  }
  const forcedMode =
    reason === "reader" || reason === "asistente" ? "signup" : null;
  const initialMode =
    forcedMode ?? (mode === "signup" ? "signup" : "signin");
  const title =
    reason === "reader"
      ? "Regístrate gratis para leer el libro"
      : reason === "asistente"
      ? "Regístrate para preguntarle al libro"
      : initialMode === "signup"
      ? "Crea tu cuenta"
      : "Iniciar sesión";
  const lede =
    reason === "reader"
      ? "El libro es gratis, pero necesitamos que crees una cuenta para acceder. No pedimos tarjeta ni datos innecesarios."
      : reason === "asistente"
      ? "Crea tu cuenta gratis para consultar al asistente todas las veces que quieras."
      : initialMode === "signup"
      ? "Es gratis. Con tu cuenta podremos avisarte de novedades más adelante."
      : "Accede a tu cuenta o crea una nueva para acompañarte en la aventura de alimentar a tu bebé.";
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>{title}</h1>
        <p style={{ color: "var(--color-ink-muted)" }}>{lede}</p>
      </header>
      <LoginForm
        next={next && next.startsWith("/") ? next : undefined}
        initialMode={initialMode}
      />
    </div>
  );
}
