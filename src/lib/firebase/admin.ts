import "server-only";
import { readFileSync } from "node:fs";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const APP_NAME = "biblioteca-admin";

function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) {
    try {
      return JSON.parse(inline) as ServiceAccount;
    } catch {
      throw new Error("FIREBASE_ADMIN_SA no es un JSON válido.");
    }
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
  }
  return null;
}

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;

  const sa = loadServiceAccount();
  if (!sa) {
    // Application Default Credentials fallback (works on App Hosting / GCP).
    return initializeApp({}, APP_NAME);
  }
  return initializeApp({ credential: cert(sa) }, APP_NAME);
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_SA ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GCLOUD_PROJECT
  );
}
