import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Caveat, Fraunces, Source_Serif_4 } from "next/font/google";
import { repo } from "@/lib/repo";
import { EtapaActivaProvider } from "@/lib/etapa-activa/context";
import { EtapaSelectorGlobal } from "@/lib/etapa-activa/selector-global";
import { NavBarServer } from "./nav-bar-server";
import { AsistenteWidget } from "./asistente/widget";
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
  title: "Bocaditos del Corazón",
  description: "Guía de alimentación complementaria para bebés de 6 a 24 meses",
  icons: {
    icon: [
      { url: "/logo-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/logo-192.png",
  },
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
  // Reader gate is disabled (see middleware.ts READER_GATE_ENABLED). The
  // assistant widget is temporarily forced on so anyone testing can try it.
  // When re-enabling auth, restore: `const [etapas, user] = await Promise.all(
  // [repo.getEtapas(), verifySession()])` and `enabled={Boolean(user)}`.
  const etapas = await repo.getEtapas();

  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${sourceSerif.variable} ${caveat.variable}`}
    >
      <body>
        <EtapaActivaProvider etapas={etapas}>
          <NavBarServer />
          <EtapaSelectorGlobal />
          <main>{children}</main>
          <AsistenteWidget enabled />
        </EtapaActivaProvider>
      </body>
    </html>
  );
}
