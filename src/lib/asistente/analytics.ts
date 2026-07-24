import "server-only";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import type { ToolName } from "./tools";

export interface RawMessage {
  question: string;
  toolsInvoked: ToolName[];
  responseSummary: string;
  atMs: number;
  sessionId: string;
}

export interface QuestionCluster {
  key: string;
  sample: string;
  count: number;
  lastAtMs: number;
  toolsInvoked: ToolName[]; // union across cluster
}

// Read the last 30 days of messages, cross-session.
export async function loadRecentMessages(days = 30): Promise<RawMessage[]> {
  const db = getFirestore(getAdminApp());
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const snap = await db
    .collectionGroup("mensajes")
    .where("atMs", ">=", cutoff)
    .orderBy("atMs", "desc")
    .limit(1000)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as {
      question: string;
      toolsInvoked?: ToolName[];
      responseSummary?: string;
      atMs: number;
    };
    return {
      question: data.question,
      toolsInvoked: data.toolsInvoked ?? [],
      responseSummary: data.responseSummary ?? "",
      atMs: data.atMs,
      sessionId: d.ref.parent.parent?.id ?? "unknown",
    };
  });
}

// Cluster questions by a normalized key (lowercase, no accents, no punctuation
// beyond spaces, first 50 chars). Enough for a "top questions" glance.
export function clusterQuestions(messages: RawMessage[]): QuestionCluster[] {
  const map = new Map<string, QuestionCluster>();
  for (const m of messages) {
    const key = normalize(m.question).slice(0, 50);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (m.atMs > existing.lastAtMs) existing.lastAtMs = m.atMs;
      for (const t of m.toolsInvoked) {
        if (!existing.toolsInvoked.includes(t)) existing.toolsInvoked.push(t);
      }
    } else {
      map.set(key, {
        key,
        sample: m.question,
        count: 1,
        lastAtMs: m.atMs,
        toolsInvoked: [...m.toolsInvoked],
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastAtMs - a.lastAtMs);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
