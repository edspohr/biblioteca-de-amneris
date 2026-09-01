import { redirect } from "next/navigation";

// /login redirects to /ingresar (the single auth entry point).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const qs = new URLSearchParams();
  if (next) qs.set("next", next);
  if (reason) qs.set("reason", reason);
  redirect(qs.toString() ? `/ingresar?${qs}` : "/ingresar");
}
