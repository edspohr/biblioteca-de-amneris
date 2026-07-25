import Link from "next/link";
import { Fragment } from "react";

// Static server component. Renders a hardcoded chat transcript that
// showcases what the real in-app assistant can do. NO network calls —
// clicking anything sends the visitor to /login (hard-gated by middleware).

type Turn =
  | { role: "user"; text: string }
  | { role: "model"; body: ReactContent };

interface ReactContent {
  paragraphs: (string | { link: string; label: string })[][];
}

// Slugs verified against data/recetas/*.json and data/menus.json.
const CONVERSATION: Turn[] = [
  {
    role: "user",
    text: "¿Qué le doy a mi bebé de 8 meses si no puede lácteos?",
  },
  {
    role: "model",
    body: {
      paragraphs: [
        [
          "Perfecto, buscamos sin lácteos para etapa-1 (6-9 m). Estas dos son suaves y quedan cremosas con caldo en vez de leche:",
        ],
        [
          "• ",
          { link: "/recetas/pure-de-pollo-con-calabacin", label: "Puré de pollo con calabacín" },
          " — sin lácteos, textura fina, 20 min.",
        ],
        [
          "• ",
          { link: "/recetas/pure-de-salmon-con-batata", label: "Puré de salmón con batata" },
          " — dulzor natural de la batata, buen aporte de omega-3.",
        ],
        ["¿Quieres el paso a paso de alguna?"],
      ],
    },
  },
  {
    role: "user",
    text: "Mi hijo no come pollo, ¿con qué lo reemplazo en el almuerzo?",
  },
  {
    role: "model",
    body: {
      paragraphs: [
        [
          "Puedes cambiar el pollo por pavo, pescado blanco o legumbres — el libro tiene versiones para las tres opciones. Un ejemplo:",
        ],
        [
          "• ",
          { link: "/recetas/pure-de-pavo-con-calabacin-y-papa", label: "Puré de pavo con calabacín y papa" },
          " — misma textura del puré de pollo, sabor un poco más suave.",
        ],
        ["¿Te muestro más alternativas por edad?"],
      ],
    },
  },
  {
    role: "user",
    text: "Menú para toda la semana, tiene 10 meses",
  },
  {
    role: "model",
    body: {
      paragraphs: [
        [
          "Con 10 meses cae en etapa-2 (texturas graduadas). Tienes un menú semanal listo:",
        ],
        [
          "• ",
          { link: "/menus/etapa-2-semana-1-6", label: "Semana 1 — etapa 2" },
          " — desayunos, almuerzos, meriendas y cenas ya combinados.",
        ],
        [
          "Puedes ver la ",
          { link: "/menus/etapa-2-semana-1-6", label: "lista de compras derivada" },
          " agrupada por categoría del supermercado.",
        ],
      ],
    },
  },
];

function renderParagraph(parts: (string | { link: string; label: string })[]) {
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <Fragment key={i}>{p}</Fragment>
    ) : (
      <Link key={i} href={p.link} className="ask-book__link">
        {p.label}
      </Link>
    )
  );
}

export function AskTheBookSection() {
  return (
    <section
      id="asistente"
      className="ask-book"
      aria-labelledby="ask-book-title"
    >
      <div className="ask-book__inner">
        <div className="ask-book__intro">
          <p className="ask-book__eyebrow">Nuevo · con IA</p>
          <h2 id="ask-book-title" className="ask-book__title">
            Pregúntale al libro
          </h2>
          <p className="ask-book__lede">
            Un asistente entrenado sobre las 120 recetas del libro. Filtra por
            alergias, sugiere sustitutos, arma menús por edad, calcula listas
            de compras. Así se ve una conversación real:
          </p>
        </div>

        <div className="ask-book__widget card">
          <div className="ask-book__mockup-tag" aria-hidden="true">
            Ejemplo — así responde el asistente
          </div>
          <div className="ask-book__transcript" aria-label="Ejemplo de conversación">
            {CONVERSATION.map((turn, i) => (
              <div
                key={i}
                className={`ask-book__msg ask-book__msg--${turn.role}`}
              >
                {turn.role === "user" ? (
                  turn.text
                ) : (
                  <div>
                    {turn.body.paragraphs.map((p, j) => (
                      <p key={j} style={{ margin: j === 0 ? 0 : "0.4rem 0 0" }}>
                        {renderParagraph(p)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ask-book__gate">
            <p>
              <strong>Crea tu cuenta gratis</strong> para preguntarle al libro
              todas las veces que quieras.
            </p>
            <Link
              href="/login?mode=signup&reason=asistente"
              className="button button--primary"
            >
              Crear cuenta gratis
            </Link>
          </div>

          <p className="ask-book__meta">
            El asistente solo responde con recetas y menús del libro. No
            reemplaza el consejo del pediatra.
          </p>
        </div>
      </div>
    </section>
  );
}
