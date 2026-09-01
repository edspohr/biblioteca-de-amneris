import Link from "next/link";
import { getSessionWithProfile } from "@/lib/auth/session";
import { MONTHLY_PRICE_CLP, formatCLP } from "@/lib/pricing";

const TRIAL_WARNING_DAYS = 7;

/**
 * Renders a warm banner at the top of the reader when:
 *  - user is on trial with ≤7 days left, OR
 *  - user's trial (or cortesía) has expired.
 * Returns null in every other case (anon, active, plenty-of-trial-left).
 */
export async function TrialBanner() {
  const ctx = await getSessionWithProfile();
  if (!ctx) return null;
  const { access } = ctx;

  if (access.tier === "trial" && access.daysLeft !== null && access.daysLeft <= TRIAL_WARNING_DAYS) {
    return (
      <BannerShell tone="warm">
        Te quedan <strong>{access.daysLeft} día{access.daysLeft === 1 ? "" : "s"}</strong> de prueba.
        Muy pronto podrás suscribirte por {formatCLP(MONTHLY_PRICE_CLP)} al mes y seguir sin
        interrupciones.{" "}
        <Link href="/cuenta">Ver mi cuenta</Link>
      </BannerShell>
    );
  }

  if (access.tier === "vencida") {
    return (
      <BannerShell tone="soft">
        Tu período de prueba terminó. Puedes seguir explorando las recetas
        gratuitas y muy pronto podrás suscribirte por {formatCLP(MONTHLY_PRICE_CLP)} al mes.{" "}
        <Link href="/cuenta">Ver mi cuenta</Link>
      </BannerShell>
    );
  }

  return null;
}

function BannerShell({
  tone,
  children,
}: {
  tone: "warm" | "soft";
  children: React.ReactNode;
}) {
  const bg = tone === "warm" ? "#FFEAD0" : "#F1EBFA";
  const ink = tone === "warm" ? "#7A4321" : "#4A3771";
  return (
    <div
      role="status"
      style={{
        background: bg,
        color: ink,
        padding: "0.65rem 1rem",
        textAlign: "center",
        fontSize: "0.92rem",
      }}
    >
      {children}
    </div>
  );
}
