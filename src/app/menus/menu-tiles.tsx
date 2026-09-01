"use client";

import Link from "next/link";
import { useState } from "react";
import { RegisterInvite } from "@/components/register-invite";

interface Tile {
  id: string;
  nombre: string;
  recetas: number;
  rangoEdad: string | undefined;
}

export function MenuTiles({
  tiles,
  hasFullAccess,
}: {
  tiles: Tile[];
  hasFullAccess: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | undefined>(undefined);

  return (
    <>
      <ul className="grid tile-grid">
        {tiles.map((t) => {
          const href = `/menus/${t.id}`;
          if (hasFullAccess) {
            return (
              <li key={t.id} className="tile tile--menu">
                <Link href={href} className="tile__link">
                  <span className="tile__title">{t.nombre}</span>
                  <span className="tile__meta">
                    {t.recetas} recetas{t.rangoEdad ? ` · ${t.rangoEdad}` : ""}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.id} className="tile tile--menu" data-locked="true">
              <button
                type="button"
                className="tile__link"
                onClick={() => {
                  setTarget(href);
                  setOpen(true);
                }}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                  position: "relative",
                  opacity: 0.85,
                }}
                aria-label={`Menú bloqueado: ${t.nombre}. Regístrate gratis para verlo.`}
              >
                <span className="tile__title">{t.nombre}</span>
                <span className="tile__meta">
                  {t.recetas} recetas{t.rangoEdad ? ` · ${t.rangoEdad}` : ""}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(255,255,255,0.95)",
                    color: "var(--color-ink)",
                    borderRadius: 999,
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  🔒 Regístrate
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <RegisterInvite
        open={open}
        onClose={() => setOpen(false)}
        returnTo={target}
        message="Los menús semanales son parte de tu cuenta. Prueba 30 días gratis, sin tarjeta."
      />
    </>
  );
}
