"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Chrome/Edge/Samsung Internet fire this before showing their own install UI.
// Not in the DOM lib typings yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Plataforma = "ios" | "android" | "otro";

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; tell them apart by touch support.
  const esIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (esIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "otro";
}

function yaInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Always-visible floating "Instalar app" button.
 *
 * - Android / desktop Chrome: triggers the native install prompt when the
 *   browser offers one.
 * - iOS (and any browser without a prompt): opens a sheet with step-by-step
 *   instructions to add the site to the home screen.
 *
 * Hidden only when the site is already running as the installed app, and
 * inside /admin.
 */
export function InstalarApp() {
  const pathname = usePathname();
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [promptEvt, setPromptEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setPlataforma(detectarPlataforma());
    setInstalada(yaInstalada());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalada(true);
      setPromptEvt(null);
      setAbierto(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  if (plataforma === null || instalada || pathname.startsWith("/admin")) {
    return null;
  }

  const onClick = async () => {
    if (promptEvt) {
      await promptEvt.prompt();
      const { outcome } = await promptEvt.userChoice;
      // A prompt event can only be used once.
      setPromptEvt(null);
      if (outcome === "accepted") setInstalada(true);
      return;
    }
    setAbierto(true);
  };

  return (
    <>
      <button
        type="button"
        className="instalar-fab"
        onClick={onClick}
        aria-haspopup={promptEvt ? undefined : "dialog"}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        Instalar app
      </button>

      {abierto && (
        <>
          <div className="sheet-backdrop" onClick={() => setAbierto(false)} />
          <div
            className="instalar-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="instalar-titulo"
          >
            <h2 id="instalar-titulo">Instala la Biblioteca en tu teléfono</h2>
            <p className="instalar-sheet__intro">
              Tendrás un ícono en tu pantalla de inicio y la biblioteca se abrirá
              como una app, sin barra del navegador.
            </p>
            <Instrucciones plataforma={plataforma} />
            <button
              type="button"
              className="instalar-sheet__cerrar"
              onClick={() => setAbierto(false)}
            >
              Entendido
            </button>
          </div>
        </>
      )}
    </>
  );
}

function Instrucciones({ plataforma }: { plataforma: Plataforma }) {
  if (plataforma === "ios") {
    return (
      <ol className="instalar-sheet__pasos">
        <li>
          Abre esta página en <strong>Safari</strong>.
        </li>
        <li>
          Toca el botón <strong>Compartir</strong>{" "}
          <IconoCompartir /> en la barra de abajo (o arriba, en iPad).
        </li>
        <li>
          Desliza y elige <strong>«Agregar a inicio»</strong>.
        </li>
        <li>
          Toca <strong>Agregar</strong>. ¡Listo!
        </li>
      </ol>
    );
  }
  if (plataforma === "android") {
    return (
      <ol className="instalar-sheet__pasos">
        <li>
          Abre esta página en <strong>Chrome</strong>.
        </li>
        <li>
          Toca el menú <strong>⋮</strong> arriba a la derecha.
        </li>
        <li>
          Elige <strong>«Instalar app»</strong> o{" "}
          <strong>«Agregar a la pantalla principal»</strong>.
        </li>
        <li>
          Confirma con <strong>Instalar</strong>. ¡Listo!
        </li>
      </ol>
    );
  }
  return (
    <ol className="instalar-sheet__pasos">
      <li>
        En tu teléfono, abre esta misma dirección:{" "}
        <strong>{window.location.host}</strong>
      </li>
      <li>
        <strong>iPhone:</strong> en Safari, toca Compartir <IconoCompartir /> y
        luego «Agregar a inicio».
      </li>
      <li>
        <strong>Android:</strong> en Chrome, toca el menú ⋮ y luego «Instalar
        app».
      </li>
      <li>
        En computador con Chrome o Edge, usa el ícono de instalar en la barra
        de direcciones.
      </li>
    </ol>
  );
}

function IconoCompartir() {
  return (
    <svg
      aria-label="Compartir"
      role="img"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M12 3v13" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}
