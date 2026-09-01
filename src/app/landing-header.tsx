"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";
import { NICHO_LABEL } from "@/lib/marca";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "#activa", label: "Bocaditos" },
  { href: "#proximamente", label: "Próximamente" },
  { href: "#precios", label: "Precios" },
  { href: "#autora", label: "La autora" },
  { href: "#faq", label: "Preguntas" },
];

export function LandingHeader({ isLogged }: { isLogged: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest(".landing__nav-sheet") || t.closest(".landing__nav-toggle")) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const ctaHref = isLogged ? "/libro" : "/ingresar";
  const ctaLabel = isLogged ? "Entrar" : "Prueba gratis";

  return (
    <header className="landing__header" data-open={open || undefined}>
      <div className="landing__header-inner">
        <Link
          href="/"
          className="landing__brand"
          aria-label={`${SITE_NAME} — inicio`}
        >
          <Image
            src="/biblioteca-logo.png"
            alt=""
            width={44}
            height={44}
            className="landing__brand-mark"
            priority
          />
          <span className="landing__brand-lockup">
            <span className="landing__brand-name">{SITE_NAME}</span>
            <span className="landing__brand-tagline">{NICHO_LABEL}</span>
          </span>
        </Link>

        <nav className="landing__nav" aria-label="Secciones">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="landing__header-cta">
          <Link
            href={ctaHref}
            className="landing__button landing__button--dark landing__cta-short"
          >
            {ctaLabel}
          </Link>
        </div>

        <button
          type="button"
          className="landing__nav-toggle"
          aria-expanded={open}
          aria-controls="landing-nav-sheet"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div
          id="landing-nav-sheet"
          className="landing__nav-sheet"
          role="dialog"
          aria-label="Menú"
        >
          <nav aria-label="Secciones (móvil)">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
