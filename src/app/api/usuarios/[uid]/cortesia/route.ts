import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth/require";
import { handleZodError } from "@/lib/api-errors";
import { grantCortesia } from "@/lib/users/subscriptions";
import { getUsuario } from "@/lib/users/service";

const schema = z.object({
  endsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
    .transform((s) => new Date(`${s}T23:59:59.000Z`).toISOString()),
  valueCLP: z.number().int().nonnegative(),
  note: z.string().max(200).nullable().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ uid: string }> }
) {
  try {
    await requireSuperadmin();
    const { uid } = await ctx.params;
    const body = schema.parse(await req.json());
    await grantCortesia(uid, {
      endsAt: body.endsAt,
      valueCLP: body.valueCLP,
      note: body.note ?? null,
    });
    const usuario = await getUsuario(uid);
    return NextResponse.json({ usuario });
  } catch (err) {
    return handleZodError(err);
  }
}
