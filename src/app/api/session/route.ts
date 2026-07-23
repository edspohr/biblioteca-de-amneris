import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUser, mirrorUser } from "@/lib/users/service";

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
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const { cookie, maxAgeSeconds } = await createSessionCookie(idToken);
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

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
  } catch {
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
