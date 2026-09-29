import { notFound } from "next/navigation";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { GuiaForm } from "../../guia-form";

export default async function AdminGuiaEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const g = await repo.getGuia(id).catch(() => null);
  if (!g) notFound();
  return (
    <>
      <p><Link href="/admin/guias">← Todas las guías</Link></p>
      <h1>Editar guía: {g.titulo || g.codigo || g.id}</h1>
      <GuiaForm initial={g} />
    </>
  );
}
