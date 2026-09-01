import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/require";
import { handleZodError } from "@/lib/api-errors";
import {
  usuarioSelfPatchSchema,
  CONSENT_VERSION,
  type UsuarioSelfPatch,
} from "@/lib/schema";
import { getUsuario, ensureUsuarioDoc, getUser } from "@/lib/users/service";
import {
  incrementAttributionCounter,
  startTrial,
} from "@/lib/users/subscriptions";

export async function GET() {
  try {
    const { session, usuario, access } = await requireUser();
    return NextResponse.json({
      session: {
        uid: session.uid,
        email: session.email,
        name: session.name,
        superadmin: session.superadmin,
      },
      usuario,
      access,
    });
  } catch (err) {
    return handleZodError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, usuario } = await requireUser();
    const body = usuarioSelfPatchSchema.parse(await req.json());

    // Bootstrap the profile doc if it somehow doesn't exist yet (defensive —
    // the session route already ensures it on first sign-in).
    let current = usuario;
    if (!current) {
      const summary = await getUser(session.uid);
      if (summary) await ensureUsuarioDoc(summary);
      current = await getUsuario(session.uid);
    }

    const update = buildUpdatePayload(body);
    const db = getFirestore(getAdminApp());
    await db.collection("usuarios").doc(session.uid).update(update);

    // Cross-cutting effects:
    // - Trial arranca la primera vez que el usuario acepta consent.
    // - Contador de atribución incrementa cuando el usuario reporta source.
    const consentBefore = current?.consent.accepted === true;
    const consentAfter = body.consent?.accepted === true;
    if (!consentBefore && consentAfter) {
      await startTrial(session.uid);
    }
    if (body.source && current?.source !== body.source) {
      await incrementAttributionCounter(body.source);
    }

    const usuarioFresh = await getUsuario(session.uid);
    return NextResponse.json({ usuario: usuarioFresh });
  } catch (err) {
    return handleZodError(err);
  }
}

function buildUpdatePayload(
  patch: UsuarioSelfPatch
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.displayName !== undefined) out.displayName = patch.displayName;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.babyName !== undefined) out.babyName = patch.babyName;
  if (patch.babyBirthdate !== undefined)
    out.babyBirthdate = patch.babyBirthdate;
  if (patch.source !== undefined) out.source = patch.source;
  if (patch.manualEtapaOverride !== undefined)
    out.manualEtapaOverride = patch.manualEtapaOverride;
  if (patch.onboardingCompletedAt !== undefined)
    out.onboardingCompletedAt = patch.onboardingCompletedAt;
  if (patch.consent !== undefined) {
    out.consent = {
      accepted: patch.consent.accepted,
      acceptedAt: patch.consent.accepted
        ? patch.consent.acceptedAt ?? new Date().toISOString()
        : null,
      version: patch.consent.version || CONSENT_VERSION,
    };
  }
  return out;
}
