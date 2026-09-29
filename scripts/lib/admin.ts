/**
 * Shared Firebase Admin initialization for Fase 1 migration scripts.
 * Existing scripts (extract, migrate-to-firestore, sync-catalogs, …) keep
 * their inline loadServiceAccount for stability; new scripts import from here.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      "Configura GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json (o FIREBASE_ADMIN_SA=<json>) antes de correr."
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as ServiceAccount;
}

let initialized = false;
export function db(): Firestore {
  if (!initialized) {
    initializeApp({ credential: cert(loadServiceAccount()) });
    initialized = true;
  }
  return getFirestore();
}

// --dry-run is the default. Scripts require --apply to actually write.
export function isApply(): boolean {
  return process.argv.includes("--apply");
}

// Refuse to --apply without a recent backup. Backups live under
// data/backups/<timestamp>/; a backup younger than 24h counts. The check is
// bypassable with --skip-backup-check for repeat runs during the same day.
export function requireRecentBackup(): void {
  if (process.argv.includes("--skip-backup-check")) return;
  const dir = path.join(process.cwd(), "data", "backups");
  let mostRecent = 0;
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const s = statSync(full);
      if (s.isDirectory() && s.mtimeMs > mostRecent) mostRecent = s.mtimeMs;
    }
  } catch {
    // dir missing → mostRecent stays 0
  }
  const ageMs = Date.now() - mostRecent;
  if (mostRecent === 0 || ageMs > 24 * 60 * 60 * 1000) {
    throw new Error(
      `No hay backup reciente en data/backups/ (< 24h). Corre 'npm run backup' antes de --apply, o pasa --skip-backup-check bajo tu responsabilidad.`
    );
  }
}
