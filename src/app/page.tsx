import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AUTHOR_NAME,
  BOOK_TITLE,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP,
  INSTAGRAM_HANDLE,
  LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import "../styles/landing.css";

// -- SEO ---------------------------------------------------------------------

const DESCRIPTION =
  "Un libro vivo de alimentación complementaria para bebés de 6 a 24 meses. Recetas escritas por Amneris, con textura y porción por etapa, listas de compras derivadas y fotos de cada preparación. Gratis y en español.";

export const metadata: Metadata = {
  title: `${BOOK_TITLE} — ${SITE_NAME}`,
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
    title: `${BOOK_TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: LOCALE,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: BOOK_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BOOK_TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    images: ["/og.png"],
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

const GALLERY: { slug: string; caption: string; rot: string }[] = [
  { slug: "compota-de-mango-con-coco", caption: "dulce de temporada", rot: "-3deg" },
  { slug: "pure-de-aguacate-con-lima", caption: "verde de aguacate", rot: "2deg" },
  { slug: "crema-de-brocoli-con-aceite-de-oliva", caption: "brócoli suave", rot: "-1deg" },
  { slug: "yogur-con-compota-de-frambuesa", caption: "yogur con fruta", rot: "3deg" },
  { slug: "pure-de-salmon-con-batata", caption: "salmón + batata", rot: "-2deg" },
  { slug: "mini-muffins-de-avena-y-zanahoria", caption: "muffins de avena", rot: "1deg" },
];

const FILTERS = [
  {
    n: "01",
    title: "Textura por etapa",
    body: "Cada receta tiene tres versiones. Cambian la textura y la porción según la edad del bebé — nunca los ingredientes.",
  },
  {
    n: "02",
    title: "Sin azúcar añadida",
    body: "El sabor viene de fruta madura, especias suaves y hortalizas dulces. Nada de azúcar refinada.",
  },
  {
    n: "03",
    title: "Ingredientes de supermercado",
    body: "Todo se compra en un almacén común. Sin superalimentos importados ni tiendas especializadas.",
  },
  {
    n: "04",
    title: "Alérgenos etiquetados",
    body: "Cada receta declara sus alérgenos y puedes filtrar el catálogo para excluir los que te preocupan.",
  },
  {
    n: "05",
    title: "Listas de compras derivadas",
    body: "Elige un menú y la lista de compras se calcula sola, agrupada por categoría del supermercado.",
  },
  {
    n: "06",
    title: "Foto de cada receta",
    body: "Todas las 120 recetas tienen foto, para saber a qué aspira el plato antes de empezar.",
  },
];

const FAQ = [
  {
    q: "¿Es gratis?",
    a: "Sí, totalmente. El libro está disponible en línea sin costo. Si más adelante ofrecemos algo pagado, quedará muy claro qué es y qué no.",
  },
  {
    q: "¿Para qué edades sirve?",
    a: "Está pensado para bebés de 6 a 24 meses, cubriendo las tres etapas de la alimentación complementaria: purés lisos, texturas graduadas y comidas familiares adaptadas.",
  },
  {
    q: "¿Cómo lo uso en el teléfono?",
    a: "El sitio funciona en el navegador de tu celular como si fuera una app. Puedes agregarlo a la pantalla de inicio para abrirlo con un toque. Las recetas están pensadas para leerse con una mano mientras cocinas.",
  },
  {
    q: "¿Puedo compartirlo con otras mamás?",
    a: "Sí, por favor. El objetivo es que llegue lejos. Comparte el enlace por WhatsApp o donde te acomode.",
  },
  {
    q: "¿Va a haber más libros?",
    a: "Hoy es un libro. Si en el futuro hay otros títulos, los anunciaremos aquí — no prometemos calendario ni volumen.",
  },
];

// -- Landing page ------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="landing">
      <SchemaOrgLD />
      <Header />
      <Hero />
      <Marquee />
      <Manifesto />
      <Method />
      <Adentro />
      <Gallery />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="landing__header">
      <div className="landing__header-inner">
        <Link href="/" className="landing__brand">
          {BOOK_TITLE}
          <small>por {AUTHOR_NAME}</small>
        </Link>
        <nav className="landing__nav" aria-label="Secciones">
          <a href="#autora">Autora</a>
          <a href="#metodo">Método</a>
          <a href="#galeria">Galería</a>
          <a href="#faq">Preguntas</a>
        </nav>
        <div className="landing__header-cta">
          <Link href="/libro" className="landing__button landing__button--dark">
            Entrar al recetario
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="landing__hero">
      <div className="landing__container landing__hero-inner">
        <div>
          <p className="landing__eyebrow">Hecho a mano, con paciencia</p>
          <h1 className="landing__h1">
            Alimenta a tu hijo con bases tan <em>sólidas</em> como cocinó
            Amneris para las suyas.
          </h1>
          <p className="landing__lede">
            Un libro vivo de alimentación complementaria para bebés de 6 a 24
            meses. Cada receta viene en tres versiones — solo cambia la textura
            y la porción según la etapa.
          </p>
          <div className="landing__cta-buttons">
            <Link
              href="/login?mode=signup"
              className="landing__button landing__button--dark"
            >
              Crea tu cuenta gratis
            </Link>
            <Link
              href="/libro"
              className="landing__button landing__button--ghost"
              style={{ color: "var(--color-brand-ink)", borderColor: "var(--color-brand-ink)" }}
            >
              Entrar al recetario
            </Link>
          </div>
          <ul className="landing__pills" aria-label="Características">
            <li className="landing__pill">6 a 24 meses</li>
            <li className="landing__pill">120 recetas con foto</li>
            <li className="landing__pill">Sistema editorial</li>
            <li className="landing__pill">Gratis</li>
          </ul>
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

function Marquee() {
  const items = [
    "Sin azúcar añadida",
    "Ingredientes de supermercado",
    "Variantes por etapa",
    "Listas de compras derivadas",
    "Fotos de cada receta",
    "Alérgenos etiquetados",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="landing__marquee" aria-hidden="true">
      <div className="landing__marquee-track">
        {doubled.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Manifesto() {
  return (
    <section className="landing__manifesto" id="autora">
      <div className="landing__container landing__manifesto-inner">
        <div className="landing__portrait" aria-hidden="true">
          Amneris
        </div>
        <div>
          <p className="landing__eyebrow">La autora</p>
          <h2 className="landing__section-title">
            Soy <em>Amneris</em>.
          </h2>
          <p>
            Soy ingeniera, madre, y creadora de este sistema. Este libro nació
            en mi cocina, alimentando a mi propia hija, y creció con la disciplina
            de quien está acostumbrada a que las estructuras se sostengan por
            razones, no por intuición.
          </p>
          <p>
            Cada receta pasó por los mismos filtros: ingredientes accesibles,
            textura correcta para la etapa, sin azúcar añadida, con foto real,
            y con la alérgeno declarada. Nada llega al libro sin cumplir la
            lista.
          </p>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>
            El libro no reemplaza a tu pediatra. Cualquier duda sobre
            alimentación específica, alergia, o reacción del bebé — consultar
            siempre con un profesional.
          </p>
        </div>
      </div>
    </section>
  );
}

function Method() {
  return (
    <section className="landing__method" id="metodo">
      <div className="landing__container">
        <p className="landing__eyebrow">El método</p>
        <h2 className="landing__section-title">
          Seis filtros que <em>toda</em> receta cumple.
        </h2>
        <p style={{ color: "var(--color-ink-muted)", maxWidth: "48ch" }}>
          Esto no es un blog de recetas. Es un sistema editorial: cada plato
          pasa por seis filtros antes de entrar al libro, y ninguno se salta.
        </p>
        <ol className="landing__filters">
          {FILTERS.map((f) => (
            <li key={f.n} className="landing__filter">
              <div className="landing__filter-num">{f.n}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Adentro() {
  return (
    <section className="landing__adentro">
      <div className="landing__container landing__adentro-inner">
        <div>
          <p className="landing__eyebrow">Adentro del libro</p>
          <h2 className="landing__section-title">
            Diseñado para leer con <em>una mano</em>, mientras cocinas.
          </h2>
          <p>
            El recetario se abre en el navegador de tu celular. Cada receta
            muestra: ingredientes escaneables, pasos grandes numerados, el
            tiempo, si es congelable, sus alérgenos, y la variante que
            corresponde a la etapa que hayas elegido.
          </p>
          <p>
            Los menús semanales generan una lista de compras derivada,
            agrupada por categoría del supermercado.
          </p>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/libro" className="landing__button landing__button--dark">
              Abrir el recetario
            </Link>
          </div>
        </div>
        <div className="landing__device" aria-hidden="true">
          <Image
            src={photo("crema-de-calabaza-con-coco-y-jengibre-suave")}
            alt=""
            width={320}
            height={568}
            style={{ objectPosition: "center" }}
          />
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="landing__gallery" id="galeria">
      <div className="landing__container">
        <p className="landing__eyebrow">Un vistazo</p>
        <h2 className="landing__section-title">
          Cada receta tiene su <em>foto</em>.
        </h2>
        <ul className="landing__scraps">
          {GALLERY.map((g) => (
            <li
              key={g.slug}
              className="landing__scrap"
              style={{ ["--rot" as string]: g.rot }}
            >
              <Image src={photo(g.slug)} alt="" width={320} height={320} />
              <div className="landing__scrap-caption">{g.caption}</div>
            </li>
          ))}
        </ul>
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

function FinalCTA() {
  return (
    <section className="landing__cta">
      <div className="landing__container">
        <h2>Empieza esta semana.</h2>
        <p>
          Crea tu cuenta gratis y accede al recetario completo desde tu
          teléfono o computadora.
        </p>
        <div className="landing__cta-buttons">
          <Link href="/login?mode=signup" className="landing__button landing__button--primary">
            Crea tu cuenta gratis
          </Link>
          <Link href="/libro" className="landing__button landing__button--ghost">
            Solo dar un vistazo
          </Link>
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
          <p>Un libro vivo de alimentación complementaria, escrito por Amneris.</p>
          <p style={{ marginTop: "0.75rem" }}>
            <Link href="/libro">Entrar al recetario →</Link>
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
              <li style={{ color: "rgba(255,255,255,0.55)" }}>Próximamente</li>
            )}
          </ul>
        </div>
        <div>
          <h4>El libro</h4>
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
          </ul>
        </div>
      </div>
      <p
        className="landing__disclaimer landing__container"
        style={{ maxWidth: "var(--lp-max)" }}
      >
        Este libro es una guía general, no un reemplazo del consejo médico
        profesional. Cualquier duda o inquietud sobre la alimentación de tu
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
      "@type": "Book",
      "@id": `${SITE_URL}/#book`,
      name: BOOK_TITLE,
      inLanguage: LOCALE,
      author: { "@type": "Person", name: AUTHOR_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME },
      description: DESCRIPTION,
      audience: {
        "@type": "PeopleAudience",
        suggestedMinAge: 0.5,
        suggestedMaxAge: 2,
      },
      isAccessibleForFree: true,
      url: `${SITE_URL}/libro`,
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
