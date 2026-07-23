import type { ReactNode } from "react";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { EtapaActivaProvider } from "@/lib/etapa-activa/context";
import { EtapaSelectorGlobal } from "@/lib/etapa-activa/selector-global";
import "./globals.css";

export const metadata = {
  title: "Bocaditos del Corazón",
  description: "Guía de alimentación complementaria para bebés de 6 a 24 meses",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const etapas = await repo.getEtapas();

  return (
    <html lang="es">
      <body>
        <EtapaActivaProvider etapas={etapas}>
          <header className="nav">
            <ul>
              <li className="brand">
                <Link href="/">Bocaditos del Corazón</Link>
              </li>
              <li>
                <Link href="/recetas">Recetas</Link>
              </li>
              <li>
                <Link href="/etapas/etapa-1">Etapa 1</Link>
              </li>
              <li>
                <Link href="/etapas/etapa-2">Etapa 2</Link>
              </li>
              <li>
                <Link href="/etapas/etapa-3">Etapa 3</Link>
              </li>
              <li>
                <Link href="/menus">Menús</Link>
              </li>
              <li>
                <Link href="/tecnicas">Técnicas</Link>
              </li>
              <li style={{ marginLeft: "auto" }}>
                <EtapaSelectorGlobal />
              </li>
              <li>
                <Link href="/admin">Autoría</Link>
              </li>
            </ul>
          </header>
          <main>{children}</main>
        </EtapaActivaProvider>
      </body>
    </html>
  );
}
