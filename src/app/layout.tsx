import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
import { repo } from "@/lib/repo";
import { EtapaActivaProvider } from "@/lib/etapa-activa/context";
import { EtapaSelectorGlobal } from "@/lib/etapa-activa/selector-global";
import { NavBar } from "./nav-bar";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-serif",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Bocaditos del Corazón",
  description: "Guía de alimentación complementaria para bebés de 6 a 24 meses",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fdf6ee",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const etapas = await repo.getEtapas();

  return (
    <html lang="es" className={`${fraunces.variable} ${sourceSerif.variable}`}>
      <body>
        <EtapaActivaProvider etapas={etapas}>
          <NavBar />
          <EtapaSelectorGlobal />
          <main>{children}</main>
        </EtapaActivaProvider>
      </body>
    </html>
  );
}
