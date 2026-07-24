import { NextResponse } from "next/server";
import { z } from "zod";
import { runConversation, type ConversationTurn } from "@/lib/asistente/gemini";
import { checkAndConsume } from "@/lib/asistente/rate-limit";
import { logMessage } from "@/lib/asistente/log";
import { verifyAppCheck } from "@/lib/asistente/app-check";
import {
  MEDICAL_REDIRECT_TEXT,
  detectAllergens,
  looksOnTopic,
  needsMedicalRedirect,
  stripUncitedLinks,
} from "@/lib/asistente/guardrails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  question: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  // 0) App Check — no-op unless APP_CHECK_ENFORCE=true
  const appCheck = await verifyAppCheck(req);
  if (!appCheck.ok) {
    return NextResponse.json({ error: appCheck.error }, { status: appCheck.status });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  // 1) Rate limit
  const rl = await checkAndConsume(body.sessionId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.reason ?? "Demasiadas preguntas seguidas." },
      { status: 429, headers: rl.retryAfterSec ? { "Retry-After": String(rl.retryAfterSec) } : {} }
    );
  }

  // 2) Medical short-circuit — never even call the model
  if (needsMedicalRedirect(body.question)) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(sseEvent("text", { text: MEDICAL_REDIRECT_TEXT })));
        controller.enqueue(
          enc.encode(
            sseEvent("done", {
              finalText: MEDICAL_REDIRECT_TEXT,
              toolsInvoked: [],
              citedSlugs: [],
              redirect: "medical",
            })
          )
        );
        controller.close();
      },
    });
    // Log the redirect too so Amneris sees how often it fires.
    void logMessage({
      sessionId: body.sessionId,
      question: body.question,
      toolsInvoked: [],
      responseSummary: "[redirigido a pediatra]",
      atMs: Date.now(),
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // 3) Enrich question with detected allergens so the model can't forget
  const detected = await detectAllergens(body.question);
  const enrichedQuestion = detected.length
    ? `${body.question}\n\n[Sistema: se detectaron alergias/intolerancias — excluye estos alérgenos en toda búsqueda: ${detected.join(", ")}]`
    : body.question;

  const history: ConversationTurn[] = body.history ?? [];
  const onTopic = looksOnTopic(body.question);

  // 4) Stream the model turn
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let finalText = "";
      const toolsInvoked: string[] = [];
      const citedSlugs = new Set<string>();

      try {
        for await (const chunk of runConversation(enrichedQuestion, history)) {
          if (chunk.kind === "tool") {
            toolsInvoked.push(chunk.tool!.name);
            controller.enqueue(enc.encode(sseEvent("tool", chunk.tool)));
          } else if (chunk.kind === "text") {
            controller.enqueue(enc.encode(sseEvent("text", { text: chunk.text })));
            finalText += chunk.text ?? "";
          } else if (chunk.kind === "done") {
            const sanitized = stripUncitedLinks(
              chunk.finalText ?? finalText,
              new Set(chunk.citedSlugs ?? [])
            );
            for (const s of chunk.citedSlugs ?? []) citedSlugs.add(s);
            controller.enqueue(
              enc.encode(
                sseEvent("done", {
                  finalText: sanitized,
                  toolsInvoked: chunk.toolsInvoked ?? toolsInvoked,
                  citedSlugs: [...citedSlugs],
                  onTopic,
                })
              )
            );
            void logMessage({
              sessionId: body.sessionId,
              question: body.question,
              toolsInvoked: (chunk.toolsInvoked ?? toolsInvoked) as never,
              responseSummary: sanitized.slice(0, 150),
              atMs: Date.now(),
            });
          } else if (chunk.kind === "error") {
            controller.enqueue(enc.encode(sseEvent("error", { text: chunk.text })));
          }
        }
      } catch (err) {
        controller.enqueue(
          enc.encode(
            sseEvent("error", {
              text: "Algo falló. Intenta de nuevo en un momento.",
            })
          )
        );
        // eslint-disable-next-line no-console
        console.error("[asistente]", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
