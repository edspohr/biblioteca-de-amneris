import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth/require";
import { badRequest, conflict, handleZodError } from "@/lib/api-errors";
import {
  createUserWithInvite,
  getUserMetrics,
  listAllUsers,
} from "@/lib/users/service";

export async function GET() {
  try {
    await requireSuperadmin();
    const users = await listAllUsers();
    const metrics = await getUserMetrics(users);
    return NextResponse.json({ users, metrics });
  } catch (err) {
    return handleZodError(err);
  }
}

const createSchema = z.object({
  email: z.string().email("El correo no es válido"),
  displayName: z.string().min(1).max(80).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireSuperadmin();
    const body = createSchema.parse(await req.json());
    try {
      const { user, inviteLink } = await createUserWithInvite(
        body.email.toLowerCase().trim(),
        body.displayName?.trim() || null
      );
      return NextResponse.json({ user, inviteLink }, { status: 201 });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-exists") {
        return conflict("Ya existe una cuenta con ese correo.");
      }
      if (code === "auth/invalid-email") {
        return badRequest("El correo no es válido.");
      }
      throw err;
    }
  } catch (err) {
    return handleZodError(err);
  }
}
