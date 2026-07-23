import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
        }}
      >
        <strong>Modo autoría.</strong> Los cambios que hagas aquí se guardan en
        los archivos del proyecto. <Link href="/">Volver al lector</Link>
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
            <Link href="/admin/ingredientes">Ingredientes</Link>
          </li>
          <li>
            <Link href="/admin/alergenos">Alérgenos</Link>
          </li>
          <li>
            <Link href="/admin/tecnicas">Técnicas</Link>
          </li>
        </ul>
      </nav>
      {children}
    </>
  );
}
