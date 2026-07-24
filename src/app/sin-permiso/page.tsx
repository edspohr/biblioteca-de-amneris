import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { LogoutButton } from "../admin/logout-button";

export const metadata: Metadata = {
  title: "Sin permisos — Bocaditos del Corazón",
  robots: { index: false, follow: false },
};

export default async function SinPermisoPage() {
  const user = await verifySession();
  return (
    <div style={{ maxWidth: 560, margin: "2rem auto" }}>
      <h1>Sin permisos de autoría</h1>
      <p>
        Tu cuenta{" "}
        {user?.email ? (
          <>
            (<strong>{user.email}</strong>){" "}
          </>
        ) : null}
        no tiene acceso al panel de autoría. Si crees que esto es un error,
        escríbele a Amneris.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <Link href="/libro" className="button button--primary">
          Volver al lector
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
