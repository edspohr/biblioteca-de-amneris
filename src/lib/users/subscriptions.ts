import "server-only";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import { trialEndFromStart } from "@/lib/auth/access";
import { TRIAL_DAYS } from "@/lib/schema";

/**
 * Marca el inicio del período de prueba de 30 días. Idempotente: si ya hay
 * un trial iniciado antes, no lo pisa (evita re-iniciar el reloj si el
 * usuario re-acepta el consent). Devuelve la fecha ISO de fin.
 */
export async function startTrial(uid: string, now = new Date()): Promise<string> {
  const db = getFirestore(getAdminApp());
  const ref = db.collection("usuarios").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`No existe el perfil ${uid}; llama a ensureUsuarioDoc primero.`);
  }
  const data = snap.data();
  const existingEnd = data?.subscription?.trialEndAt as string | undefined;
  if (existingEnd) {
    // Trial ya arrancó; no reseteamos.
    return existingEnd;
  }

  const startIso = now.toISOString();
  const endIso = trialEndFromStart(startIso, TRIAL_DAYS);
  await ref.update({
    "subscription.state": "trial",
    "subscription.trialStartAt": startIso,
    "subscription.trialEndAt": endIso,
    updatedAt: startIso,
  });
  // TODO: enviar email de bienvenida
  return endIso;
}

/**
 * Concede acceso de cortesía. La expiración es explícita (fecha ISO) y
 * el valor CLP se muestra al usuario como anclaje ("regalo valorado en $X").
 */
export async function grantCortesia(
  uid: string,
  args: { endsAt: string; valueCLP: number; note: string | null },
  now = new Date()
): Promise<void> {
  const db = getFirestore(getAdminApp());
  await db.collection("usuarios").doc(uid).update({
    "subscription.state": "cortesia",
    "subscription.cortesiaEndAt": args.endsAt,
    "subscription.cortesiaValueCLP": args.valueCLP,
    "subscription.cortesiaNote": args.note,
    updatedAt: now.toISOString(),
  });
}

/**
 * Extiende el trial por N días desde su fecha actual de fin (o desde ahora
 * si ya venció). Deja el estado en 'trial' aunque estuviera 'vencida'.
 */
export async function extendTrial(
  uid: string,
  days: number,
  now = new Date()
): Promise<string> {
  const db = getFirestore(getAdminApp());
  const ref = db.collection("usuarios").doc(uid);
  const snap = await ref.get();
  const existingEnd = snap.data()?.subscription?.trialEndAt as string | undefined;
  const baseMs = existingEnd
    ? Math.max(Date.parse(existingEnd), now.getTime())
    : now.getTime();
  const newEnd = new Date(baseMs + days * 24 * 60 * 60 * 1000).toISOString();
  await ref.update({
    "subscription.state": "trial",
    "subscription.trialStartAt":
      (snap.data()?.subscription?.trialStartAt as string | undefined) ??
      now.toISOString(),
    "subscription.trialEndAt": newEnd,
    updatedAt: now.toISOString(),
  });
  return newEnd;
}

/**
 * Contador simple de registros (server-only) para métricas de leads y
 * atribución. Increments son atómicos vía FieldValue.
 */
export async function incrementRegistrationsCounter(): Promise<void> {
  const db = getFirestore(getAdminApp());
  await db.collection("metrics").doc("registrations").set(
    {
      total: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function incrementAttributionCounter(
  source: string
): Promise<void> {
  const db = getFirestore(getAdminApp());
  await db.collection("metrics").doc("registrations").set(
    {
      bySource: { [source]: FieldValue.increment(1) },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
