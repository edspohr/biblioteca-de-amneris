import "server-only";
import {
  VertexAI,
  type Content,
  type FunctionDeclaration,
  type GenerativeModel,
  type Part,
  SchemaType,
} from "@google-cloud/vertexai";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOL_FNS, type ToolName } from "./tools";

const PROJECT =
  process.env.GCLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "biblioteca-amneris";
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const MODEL = process.env.VERTEX_MODEL || "gemini-2.5-flash";

// Max iterations of the tool-use loop. Real conversations usually need 1-3;
// a hard cap prevents runaway cost if the model gets stuck.
const MAX_ITERATIONS = 5;

let cachedModel: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (cachedModel) return cachedModel;
  const vertex = new VertexAI({ project: PROJECT, location: LOCATION });
  cachedModel = vertex.getGenerativeModel({
    model: MODEL,
    systemInstruction: {
      role: "system",
      parts: [{ text: SYSTEM_PROMPT }],
    },
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });
  return cachedModel;
}

// Tool declarations for the model. Kept in sync with schema.ts by hand — we
// don't need runtime reflection because there are only 5 tools.
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "buscarRecetas",
    description:
      "Busca recetas del libro. Devuelve hasta 10 coincidencias con su URL. Usar siempre que se pida encontrar recetas.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        texto: { type: SchemaType.STRING, description: "Palabra o frase en el título" },
        tipo_comida: {
          type: SchemaType.STRING,
          enum: ["desayuno", "almuerzo", "merienda", "cena", "colacion"],
        },
        minutos_max: { type: SchemaType.NUMBER },
        congelable: { type: SchemaType.BOOLEAN },
        alergenos_excluidos: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Slugs o nombres de alérgenos a excluir",
        },
      },
    },
  },
  {
    name: "obtenerReceta",
    description: "Devuelve una receta completa (ingredientes, pasos, variante de la etapa).",
    parameters: {
      type: SchemaType.OBJECT,
      required: ["slug"],
      properties: {
        slug: { type: SchemaType.STRING },
        etapa_id: {
          type: SchemaType.STRING,
          enum: ["etapa-1", "etapa-2", "etapa-3"],
        },
      },
    },
  },
  {
    name: "buscarMenus",
    description: "Menús semanales de una etapa.",
    parameters: {
      type: SchemaType.OBJECT,
      required: ["etapa_id"],
      properties: {
        etapa_id: {
          type: SchemaType.STRING,
          enum: ["etapa-1", "etapa-2", "etapa-3"],
        },
      },
    },
  },
  {
    name: "sugerirMenu",
    description:
      "Arma un día de comidas (desayuno/almuerzo/merienda/cena) para una edad dada, usando recetas cuyos ingredientes principales coincidan con lo que la persona tiene en casa.",
    parameters: {
      type: SchemaType.OBJECT,
      required: ["edad_meses", "ingredientes_disponibles"],
      properties: {
        edad_meses: { type: SchemaType.NUMBER },
        ingredientes_disponibles: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
    },
  },
  {
    name: "listaDeCompras",
    description: "Lista de compras derivada de un menú, agrupada por categoría del supermercado.",
    parameters: {
      type: SchemaType.OBJECT,
      required: ["menu_id"],
      properties: {
        menu_id: { type: SchemaType.STRING },
      },
    },
  },
];

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
}

export interface StreamChunk {
  kind: "text" | "tool" | "done" | "error";
  text?: string; // for kind = "text" | "error"
  tool?: { name: ToolName }; // for kind = "tool" (announced start)
  finalText?: string; // for kind = "done"
  toolsInvoked?: ToolName[]; // for kind = "done"
  citedSlugs?: string[]; // for kind = "done"
}

/**
 * Run one user turn through the model + tool loop. Yields streaming chunks:
 * - {kind:"tool", name} whenever a tool is about to be executed
 * - {kind:"text", text} for each incremental model text chunk
 * - {kind:"done", finalText, toolsInvoked, citedSlugs} when finished
 * - {kind:"error", text} on unrecoverable failure
 */
export async function* runConversation(
  question: string,
  history: ConversationTurn[]
): AsyncGenerator<StreamChunk> {
  const model = getModel();

  // Build the chat history — Vertex chat takes prior turns as Content[].
  const priorHistory: Content[] = history.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));

  const chat = model.startChat({ history: priorHistory });

  const toolsInvoked: ToolName[] = [];
  const citedSlugs = new Set<string>();
  let finalText = "";
  let currentMessage: string | Part[] = question;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      // Non-streaming per turn: simpler + the streaming loop below emits one
      // chunk per turn, which is enough perceived latency for short answers.
      const result = await chat.sendMessage(currentMessage);
      response = result.response;
    } catch (err) {
      yield {
        kind: "error",
        text:
          "No pude responder ahora. Intenta de nuevo en un momento. (" +
          ((err as Error).message ?? "desconocido") +
          ")",
      };
      return;
    }

    const cand = response.candidates?.[0];
    if (!cand) {
      yield { kind: "error", text: "No recibí respuesta del modelo." };
      return;
    }
    const parts = cand.content?.parts ?? [];
    const functionCalls = parts.filter((p) => "functionCall" in p && p.functionCall);
    const textParts = parts
      .filter((p) => "text" in p && p.text)
      .map((p) => p.text as string);

    // Emit any interstitial text (rare for tool-calling turns, common for the final).
    if (textParts.length > 0) {
      const chunk = textParts.join("");
      finalText += chunk;
      yield { kind: "text", text: chunk };
    }

    // If no tool calls, we're done.
    if (functionCalls.length === 0) {
      yield {
        kind: "done",
        finalText,
        toolsInvoked,
        citedSlugs: [...citedSlugs],
      };
      return;
    }

    // Execute all tool calls (usually just one), then send results back.
    const responseParts: Part[] = [];
    for (const p of functionCalls) {
      const fc = (p as { functionCall: { name: string; args: unknown } }).functionCall;
      const name = fc.name as ToolName;
      if (!(name in TOOL_FNS)) {
        responseParts.push({
          functionResponse: {
            name,
            response: { error: `Herramienta desconocida: ${name}` },
          },
        });
        continue;
      }
      yield { kind: "tool", tool: { name } };
      toolsInvoked.push(name);
      const result = await TOOL_FNS[name](fc.args);
      if (result.ok === false) {
        responseParts.push({
          functionResponse: { name, response: { error: result.error } },
        });
      } else {
        for (const s of result.citedSlugs) citedSlugs.add(s);
        responseParts.push({
          functionResponse: { name, response: { result: result.data } },
        });
      }
    }
    currentMessage = responseParts;
  }

  // Ran out of iterations.
  yield {
    kind: "error",
    text: "La consulta se complicó más de lo esperado. ¿Puedes reformularla?",
  };
}
