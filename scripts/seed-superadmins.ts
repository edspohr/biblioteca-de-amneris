/**
 * Grants the `superadmin: true` custom claim to the fixed list of admin
 * emails, creating the Firebase Auth users if they don't exist yet.
 *
 * Usage (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run seed:superadmins
 *
 * Idempotent: safe to re-run. Prints a generated temp password for any
 * newly-created accounts so you can share it or immediately reset it.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const SUPERADMIN_EMAILS = ["amnerispinto@gmail.com", "edmundo@spohr.cl"];

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json (or FIREBASE_ADMIN_SA=<json>) before running."
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const auth = getAuth();

  for (const email of SUPERADMIN_EMAILS) {
    let created = false;
    let tempPassword: string | null = null;
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found") {
        tempPassword = generateTempPassword();
        user = await auth.createUser({
          email,
          password: tempPassword,
          emailVerified: false,
        });
        created = true;
      } else {
        throw err;
      }
    }

    const existingClaims = user.customClaims ?? {};
    if (existingClaims.superadmin !== true) {
      await auth.setCustomUserClaims(user.uid, {
        ...existingClaims,
        superadmin: true,
      });
    }

    const status = created
      ? `created (temp password: ${tempPassword})`
      : existingClaims.superadmin === true
      ? "already superadmin"
      : "claim added";
    // eslint-disable-next-line no-console
    console.log(`✓ ${email} — ${status}`);
  }

  // eslint-disable-next-line no-console
  console.log("\nDone. Users with new temp passwords should sign in and reset them.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
