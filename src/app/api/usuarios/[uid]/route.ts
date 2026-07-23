import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth/require";
import { badRequest, handleZodError, notFound } from "@/lib/api-errors";
import {
  deleteUserById,
  generateInviteLink,
  getUser,
  setDisabled,
  setSuperadmin,
} from "@/lib/users/service";

const patchSchema = z
  .object({
    disabled: z.boolean().optional(),
    superadmin: z.boolean().optional(),
    resendInvite: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.disabled !== undefined ||
      v.superadmin !== undefined ||
      v.resendInvite === true,
    { message: "Nada que actualizar." }
  );

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const actor = await requireSuperadmin();
    const { uid } = await params;
    const target = await getUser(uid);
    if (!target) return notFound("Ese usuario no existe.");
    const body = patchSchema.parse(await req.json());

    // Self-lockout safety belt: a superadmin cannot demote or disable
    // themselves. Prevents accidentally locking the platform out.
    if (uid === actor.uid) {
      if (body.disabled === true) {
        return forbidden("No puedes deshabilitar tu propia cuenta.");
      }
      if (body.superadmin === false) {
        return forbidden("No puedes revocar tus propios permisos de autoría.");
      }
    }

    let inviteLink: string | null = null;
    if (body.superadmin !== undefined) {
      await setSuperadmin(uid, body.superadmin);
    }
    if (body.disabled !== undefined) {
      await setDisabled(uid, body.disabled);
    }
    if (body.resendInvite && target.email) {
      inviteLink = await generateInviteLink(target.email);
    }
    return NextResponse.json({
      user: await getUser(uid),
      inviteLink,
    });
  } catch (err) {
    return handleZodError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const actor = await requireSuperadmin();
    const { uid } = await params;
    if (uid === actor.uid) {
      return forbidden("No puedes eliminar tu propia cuenta.");
    }
    const target = await getUser(uid);
    if (!target) return notFound("Ese usuario no existe.");
    await deleteUserById(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZodError(err);
  }
}

// Also expose GET to make debugging easy.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    await requireSuperadmin();
    const { uid } = await params;
    const user = await getUser(uid);
    if (!user) return notFound("Ese usuario no existe.");
    return NextResponse.json(user);
  } catch (err) {
    return handleZodError(err);
  }
}
