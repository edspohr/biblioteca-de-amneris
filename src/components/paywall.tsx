import Image from "next/image";
import Link from "next/link";
import { MONTHLY_PRICE_CLP, formatCLP } from "@/lib/pricing";

interface Props {
  titulo: string;
  eyebrow?: string;
  foto?: string | null;
  returnTo: string;
  isExpired?: boolean;
}

/**
 * Wall shown when a non-preview recipe or menu detail is opened by an
 * anonymous or trial-expired user. Keeps the surface warm: shows the photo
 * (blurred), gives context on what's behind the wall, offers a single
 * primary CTA.
 */
export function Paywall({ titulo, eyebrow, foto, returnTo, isExpired }: Props) {
  const registro = `/registro?next=${encodeURIComponent(returnTo)}`;
  const ingresar = `/ingresar?next=${encodeURIComponent(returnTo)}`;
  return (
    <article className="paywall" style={{ maxWidth: 620, margin: "0 auto" }}>
      <p className="receta__back">
        <Link href="/recetas">← Todas las recetas</Link>
      </p>

      <header className="receta__hero">
        {foto ? (
          <div className="receta__photo" style={{ filter: "blur(14px)" }}>
            <Image src={foto} alt="" fill sizes="(max-width: 640px) 100vw, 480px" priority />
          </div>
        ) : null}
        <div className="receta__hero-body">
          {eyebrow && <p className="receta__eyebrow">{eyebrow}</p>}
          <h1 className="receta__title">{titulo}</h1>
        </div>
      </header>

      <section
        className="card"
        style={{
          padding: "1.5rem",
          marginTop: "1rem",
          textAlign: "center",
          display: "grid",
          gap: "0.75rem",
        }}
      >
        <p style={{ fontSize: "1.05rem", margin: 0 }}>
          {isExpired ? (
            <>«{titulo}» está guardada esperándote en la biblioteca.</>
          ) : (
            <>«{titulo}» te espera dentro de la biblioteca.</>
          )}
        </p>
        <p style={{ margin: 0, color: "var(--color-ink-muted)" }}>
          {isExpired ? (
            <>Muy pronto podrás suscribirte por {formatCLP(MONTHLY_PRICE_CLP)} al mes y volver a tenerlo todo, incluidas las próximas secciones.</>
          ) : (
            <>Pruébala gratis por 30 días — sin tarjeta, sin compromiso.</>
          )}
        </p>
        <Link
          href={isExpired ? "/cuenta" : registro}
          className="button button--primary"
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          {isExpired ? "Ver mi cuenta" : "Pruébala gratis 30 días"}
        </Link>
        {!isExpired && (
          <Link href={ingresar} style={{ fontSize: "0.9rem" }}>
            Ya tengo cuenta
          </Link>
        )}
      </section>
    </article>
  );
}
