import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Caveat, Fraunces, Source_Serif_4 } from "next/font/google";
import { repo } from "@/lib/repo";
import { EtapaActivaProvider } from "@/lib/etapa-activa/context";
import { EtapaSelectorGlobal } from "@/lib/etapa-activa/selector-global";
import { NavBarServer } from "./nav-bar-server";
import { AsistenteWidget } from "./asistente/widget";
import { TrialBanner } from "@/components/trial-banner";
import { getSessionWithProfile } from "@/lib/auth/session";
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

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-caveat",
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: {
    default: "La Biblioteca de Amneris — recetas y planes para bebés de 0 a 2 años",
    template: "%s · La Biblioteca de Amneris",
  },
  description:
    "Una suscripción, toda la biblioteca. Recetas rápidas, menús y planes de alimentación pensados para papás y mamás de bebés de 0 a 2 años.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fdf6ee",
};

// Serve every page fresh from the repo so admin edits show up immediately
// once Firestore is the live source. The trade-off is a per-request Firestore
// read for the reader pages; at 120 recipes and current traffic it's cheap.
// Revisit with ISR + on-demand revalidation if reads become a cost concern.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [etapas, ctx] = await Promise.all([
    repo.getEtapas(),
    getSessionWithProfile(),
  ]);

  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${sourceSerif.variable} ${caveat.variable}`}
    >
      <body>
        <EtapaActivaProvider
          etapas={etapas}
          initialBirthdate={ctx?.usuario?.babyBirthdate ?? null}
          initialManualOverride={ctx?.usuario?.manualEtapaOverride ?? null}
        >
          <TrialBanner />
          <NavBarServer />
          <EtapaSelectorGlobal />
          <main>{children}</main>
          <AsistenteWidget enabled={Boolean(ctx)} />
        </EtapaActivaProvider>
      </body>
    </html>
  );
}
