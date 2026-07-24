import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!user.superadmin) {
    redirect("/sin-permiso");
  }
  return (
    <>
      <div
        style={{
          background: "#fff3cd",
          border: "1px solid #d1a418",
          padding: "0.6rem 1rem",
          borderRadius: 6,
          marginBottom: "1rem",
          fontSize: "0.9rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span>
          <strong>Modo autoría.</strong> Sesión iniciada como{" "}
          <strong>{user.email ?? user.uid}</strong>. <Link href="/libro">Volver al lector</Link>
        </span>
        <LogoutButton />
      </div>
      <nav style={{ marginBottom: "1rem" }}>
        <ul
          style={{
            display: "flex",
            gap: "1rem",
            listStyle: "none",
            padding: 0,
            margin: 0,
            flexWrap: "wrap",
          }}
        >
          <li>
            <Link href="/admin">Inicio</Link>
          </li>
          <li>
            <Link href="/admin/recetas">Recetas</Link>
          </li>
          <li>
            <Link href="/admin/menus">Menús</Link>
          </li>
          <li>
            <Link href="/admin/ingredientes">Ingredientes</Link>
          </li>
          <li>
            <Link href="/admin/alergenos">Alérgenos</Link>
          </li>
          <li>
            <Link href="/admin/tecnicas">Técnicas</Link>
          </li>
          <li>
            <Link href="/admin/usuarios">Usuarios</Link>
          </li>
        </ul>
      </nav>
      {children}
    </>
  );
}
