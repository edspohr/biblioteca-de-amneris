"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getAppCheckToken } from "@/lib/firebase/client";

const SESSION_STORAGE_KEY = "bocaditos_asistente_session_v1";

// Paths where the widget should NOT render even if the user is logged in.
const HIDDEN_PREFIXES = ["/admin", "/login", "/sin-permiso"];

interface Message {
  role: "user" | "model";
  text: string;
  pending?: boolean;
  toolsInvoked?: string[];
}

function makeSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const arr = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 20; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 20; i++) s += chars[arr[i] % chars.length];
  return s;
}

export function AsistenteWidget({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = makeSessionId();
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    sessionIdRef.current = sid;
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  if (!enabled) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setError(null);
    setInput("");
    const history = messages
      .filter((m) => !m.pending)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "model", text: "", pending: true },
    ]);
    setSending(true);

    try {
      const appCheckToken = await getAppCheckToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          question: q,
          history,
        }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || "Alcanzaste el límite. Prueba más tarde.");
        }
        throw new Error("No se pudo enviar. Intenta de nuevo.");
      }
      if (!res.body) throw new Error("Respuesta vacía.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let toolsInvoked: string[] = [];

      // Simple SSE parser: split on double newline, parse `event:` + `data:`.
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
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "model",
                text: acc,
                pending: true,
                toolsInvoked,
              };
              return next;
            });
          } else if (event === "tool") {
            toolsInvoked = [...toolsInvoked, (payload as { name: string }).name];
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                toolsInvoked,
              };
              return next;
            });
          } else if (event === "done") {
            const p = payload as {
              finalText: string;
              toolsInvoked?: string[];
              citedSlugs?: string[];
            };
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "model",
                text: p.finalText || acc,
                toolsInvoked: p.toolsInvoked ?? toolsInvoked,
              };
              return next;
            });
          } else if (event === "error") {
            const p = payload as { text?: string };
            throw new Error(p.text || "Algo falló.");
          }
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Algo falló.");
      setMessages((prev) => prev.filter((m) => !m.pending));
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="asistente__bubble"
          aria-label="Abrir asistente"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">✽</span>
          <span className="asistente__bubble-label">Pregunta al libro</span>
        </button>
      )}
      {open && (
        <div
          className="asistente__panel"
          role="dialog"
          aria-label="Asistente del libro"
        >
          <header className="asistente__header">
            <div>
              <strong>Asistente</strong>
              <div className="asistente__sub">
                Te ayudo a encontrar recetas y menús de este libro.
              </div>
            </div>
            <button
              type="button"
              className="asistente__close"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>
          <div className="asistente__scroll" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="asistente__welcome">
                <p>Hola 👋. Prueba con:</p>
                <ul>
                  <li>&laquo;Recetas rápidas con pollo&raquo;</li>
                  <li>&laquo;Menú para 8 meses&raquo;</li>
                  <li>&laquo;Tengo zapallo y pollo, mi bebé tiene 10 meses&raquo;</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {error && (
              <div className="asistente__error" role="alert">
                {error}
              </div>
            )}
          </div>
          <form
            className="asistente__form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Escribe tu pregunta…"
              rows={2}
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              className="button button--primary"
              disabled={sending || !input.trim()}
            >
              {sending ? "…" : "Enviar"}
            </button>
          </form>
          <p className="asistente__disclaimer">
            Este asistente sólo responde con el contenido del libro. No
            reemplaza el consejo del pediatra.
          </p>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      className={`asistente__msg asistente__msg--${message.role}`}
      data-pending={message.pending ? "true" : undefined}
    >
      <MessageBody text={message.text} pending={message.pending} />
      {message.toolsInvoked && message.toolsInvoked.length > 0 && (
        <div className="asistente__msg-tools">
          🔍 {message.toolsInvoked.join(" → ")}
        </div>
      )}
    </div>
  );
}

/**
 * Very small Markdown renderer for the two things we care about: paragraphs
 * and inline links [text](/recetas/slug). Anything else renders as plain text.
 */
function MessageBody({ text, pending }: { text: string; pending?: boolean }) {
  if (!text && pending) return <span className="asistente__typing">•••</span>;
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const rx = /\[([^\]]+)\]\((\/[a-z0-9/-]+)\)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = rx.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={key++} href={m[2]} className="asistente__link">
        {m[1]}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
