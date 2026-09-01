"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { SITE_NAME } from "@/lib/site";

const LINKS: { href: string; label: string }[] = [
  { href: "/recetas", label: "Recetas" },
  { href: "/menus", label: "Menús" },
  { href: "/tecnicas", label: "Técnicas" },
];

export function NavBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !accountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, accountOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

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
          aria-label={`${SITE_NAME} — inicio`}
        >
          <Image
            src="/biblioteca-logo.png"
            alt=""
            width={36}
            height={36}
            className="brand__mark"
            priority
          />
          <span className="brand__text">{SITE_NAME}</span>
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
          {user ? (
            <li className="nav__account" ref={accountRef as never}>
              <button
                type="button"
                className="nav__avatar-btn"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Mi cuenta"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="nav__avatar" aria-hidden="true">
                  {initial || "·"}
                </span>
              </button>
              {accountOpen && (
                <div className="nav__menu" role="menu">
                  <div className="nav__menu-header" aria-hidden="true">
                    {user.name || user.email}
                  </div>
                  <Link href="/cuenta" role="menuitem" className="nav__menu-item">
                    Mi cuenta
                  </Link>
                  {user.superadmin && (
                    <Link
                      href="/admin/recetas"
                      role="menuitem"
                      className="nav__menu-item"
                    >
                      Panel de autoría
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="nav__menu-item nav__menu-item--danger"
                    onClick={handleLogout}
                    disabled={signingOut}
                  >
                    {signingOut ? "Saliendo…" : "Cerrar sesión"}
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li className="nav__cta">
              <Link href="/registro" className="button button--primary nav__cta-btn">
                Entrar gratis
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
