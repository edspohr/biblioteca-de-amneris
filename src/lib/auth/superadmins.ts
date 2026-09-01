// Solo edmundo@spohr.cl recibe el custom claim `superadmin` en su primer
// signin. Amneris (amnerispinto@gmail.com) se registra como usuaria regular
// para vivir el flow completo; Edmundo le otorga autoría después desde
// /admin/usuarios como walkthrough guiado. Agregar más correos aquí
// implica auto-grant en su primer login — hacerlo solo con instrucción
// explícita.
export const SUPERADMIN_EMAILS = ["edmundo@spohr.cl"] as const;

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPERADMIN_EMAILS.some((e) => e === normalized);
}
