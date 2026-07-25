export const SUPERADMIN_EMAILS = [
  "amnerispinto@gmail.com",
  "edmundo@spohr.cl",
] as const;

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPERADMIN_EMAILS.some((e) => e === normalized);
}
