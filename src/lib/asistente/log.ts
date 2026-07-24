import "server-only";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import type { ToolName } from "./tools";

export interface LogEntry {
  sessionId: string;
  question: string; // trimmed to 500 chars
  toolsInvoked: ToolName[];
  responseSummary: string; // first 150 chars of final response
  atMs: number;
}

const QUESTION_MAX = 500;
const SUMMARY_MAX = 150;

export async function logMessage(entry: LogEntry): Promise<void> {
  const db = getFirestore(getAdminApp());
  await db
    .collection("conversaciones")
    .doc(entry.sessionId)
    .collection("mensajes")
    .add({
      question: entry.question.slice(0, QUESTION_MAX),
      toolsInvoked: entry.toolsInvoked,
      responseSummary: entry.responseSummary.slice(0, SUMMARY_MAX),
      atMs: entry.atMs,
      at: FieldValue.serverTimestamp(),
    });
  // Also touch the session doc so we can list sessions ordered by recency.
  await db
    .collection("conversaciones")
    .doc(entry.sessionId)
    .set(
      { lastAtMs: entry.atMs, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
}
