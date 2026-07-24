import type { MetadataRoute } from "next";
import { repo } from "@/lib/repo";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [recetas, menus, tecnicas, etapas] = await Promise.all([
    repo.getRecetas(),
    repo.getMenus(),
    repo.getTecnicas(),
    repo.getEtapas(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/libro`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/recetas`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/menus`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/tecnicas`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: now, priority: 0.3 },
  ];

  const recetaRoutes = recetas.map((r) => ({
    url: `${SITE_URL}/recetas/${r.id}`,
    lastModified: now,
    priority: 0.7,
  }));
  const menuRoutes = menus.map((m) => ({
    url: `${SITE_URL}/menus/${m.id}`,
    lastModified: now,
    priority: 0.6,
  }));
  const tecnicaRoutes = tecnicas.map((t) => ({
    url: `${SITE_URL}/tecnicas/${t.id}`,
    lastModified: now,
    priority: 0.5,
  }));
  const etapaRoutes = etapas.map((e) => ({
    url: `${SITE_URL}/etapas/${e.id}`,
    lastModified: now,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...recetaRoutes,
    ...menuRoutes,
    ...tecnicaRoutes,
    ...etapaRoutes,
  ];
}
