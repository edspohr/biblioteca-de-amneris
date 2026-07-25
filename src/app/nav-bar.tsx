"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase/client";

const LINKS: { href: string; label: string }[] = [
  { href: "/recetas", label: "Recetas" },
  { href: "/menus", label: "Menús" },
  { href: "/tecnicas", label: "Técnicas" },
];

export function NavBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      try {
        await getFirebaseAuth().signOut();
      } catch {
        // Client SDK may not be initialized; server cookie is already gone.
      }
      window.location.assign("/");
    } catch {
      setSigningOut(false);
    }
  }

  if (pathname === "/") return null;

  const initial = (user?.name || user?.email || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="nav" role="banner">
      <div className="nav__bar">
        <Link
          href={user ? "/libro" : "/"}
          className="brand"
          aria-label="Bocaditos del Corazón — inicio"
        >
          <Image
            src="/logo-192.png"
            alt=""
            width={32}
            height={32}
            className="brand__mark"
            priority
          />
          <span>Bocaditos del Corazón</span>
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
          {user?.superadmin && (
            <li>
              <Link
                href="/admin/recetas"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              >
                Editor
              </Link>
            </li>
          )}
          {user ? (
            <li className="nav__account">
              <span
                className="nav__avatar"
                aria-hidden="true"
                title={user.email ?? undefined}
              >
                {initial || "·"}
              </span>
              <button
                type="button"
                className="nav__logout"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? "Saliendo…" : "Cerrar sesión"}
              </button>
            </li>
          ) : (
            <li>
              <Link href="/login">Entrar</Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
