import "server-only";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { getAdminApp, getAdminAuth } from "@/lib/firebase/admin";
import {
  emptyConsent,
  emptySubscription,
  usuarioSchema,
  type Usuario,
} from "@/lib/schema";
import { computeAccess, type Access } from "@/lib/auth/access";

export interface UserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  providers: string[];
  createdAt: string; // ISO
  lastSignInAt: string | null; // ISO
  disabled: boolean;
  superadmin: boolean;
}

export interface UsersMetrics {
  total: number;
  newThisMonth: number;
  superadmins: number;
  trialActivos: number;
  cortesiaActivas: number;
  trialVencidos: number;
}

export interface UsuarioWithAccess {
  summary: UserSummary;
  profile: Usuario | null;
  access: Access;
}

function toSummary(u: UserRecord): UserSummary {
  const claims = (u.customClaims ?? {}) as { superadmin?: boolean };
  return {
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    providers: u.providerData.map((p) => p.providerId),
    createdAt: u.metadata.creationTime
      ? new Date(u.metadata.creationTime).toISOString()
      : new Date(0).toISOString(),
    lastSignInAt: u.metadata.lastSignInTime
      ? new Date(u.metadata.lastSignInTime).toISOString()
      : null,
    disabled: u.disabled,
    superadmin: claims.superadmin === true,
  };
}

export async function listAllUsers(): Promise<UserSummary[]> {
  const auth = getAdminAuth();
  const out: UserSummary[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) out.push(toSummary(u));
    pageToken = res.pageToken;
  } while (pageToken);
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

/**
 * Same as listAllUsers but joins each Auth record with its Firestore profile
 * doc (usuarios/{uid}) and computes access tier. Used by /admin/usuarios.
 */
export async function listUsuariosWithProfile(): Promise<UsuarioWithAccess[]> {
  const summaries = await listAllUsers();
  const db = getFirestore(getAdminApp());
  const chunkSize = 300; // firestore getAll limit is 500
  const out: UsuarioWithAccess[] = [];
  for (let i = 0; i < summaries.length; i += chunkSize) {
    const chunk = summaries.slice(i, i + chunkSize);
    const refs = chunk.map((s) => db.collection("usuarios").doc(s.uid));
    const snaps = refs.length === 0 ? [] : await db.getAll(...refs);
    chunk.forEach((summary, idx) => {
      const snap = snaps[idx];
      const profile =
        snap && snap.exists ? tryParseUsuario(summary.uid, snap.data()) : null;
      out.push({
        summary,
        profile,
        access: computeAccess(profile),
      });
    });
  }
  return out;
}

function tryParseUsuario(
  uid: string,
  data: FirebaseFirestore.DocumentData | undefined
): Usuario | null {
  if (!data) return null;
  const normalized = { uid, ...data, ...normalizeTimestamps(data) };
  const parsed = usuarioSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

function normalizeTimestamps(
  data: FirebaseFirestore.DocumentData
): Record<string, string | null | undefined> {
  const out: Record<string, string | null | undefined> = {};
  for (const key of ["createdAt", "updatedAt", "lastSignInAt", "onboardingCompletedAt"]) {
    const v = data[key];
    if (v instanceof Timestamp) out[key] = v.toDate().toISOString();
  }
  return out;
}

export async function getUserMetrics(
  users: UserSummary[],
  withAccess?: UsuarioWithAccess[]
): Promise<UsersMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const base = {
    total: users.length,
    newThisMonth: users.filter((u) => u.createdAt >= monthStart).length,
    superadmins: users.filter((u) => u.superadmin).length,
  };
  const source = withAccess ?? [];
  return {
    ...base,
    trialActivos: source.filter((u) => u.access.tier === "trial").length,
    cortesiaActivas: source.filter((u) => u.access.tier === "cortesia").length,
    trialVencidos: source.filter(
      (u) => u.access.tier === "vencida" && u.profile?.subscription.trialEndAt
    ).length,
  };
}

export async function getUser(uid: string): Promise<UserSummary | null> {
  try {
    return toSummary(await getAdminAuth().getUser(uid));
  } catch {
    return null;
  }
}

/**
 * Create a user (email required) and generate a password-reset link that
 * serves as an invitation to set the initial password. Returns the link so
 * the caller can copy it and share it however they like — we don't send
 * email from the app itself.
 */
export async function createUserWithInvite(
  email: string,
  displayName: string | null
): Promise<{ user: UserSummary; inviteLink: string }> {
  const auth = getAdminAuth();
  const created = await auth.createUser({
    email,
    displayName: displayName ?? undefined,
    emailVerified: false,
    disabled: false,
  });
  const inviteLink = await auth.generatePasswordResetLink(email);
  const summary = toSummary(created);
  await ensureUsuarioDoc(summary);
  return { user: summary, inviteLink };
}

export async function generateInviteLink(email: string): Promise<string> {
  return getAdminAuth().generatePasswordResetLink(email);
}

export async function setSuperadmin(uid: string, on: boolean): Promise<void> {
  const auth = getAdminAuth();
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...existing };
  if (on) next.superadmin = true;
  else delete next.superadmin;
  await auth.setCustomUserClaims(uid, next);
  await mirrorAuthFields(toSummary(await auth.getUser(uid)));
}

export async function setDisabled(uid: string, disabled: boolean): Promise<void> {
  await getAdminAuth().updateUser(uid, { disabled });
  await mirrorAuthFields(toSummary(await getAdminAuth().getUser(uid)));
}

export async function deleteUserById(uid: string): Promise<void> {
  await getAdminAuth().deleteUser(uid);
  await getFirestore(getAdminApp()).collection("usuarios").doc(uid).delete();
}

/**
 * Ensures a full `usuarios/{uid}` doc exists. Idempotent: if the doc is
 * already present, only the auth-mirror fields are refreshed. If it's
 * missing, a complete profile is seeded with empty consent, empty
 * subscription (state='vencida' — trial is started explicitly via
 * `startTrial()` when the user finishes registration).
 *
 * Returns the resulting Usuario doc (best-effort — returns null if the
 * write succeeded but re-read parsing failed).
 */
export async function ensureUsuarioDoc(u: UserSummary): Promise<Usuario | null> {
  const db = getFirestore(getAdminApp());
  const ref = db.collection("usuarios").doc(u.uid);
  const snap = await ref.get();
  const nowIso = new Date().toISOString();

  if (!snap.exists) {
    const seed: Usuario = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      phone: null,
      babyName: null,
      babyBirthdate: null,
      source: null,
      consent: emptyConsent(),
      onboardingCompletedAt: null,
      createdAt: u.createdAt ?? nowIso,
      updatedAt: nowIso,
      subscription: emptySubscription(),
      manualEtapaOverride: null,
      superadmin: u.superadmin,
      providers: u.providers,
      disabled: u.disabled,
      lastSignInAt: u.lastSignInAt,
    };
    // Seed with state='vencida' so a partially-registered user has no access
    // until startTrial() flips it. This makes the trial start deterministic.
    seed.subscription.state = "vencida";
    await ref.set(seed);
    return seed;
  }
  await mirrorAuthFields(u);
  const fresh = await ref.get();
  return tryParseUsuario(u.uid, fresh.data());
}

/**
 * Updates only the fields that mirror Firebase Auth. Doesn't touch
 * subscription, consent, baby data, etc.
 */
export async function mirrorAuthFields(u: UserSummary): Promise<void> {
  const db = getFirestore(getAdminApp());
  await db
    .collection("usuarios")
    .doc(u.uid)
    .set(
      {
        email: u.email,
        displayName: u.displayName,
        providers: u.providers,
        disabled: u.disabled,
        superadmin: u.superadmin,
        lastSignInAt: u.lastSignInAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

// Back-compat alias — existing callers keep working.
export const mirrorUser = mirrorAuthFields;

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getFirestore(getAdminApp())
    .collection("usuarios")
    .doc(uid)
    .get();
  if (!snap.exists) return null;
  return tryParseUsuario(uid, snap.data());
}
