import Link from "next/link";

interface Props {
  headline: string;
  body?: string;
  cta?: string;
  href?: string;
}

/**
 * Tarjeta de invitación cálida que se inserta dentro de una grilla de
 * contenidos bloqueados. Se muestra a lo sumo una vez por grilla.
 */
export function InlineInvite({
  headline,
  body = "Prueba 30 días gratis, sin tarjeta.",
  cta = "Pruébala gratis",
  href = "/registro",
}: Props) {
  return (
    <li
      className="card inline-invite"
      role="note"
      aria-label="Invitación a probar la biblioteca gratis"
    >
      <p className="inline-invite__headline">{headline}</p>
      <p className="inline-invite__body">{body}</p>
      <Link href={href} className="button button--primary inline-invite__cta">
        {cta}
      </Link>
    </li>
  );
}
