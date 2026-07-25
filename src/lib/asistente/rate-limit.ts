import "server-only";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";

const HOUR_LIMIT = 20;
const DAY_LIMIT = 100;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
  reason?: string;
}

/**
 * Firestore-backed per-session counter. One doc per sessionId with two
 * sliding-hour + sliding-day windows. Uses a transaction so parallel
 * requests can't sneak past the limit.
 */
export async function checkAndConsume(
  sessionId: string
): Promise<RateLimitResult> {
  const db = getFirestore(getAdminApp());
  const ref = db.collection("asistente_ratelimit").doc(sessionId);
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as {
      timestamps?: number[];
    };
    const timestamps = (data.timestamps ?? []).filter((t) => t > dayAgo);
    const inHour = timestamps.filter((t) => t > hourAgo).length;
    const inDay = timestamps.length;

    if (inHour >= HOUR_LIMIT) {
      const oldestHour = Math.min(...timestamps.filter((t) => t > hourAgo));
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((oldestHour + 60 * 60 * 1000 - now) / 1000)),
        reason: `Máximo ${HOUR_LIMIT} preguntas por hora.`,
      };
    }
    if (inDay >= DAY_LIMIT) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((dayAgo + 24 * 60 * 60 * 1000 - Math.min(...timestamps)) / 1000)),
        reason: `Máximo ${DAY_LIMIT} preguntas por día.`,
      };
    }

    timestamps.push(now);
    tx.set(
      ref,
      { timestamps, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { allowed: true };
  });
}

