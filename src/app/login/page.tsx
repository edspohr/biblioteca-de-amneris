import { redirect } from "next/navigation";

// The old /login (Google-only) got renamed to /ingresar to make room for
// email/password + the pair /registro + /ingresar. This shim keeps any
// previously shared link working.
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
