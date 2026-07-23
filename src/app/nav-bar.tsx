"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "/recetas", label: "Recetas" },
  { href: "/menus", label: "Menús" },
  { href: "/tecnicas", label: "Técnicas" },
  { href: "/admin", label: "Autoría" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav" role="banner">
      <div className="nav__bar">
        <Link href="/" className="brand" aria-label="Bocaditos del Corazón — inicio">
          Bocaditos del Corazón
        </Link>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav__toggle-icon" aria-hidden="true">
            {open ? "✕" : "☰"}
          </span>
        </button>
        <ul className="nav__links" id="nav-menu" data-open={open}>
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <li key={l.href}>
                <Link href={l.href} aria-current={active ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
