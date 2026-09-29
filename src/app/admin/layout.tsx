import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession, AUTH_BYPASS_ENABLED } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";
import { AdminNav } from "./admin-nav";
import "../../styles/admin.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!user.superadmin) {
    redirect("/sin-permiso");
  }
  return (
    <div className="admin">
      <div className="admin-banner" data-demo={AUTH_BYPASS_ENABLED || undefined}>
        {AUTH_BYPASS_ENABLED ? (
          <span>
            <strong>Modo demo.</strong> Puedes explorar todo el editor libremente,
            pero los cambios que guardes no se aplicarán todavía.
          </span>
        ) : (
          <span>
            <strong>Panel de autoría</strong> · {user.name || user.email || user.uid}
          </span>
        )}
        <span className="admin-banner__actions">
          <Link href="/libro" className="admin-banner__link">
            Ver como lectora ↗
          </Link>
          {!AUTH_BYPASS_ENABLED && <LogoutButton />}
        </span>
      </div>
      <div className="admin-shell">
        <AdminNav />
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
