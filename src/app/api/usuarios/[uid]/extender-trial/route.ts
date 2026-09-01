import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth/require";
import { handleZodError } from "@/lib/api-errors";
import { extendTrial } from "@/lib/users/subscriptions";
import { getUsuario } from "@/lib/users/service";

const schema = z.object({
  dias: z.number().int().min(1).max(365),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ uid: string }> }
) {
  try {
    await requireSuperadmin();
    const { uid } = await ctx.params;
    const body = schema.parse(await req.json());
    const newEnd = await extendTrial(uid, body.dias);
    const usuario = await getUsuario(uid);
    return NextResponse.json({ usuario, trialEndAt: newEnd });
  } catch (err) {
    return handleZodError(err);
  }
}
