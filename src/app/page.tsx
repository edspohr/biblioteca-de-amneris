import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AUTHOR_NAME,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP,
  INSTAGRAM_HANDLE,
  LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import {
  BRAND_TAGLINE,
  NICHO_LABEL,
  SECCION_ACTIVA,
  SECCION_FUTURA,
  SECCION_PROXIMA,
} from "@/lib/marca";
import {
  ANNUAL_PRICE_CLP,
  ANNUAL_SAVINGS_MONTHS,
  MONTHLY_PRICE_CLP,
  formatCLP,
} from "@/lib/pricing";
import { verifySession } from "@/lib/auth/session";
import { LandingHeader } from "./landing-header";
import "../styles/landing.css";

// -- SEO ---------------------------------------------------------------------

const DESCRIPTION = BRAND_TAGLINE;

export const metadata: Metadata = {
  title: `${SITE_NAME} — recetas y planes para bebés de 0 a 2 años`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "es-CL": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: LOCALE,
    type: "website",
    images: [
      { url: "/biblioteca-logo.png", width: 1000, height: 1000, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ["/biblioteca-logo.png"],
  },
};

// -- Curated imagery ---------------------------------------------------------

const STORAGE_BASE =
  "https://storage.googleapis.com/biblioteca-amneris.firebasestorage.app/recetas";
const photo = (slug: string) => `${STORAGE_BASE}/${slug}/main.webp`;

const HERO_POLAROIDS: { slug: string; caption: string; className: string }[] = [
  {
    slug: "crema-de-calabaza-con-coco-y-jengibre-suave",
    caption: "cena tibia",
    className: "landing__polaroid--1",
  },
  {
    slug: "crema-de-remolacha-con-manzana",
    caption: "de rosa fuerte",
    className: "landing__polaroid--2",
  },
  {
    slug: "parfait-suave-de-yogur-con-mango-y-galleta-de-avena",
    caption: "merienda feliz",
    className: "landing__polaroid--3",
  },
];

const FAQ = [
  {
    q: "¿Qué es La Biblioteca de Amneris?",
    a: `Es un espacio con recursos de alimentación ${NICHO_LABEL}. Con una sola suscripción tienes acceso a todo lo que Amneris publica hoy y a cada nueva sección que se sume.`,
  },
  {
    q: "¿Cómo funciona la prueba gratis?",
    a: "Creas tu cuenta con Google, entras al recetario y tienes 30 días de acceso completo. No pedimos tarjeta ni datos de pago. Si al mes decides seguir, activas la suscripción; si no, tu cuenta queda como visitante y no se te cobra nada.",
  },
  {
    q: "¿Qué gano suscribiéndome?",
    a: `Acceso completo a toda la biblioteca: hoy la sección ${SECCION_ACTIVA.nombre}, y muy pronto ${SECCION_PROXIMA.nombre} y ${SECCION_FUTURA.nombre} sin pagar extra. Un mismo plan lo incluye todo.`,
  },
  {
    q: "¿Reemplaza al pediatra?",
    a: "No. Es una guía práctica hecha con cariño y método. Cualquier duda sobre alergias, síntomas o crecimiento — consulta siempre con un profesional de la salud.",
  },
  {
    q: "¿Cómo lo uso en el teléfono?",
    a: "Se abre en el navegador de tu celular. Puedes agregarlo a la pantalla de inicio para abrirlo con un toque. Las recetas están pensadas para leerse con una mano mientras cocinas.",
  },
];

// -- Landing page ------------------------------------------------------------

export default async function LandingPage() {
  const user = await verifySession();
  const isLogged = Boolean(user);
  return (
    <div className="landing">
      <SchemaOrgLD />
      <LandingHeader isLogged={isLogged} />
      <Hero isLogged={isLogged} />
      <SeccionActiva />
      <Proximamente />
      <Precios />
      <SobreAmneris />
      <FAQSection />
      <FinalCTA isLogged={isLogged} />
      <Footer />
    </div>
  );
}

function Hero({ isLogged }: { isLogged: boolean }) {
  return (
    <section className="landing__hero">
      <div className="landing__container landing__hero-inner">
        <div>
          <p className="landing__eyebrow">Alimentación 0 a 2 años</p>
          <h1 className="landing__h1">
            Alimentar a tu bebé, <em>resuelto</em>. Desde los 0 hasta los 2
            años.
          </h1>
          <p className="landing__lede">
            La Biblioteca de Amneris reúne recetas, menús y planes que resuelven
            el día a día {NICHO_LABEL}. Una sola suscripción, todo incluido —
            hoy y cuando se sumen nuevas secciones.
          </p>
          <ul className="landing__pills" aria-label="Características">
            <li className="landing__pill">Sin azúcar añadida</li>
            <li className="landing__pill">Textura y porción por edad</li>
            <li className="landing__pill">Menús con lista de compras</li>
            <li className="landing__pill">30 días gratis, sin tarjeta</li>
          </ul>
          <div className="landing__cta-buttons">
            {isLogged ? (
              <Link
                href="/libro"
                className="landing__button landing__button--dark"
              >
                Entrar a la biblioteca
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="landing__button landing__button--dark"
                >
                  Pruébala gratis 30 días
                </Link>
                <Link
                  href="/ingresar"
                  className="landing__button landing__button--ghost"
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="landing__collage" aria-hidden="true">
          {HERO_POLAROIDS.map((p) => (
            <div key={p.slug} className={`landing__polaroid ${p.className}`}>
              <Image
                src={photo(p.slug)}
                alt=""
                width={220}
                height={220}
                priority
              />
              <div className="landing__polaroid-caption">{p.caption}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeccionActiva() {
  return (
    <section className="landing__method" id="activa">
      <div className="landing__container">
        <p className="landing__eyebrow">Sección disponible hoy</p>
        <h2 className="landing__section-title">
          <em>{SECCION_ACTIVA.nombre}</em> — {SECCION_ACTIVA.bajada}.
        </h2>
        <p className="landing__section-lede">{SECCION_ACTIVA.problema}</p>
        <div className="landing__cta-buttons">
          <Link href="/recetas" className="landing__button landing__button--dark">
            Explorar recetas
          </Link>
          <Link href="/menus" className="landing__button landing__button--ghost">
            Ver menús semanales
          </Link>
        </div>
      </div>
    </section>
  );
}

function Proximamente() {
  const items = [SECCION_PROXIMA, SECCION_FUTURA];
  return (
    <section className="landing__adentro" id="proximamente">
      <div className="landing__container">
        <p className="landing__eyebrow">Próximamente en tu biblioteca</p>
        <h2 className="landing__section-title">
          Cada lanzamiento entra en la <em>misma</em> suscripción.
        </h2>
        <p className="landing__section-lede">
          Suscribirte hoy es suscribirte a todo lo que venga. No hay compras
          por sección ni upgrades: si eres parte de la biblioteca, es tuyo.
        </p>
        <ul className="landing__filters">
          {items.map((s) => (
            <li key={s.id} className="landing__filter">
              <div className="landing__filter-num">{s.lanzamientoLabel}</div>
              <h3>{s.nombre}</h3>
              <p>{s.problema}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Precios() {
  const mensualLabel = formatCLP(MONTHLY_PRICE_CLP);
  const anualLabel = formatCLP(ANNUAL_PRICE_CLP);
  return (
    <section className="landing__cta" id="precios">
      <div className="landing__container">
        <p className="landing__eyebrow">Precios</p>
        <h2>Un plan, toda la biblioteca.</h2>
        <p>
          Empieza con <strong>30 días gratis, sin tarjeta</strong>. Al cabo del
          mes eliges cómo seguir.
        </p>
        <ul className="landing__plans" aria-label="Planes">
          <li className="landing__plan">
            <p className="landing__plan-name">Mensual</p>
            <p className="landing__plan-price">
              {mensualLabel} <small>al mes</small>
            </p>
            <p className="landing__plan-desc">
              Empieza cuando quieras, pausa cuando quieras.
            </p>
          </li>
          <li className="landing__plan landing__plan--featured">
            <span className="landing__plan-badge">
              Ahorra {ANNUAL_SAVINGS_MONTHS} meses
            </span>
            <p className="landing__plan-name">Anual</p>
            <p className="landing__plan-price">
              {anualLabel} <small>al año</small>
            </p>
            <p className="landing__plan-desc">
              Un solo cargo, toda la biblioteca por 12 meses.
            </p>
          </li>
        </ul>
        <div className="landing__cta-buttons">
          <Link href="/registro" className="landing__button landing__button--primary">
            Comenzar prueba gratis
          </Link>
          <Link href="/ingresar" className="landing__button landing__button--ghost">
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

function SobreAmneris() {
  return (
    <section className="landing__manifesto" id="autora">
      <div className="landing__container landing__manifesto-inner">
        <figure className="landing__portrait">
          <Image
            src="/amneris.jpeg"
            alt="Amneris, autora de la biblioteca"
            width={800}
            height={1000}
            className="landing__portrait-img"
          />
        </figure>
        <div>
          <p className="landing__eyebrow">La autora</p>
          <h2 className="landing__section-title">
            Soy <em>Amneris</em>.
          </h2>
          {/* TODO(Amneris): revisar y ajustar bio con tus palabras. */}
          <p>
            Soy mamá antes que nada, y la cocina de mi casa fue el primer lugar
            donde este proyecto tomó forma. Cociné cada receta para mis propias
            hijas — probando texturas, midiendo porciones, anotando lo que
            funcionaba y lo que no.
          </p>
          <p>
            Vengo de una familia donde la comida era el modo natural de
            cuidarnos. Esta biblioteca es esa misma tradición, ordenada para
            que cualquier mamá o papá pueda apoyarse en ella cuando el día
            aprieta.
          </p>
          <p className="landing__note">
            Esta guía no reemplaza a tu pediatra. Ante cualquier duda sobre
            alergias, síntomas o crecimiento, consulta siempre con un
            profesional.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="landing__faq" id="faq">
      <div className="landing__container">
        <p className="landing__eyebrow">Preguntas frecuentes</p>
        <h2 className="landing__section-title">Lo que suelen preguntar.</h2>
        {CONTACT_EMAIL ? (
          <p className="landing__section-lede">
            ¿Falta algo?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>Escríbenos</a>.
          </p>
        ) : null}
        <div className="landing__faq-list">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ isLogged }: { isLogged: boolean }) {
  return (
    <section className="landing__cta">
      <div className="landing__container">
        <h2>Empieza esta semana.</h2>
        <p>
          Crea tu cuenta con Google, entra a la biblioteca y prueba 30 días sin
          pagar. Si te sirve, sigues con {formatCLP(MONTHLY_PRICE_CLP)} al mes.
        </p>
        <div className="landing__cta-buttons">
          {isLogged ? (
            <Link href="/libro" className="landing__button landing__button--primary">
              Entrar a la biblioteca
            </Link>
          ) : (
            <>
              <Link href="/registro" className="landing__button landing__button--primary">
                Pruébala gratis 30 días
              </Link>
              <Link href="/ingresar" className="landing__button landing__button--ghost">
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const igUrl = INSTAGRAM_HANDLE
    ? `https://instagram.com/${INSTAGRAM_HANDLE}`
    : null;
  const waUrl = CONTACT_WHATSAPP
    ? `https://wa.me/${CONTACT_WHATSAPP.replace(/[^\d]/g, "")}`
    : null;
  return (
    <footer className="landing__footer">
      <div className="landing__footer-inner">
        <div>
          <h4>{SITE_NAME}</h4>
          <p>{BRAND_TAGLINE}</p>
          <p className="landing__footer-cta">
            <Link href="/libro" className="landing__footer-link">
              Entrar a la biblioteca →
            </Link>
          </p>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            {waUrl && (
              <li>
                <a href={waUrl} target="_blank" rel="noreferrer noopener">
                  WhatsApp
                </a>
              </li>
            )}
            {igUrl && (
              <li>
                <a href={igUrl} target="_blank" rel="noreferrer noopener">
                  Instagram
                </a>
              </li>
            )}
            {CONTACT_EMAIL && (
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
            )}
            {!waUrl && !igUrl && !CONTACT_EMAIL && (
              <li className="landing__footer-soon">Próximamente</li>
            )}
          </ul>
        </div>
        <div>
          <h4>La biblioteca</h4>
          <ul>
            <li>
              <Link href="/recetas">Recetas</Link>
            </li>
            <li>
              <Link href="/menus">Menús</Link>
            </li>
            <li>
              <Link href="/tecnicas">Técnicas</Link>
            </li>
            <li>
              <Link href="/privacidad">Privacidad</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="landing__disclaimer landing__container">
        La Biblioteca de Amneris es una guía general y no reemplaza el consejo
        médico profesional. Ante cualquier duda sobre la alimentación de tu
        bebé — reacciones, alergias, crecimiento — consulta siempre con un
        pediatra.
      </p>
    </footer>
  );
}

function SchemaOrgLD() {
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: LOCALE,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      founder: { "@type": "Person", name: AUTHOR_NAME },
      description: DESCRIPTION,
      url: SITE_URL,
    },
  ];
  const payload = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
