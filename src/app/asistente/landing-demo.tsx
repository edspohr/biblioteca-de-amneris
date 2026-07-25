"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const DEMO_LIMIT = 3;

const SUGGESTIONS = [
  "¿Qué le doy a mi bebé de 8 meses sin gluten?",
  "Menú para toda la semana",
  "Sustitutos si no come pollo",
  "Recetas rápidas con zapallo",
];

interface Turn {
  role: "user" | "model";
  text: string;
  pending?: boolean;
}

export function AskTheBookSection() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const asked = turns.filter((t) => t.role === "user").length;

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || sending || gated) return;
    setError(null);
    setInput("");
    setTurns((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "model", text: "", pending: true },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-asistente-mode": "landing-demo",
        },
        body: JSON.stringify({
          sessionId: "landing-demo-anon-xxxxxx",
          question: q,
          history: [],
        }),
      });

      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          gate?: string;
        };
        setTurns((prev) => prev.filter((t) => !t.pending && t !== prev[prev.length - 2]));
        setGated(true);
        setError(data.error ?? "Ya usaste tus 3 preguntas gratis.");
        return;
      }
      if (!res.ok || !res.body) throw new Error("No se pudo enviar. Intenta de nuevo.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const raw of parts) {
          const lines = raw.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          let payload: unknown;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }
          if (event === "text") {
            const chunk = (payload as { text?: string }).text ?? "";
            acc += chunk;
            setTurns((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "model", text: acc, pending: true };
              return next;
            });
          } else if (event === "done") {
            const p = payload as { finalText?: string; remainingDemo?: number };
            setTurns((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "model",
                text: p.finalText || acc,
              };
              return next;
            });
            if (typeof p.remainingDemo === "number") {
              setRemaining(p.remainingDemo);
              if (p.remainingDemo <= 0) setGated(true);
            }
          } else if (event === "error") {
            const p = payload as { text?: string };
            throw new Error(p.text || "Algo falló.");
          }
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Algo falló.");
      setTurns((prev) => prev.filter((t) => !t.pending));
    } finally {
      setSending(false);
      // Scroll to bottom of the transcript so latest reply is visible.
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  const remainingText =
    remaining !== null
      ? `Te quedan ${remaining} de ${DEMO_LIMIT} preguntas gratis.`
      : `Prueba gratis — ${DEMO_LIMIT} preguntas sin cuenta.`;

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
            Menús personalizados, sustitutos por alergias, ideas rápidas —
            Amneris respondiendo con recetas reales del libro.
          </p>
        </div>

        <div className="ask-book__widget card">
          <div className="ask-book__chips" role="list">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                role="listitem"
                className="ask-book__chip"
                onClick={() => void send(s)}
                disabled={sending || gated}
              >
                {s}
              </button>
            ))}
          </div>

          {turns.length > 0 && (
            <div className="ask-book__transcript" ref={scrollRef}>
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={`ask-book__msg ask-book__msg--${t.role}`}
                  data-pending={t.pending ? "true" : undefined}
                >
                  {t.text ||
                    (t.pending ? (
                      <span className="ask-book__typing">•••</span>
                    ) : null)}
                </div>
              ))}
            </div>
          )}

          {gated ? (
            <div className="ask-book__gate">
              <p>
                <strong>Ya viste cómo funciona.</strong>{" "}
                Crea tu cuenta gratis para seguir preguntándole al libro sin
                límite.
              </p>
              <Link
                href="/login?mode=signup&reason=asistente&next=/libro"
                className="button button--primary"
              >
                Crear cuenta gratis
              </Link>
            </div>
          ) : (
            <form
              className="ask-book__form"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Escribe tu pregunta…"
                rows={2}
                maxLength={500}
                disabled={sending}
                aria-label="Pregunta para el asistente"
              />
              <button
                type="submit"
                className="button button--primary"
                disabled={sending || !input.trim()}
              >
                {sending ? "…" : "Preguntar"}
              </button>
            </form>
          )}

          <p className="ask-book__meta">
            {remainingText} No reemplaza el consejo del pediatra.
            {asked > 0 && !gated && (
              <>
                {" · "}
                <Link href="/login?mode=signup&next=/libro">
                  Crea tu cuenta
                </Link>{" "}
                para preguntar sin límite.
              </>
            )}
          </p>

          {error && !gated && (
            <p className="ask-book__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
