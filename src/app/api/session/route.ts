import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { isSuperadminEmail } from "@/lib/auth/superadmins";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUser, mirrorUser } from "@/lib/users/service";

/**
 * Client uses this to confirm the session cookie is actually visible +
 * verifiable server-side before hard-navigating away from /login. Prevents
 * the "logged in but bounced back to /login" race where the browser
 * navigates before the Set-Cookie has been applied.
 */
export async function GET() {
  const user = await verifySession();
  return NextResponse.json({ authenticated: Boolean(user), superadmin: user?.superadmin === true });
}

export async function POST(req: Request) {
  let idToken: string;
  try {
    const body = (await req.json()) as { idToken?: unknown };
    if (typeof body.idToken !== "string" || !body.idToken) {
      return NextResponse.json(
        { error: "Falta el token de autenticación." },
        { status: 400 }
      );
    }
    idToken = body.idToken;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  try {
    // Verify token before minting the cookie so we can echo user info.
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    // eslint-disable-next-line no-console
    console.log(
      "[session] verifyIdToken ok",
      "uid=", decoded.uid,
      "email=", decoded.email,
      "claim.superadmin=", decoded.superadmin === true,
    );

    // Auto-grant the `superadmin` custom claim to hard-coded owner emails on
    // their first sign-in. The claim only lives inside a fresh ID token, so
    // if we set it here we must ask the client to refresh and retry — the
    // current idToken (and any session cookie minted from it) still carries
    // the old claims.
    if (
      isSuperadminEmail(decoded.email) &&
      decoded.superadmin !== true
    ) {
      // eslint-disable-next-line no-console
      console.log("[session] granting superadmin claim to", decoded.email);
      const userRecord = await auth.getUser(decoded.uid);
      await auth.setCustomUserClaims(decoded.uid, {
        ...(userRecord.customClaims ?? {}),
        superadmin: true,
      });
      return NextResponse.json(
        { refreshRequired: true },
        { status: 200 }
      );
    }

    const { cookie, maxAgeSeconds } = await createSessionCookie(idToken);
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });
    // eslint-disable-next-line no-console
    console.log(
      "[session] cookie set",
      "uid=", decoded.uid,
      "cookie.length=", cookie.length,
      "maxAgeSeconds=", maxAgeSeconds,
    );

    // Mirror this user into usuarios/{uid} so the admin panel can list them
    // without a Functions trigger. Non-fatal if it fails — the sign-in itself
    // has already succeeded.
    try {
      const summary = await getUser(decoded.uid);
      if (summary) await mirrorUser(summary);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[session] mirror failed:", err);
    }

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
      superadmin: decoded.superadmin === true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[session] verify/mint failed:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
