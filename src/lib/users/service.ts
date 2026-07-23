import "server-only";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { getAdminApp, getAdminAuth } from "@/lib/firebase/admin";

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

// Firebase Auth's listUsers() pages 1000 at a time. For an app expected to
// stay in the low thousands of users for the foreseeable future, walking all
// pages and filtering client-side is fine. We can revisit if it stops scaling.
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

export async function getUserMetrics(users: UserSummary[]): Promise<UsersMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return {
    total: users.length,
    newThisMonth: users.filter((u) => u.createdAt >= monthStart).length,
    superadmins: users.filter((u) => u.superadmin).length,
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
  await mirrorUser(toSummary(created));
  return { user: toSummary(created), inviteLink };
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
  await mirrorUser(toSummary(await auth.getUser(uid)));
}

export async function setDisabled(uid: string, disabled: boolean): Promise<void> {
  await getAdminAuth().updateUser(uid, { disabled });
  await mirrorUser(toSummary(await getAdminAuth().getUser(uid)));
}

export async function deleteUserById(uid: string): Promise<void> {
  await getAdminAuth().deleteUser(uid);
  await getFirestore(getAdminApp()).collection("usuarios").doc(uid).delete();
}

/**
 * Idempotent write of the mirror doc under `usuarios/{uid}`. Called on every
 * successful sign-in (from the session cookie endpoint) plus after every
 * mutating action here, so the doc stays in step with Firebase Auth without
 * needing a Functions trigger.
 */
export async function mirrorUser(u: UserSummary): Promise<void> {
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
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
