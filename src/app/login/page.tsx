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
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const user = await verifySession();
  if (user) {
    // Already logged in: send them where they were going, or to /admin if
    // they're a superadmin, else to the reader.
    if (next && next.startsWith("/")) redirect(next);
    redirect(user.superadmin ? "/admin" : "/libro");
  }
  const title =
    reason === "reader"
      ? "Entra para leer el libro"
      : reason === "asistente"
      ? "Entra para preguntarle al libro"
      : "Entra al libro";
  const lede =
    reason === "reader"
      ? "El libro es gratis, pero necesitamos que entres para acceder. Usamos tu cuenta de Google — sin contraseñas nuevas."
      : reason === "asistente"
      ? "Entra con tu cuenta de Google para consultar al asistente todas las veces que quieras."
      : "Accede con tu cuenta de Google para acompañarte en la aventura de alimentar a tu bebé.";
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>{title}</h1>
        <p style={{ color: "var(--color-ink-muted)" }}>{lede}</p>
      </header>
      <LoginForm next={next && next.startsWith("/") ? next : undefined} />
    </div>
  );
}
