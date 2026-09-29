"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped admin navigation. Sidebar on desktop, a horizontal scroller on
// phones. The active item is derived from the path so nested editors
// (/admin/recetas/x/editar) keep their section highlighted.

const GRUPOS: { titulo: string; links: { href: string; label: string; icon: string }[] }[] = [
  {
    titulo: "",
    links: [{ href: "/admin", label: "Inicio", icon: "🏠" }],
  },
  {
    titulo: "Contenido",
    links: [
      { href: "/admin/colecciones", label: "Colecciones", icon: "📚" },
      { href: "/admin/recetas", label: "Recetas", icon: "🥣" },
      { href: "/admin/menus", label: "Menús", icon: "🗓" },
      { href: "/admin/guias", label: "Guías", icon: "📖" },
    ],
  },
  {
    titulo: "Catálogos",
    links: [
      { href: "/admin/ingredientes", label: "Ingredientes", icon: "🥕" },
      { href: "/admin/alergenos", label: "Alérgenos", icon: "⚠️" },
      { href: "/admin/tecnicas", label: "Técnicas", icon: "🔪" },
      { href: "/admin/utensilios", label: "Utensilios", icon: "🍳" },
      { href: "/admin/metodos-conservacion", label: "Conservación", icon: "🧊" },
    ],
  },
  {
    titulo: "Personas",
    links: [{ href: "/admin/usuarios", label: "Usuarios", icon: "👥" }],
  },
  {
    titulo: "",
    links: [{ href: "/admin/ayuda", label: "Ayuda", icon: "💬" }],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="admin-nav" aria-label="Panel de autoría">
      {GRUPOS.map((g, i) => (
        <div key={g.titulo || i} className="admin-nav__group">
          {g.titulo && <p className="admin-nav__title">{g.titulo}</p>}
          <ul>
            {g.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="admin-nav__link"
                  aria-current={isActive(l.href) ? "page" : undefined}
                >
                  <span aria-hidden="true" className="admin-nav__icon">
                    {l.icon}
                  </span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
