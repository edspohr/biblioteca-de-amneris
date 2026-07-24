import "server-only";
import { getAppCheck } from "firebase-admin/app-check";
import { getAdminApp } from "@/lib/firebase/admin";

/**
 * Verify the App Check token sent by the client. When APP_CHECK_ENFORCE=true
 * we reject requests without a valid token; otherwise we log but let them
 * through, so local dev without a debug token keeps working.
 *
 * Firestore/Storage already enforce App Check through Firebase's own
 * enforcement toggle (see GCP_SETUP.md). This is the belt-and-suspenders for
 * the assistant API, which is the most cost-exposed surface.
 */
export async function verifyAppCheck(req: Request): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const enforce = process.env.APP_CHECK_ENFORCE === "true";
  const token = req.headers.get("X-Firebase-AppCheck");

  if (!token) {
    if (enforce) {
      return {
        ok: false,
        status: 401,
        error: "Falta el token de verificación.",
      };
    }
    return { ok: true };
  }

  try {
    await getAppCheck(getAdminApp()).verifyToken(token);
    return { ok: true };
  } catch {
    if (enforce) {
      return {
        ok: false,
        status: 401,
        error: "Token de verificación inválido.",
      };
    }
    return { ok: true };
  }
}
