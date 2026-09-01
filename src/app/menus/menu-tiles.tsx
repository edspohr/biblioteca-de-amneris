"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { RegisterInvite } from "@/components/register-invite";
import { InlineInvite } from "@/components/inline-invite";

interface Tile {
  id: string;
  nombre: string;
  recetas: number;
  rangoEdad: string | undefined;
}

export function MenuTiles({
  tiles,
  hasFullAccess,
  showInlineInvite,
}: {
  tiles: Tile[];
  hasFullAccess: boolean;
  showInlineInvite?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  return (
    <>
      <ul className="grid tile-grid">
        {tiles.map((t, index) => {
          const href = `/menus/${t.id}`;
          const tileNode = hasFullAccess ? (
            <li key={t.id} className="tile tile--menu">
              <Link href={href} className="tile__link">
                <span className="tile__title">{t.nombre}</span>
                <span className="tile__meta">
                  {t.recetas} recetas{t.rangoEdad ? ` · ${t.rangoEdad}` : ""}
                </span>
              </Link>
            </li>
          ) : (
            <li key={t.id} className="tile tile--menu" data-locked="true">
              <button
                type="button"
                className="tile__link"
                onClick={() => {
                  setTarget(href);
                  setMessage(
                    `El menú «${t.nombre}» está en la biblioteca. Pruébalo gratis por 30 días, sin tarjeta.`
                  );
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
                aria-label={`Menú bloqueado: ${t.nombre}. Ábrelo para probar la biblioteca gratis.`}
              >
                <span className="tile__title">{t.nombre}</span>
                <span className="tile__meta">
                  {t.recetas} recetas{t.rangoEdad ? ` · ${t.rangoEdad}` : ""}
                </span>
                <span className="lock-badge" aria-hidden="true">
                  🔒
                </span>
              </button>
            </li>
          );

          const insertHere =
            !hasFullAccess &&
            showInlineInvite &&
            (index === 5 || (tiles.length <= 5 && index === tiles.length - 1));
          if (!insertHere) return tileNode;
          return (
            <Fragment key={`${t.id}-with-invite`}>
              {tileNode}
              <InlineInvite
                headline="Cada menú viene con lista de compras."
                body="Prueba la biblioteca gratis 30 días, sin tarjeta."
              />
            </Fragment>
          );
        })}
      </ul>
      <RegisterInvite
        open={open}
        onClose={() => setOpen(false)}
        returnTo={target}
        message={message}
      />
    </>
  );
}
