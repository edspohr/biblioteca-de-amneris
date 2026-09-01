import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require";
import { handleZodError } from "@/lib/api-errors";
import { listUsuariosWithProfile } from "@/lib/users/service";
import { monthsSince } from "@/lib/etapa-activa/age";

export async function GET() {
  try {
    await requireSuperadmin();
    const rows = await listUsuariosWithProfile();
    const csv = toCsv(rows);
    const filename = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return handleZodError(err);
  }
}

type Row = Awaited<ReturnType<typeof listUsuariosWithProfile>>[number];

function toCsv(rows: Row[]): string {
  const headers = [
    "uid",
    "email",
    "nombre",
    "telefono",
    "fuente",
    "fecha_nacimiento_bebe",
    "edad_bebe_meses",
    "consent_aceptado",
    "estado_suscripcion",
    "trial_end",
    "cortesia_end",
    "cortesia_valor_clp",
    "cortesia_nota",
    "creado",
    "ultimo_ingreso",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const p = r.profile;
    const s = p?.subscription;
    const babyMonths = p?.babyBirthdate ? monthsSince(p.babyBirthdate) : "";
    lines.push(
      [
        r.summary.uid,
        r.summary.email,
        p?.displayName ?? r.summary.displayName,
        p?.phone ?? "",
        p?.source ?? "",
        p?.babyBirthdate ?? "",
        babyMonths,
        p?.consent.accepted ? "sí" : "no",
        r.access.tier,
        s?.trialEndAt ?? "",
        s?.cortesiaEndAt ?? "",
        s?.cortesiaValueCLP ?? "",
        s?.cortesiaNote ?? "",
        r.summary.createdAt,
        r.summary.lastSignInAt ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\n");
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
