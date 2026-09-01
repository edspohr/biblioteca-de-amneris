import { redirect } from "next/navigation";

// /registro se unificó con /ingresar en una sola ruta neutral. Este stub
// preserva backwards-compat con enlaces existentes (Instagram, mails, etc.).
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/")
    ? `/ingresar?next=${encodeURIComponent(next)}`
    : "/ingresar";
  redirect(target);
}
