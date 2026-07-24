/**
 * One-off: composes the Open Graph image at public/og.png (1200×630) from
 * one hero recipe photo + brand overlay. Rerun if the source photo or the
 * copy changes.
 *
 * Usage:  npx tsx scripts/generate-og.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_PHOTO = path.join(
  process.cwd(),
  "public",
  "images",
  "recetas",
  "crema-de-calabaza-con-coco-y-jengibre-suave.png"
);
const OUT = path.join(process.cwd(), "public", "og.png");

const W = 1200;
const H = 630;

async function main() {
  // Cover the whole card with the recipe photo, then darken the left column
  // for text legibility.
  const photo = await sharp(SRC_PHOTO)
    .resize({ width: W, height: H, fit: "cover", position: "center" })
    .toBuffer();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#3d1e0f" stop-opacity="0.92"/>
          <stop offset="55%" stop-color="#3d1e0f" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#3d1e0f" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#fade)"/>
      <text x="72" y="180" font-family="Georgia, 'Times New Roman', serif"
            font-size="34" fill="#fbd4c3" font-style="italic">
        La Biblioteca de Amneris
      </text>
      <text x="72" y="300" font-family="Georgia, 'Times New Roman', serif"
            font-size="82" font-weight="700" fill="#ffffff">
        Bocaditos
      </text>
      <text x="72" y="390" font-family="Georgia, 'Times New Roman', serif"
            font-size="82" font-weight="700" fill="#ffffff" font-style="italic">
        del Corazón
      </text>
      <text x="72" y="470" font-family="Georgia, serif" font-size="30"
            fill="#ffffff" opacity="0.9">
        Alimentación complementaria para bebés de 6 a 24 meses
      </text>
      <text x="72" y="540" font-family="Georgia, serif" font-size="22"
            fill="#fbd4c3">
        120 recetas · 13 menús · gratis
      </text>
    </svg>
  `;

  await sharp(photo)
    .composite([{ input: Buffer.from(svg) }])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const stats = await fs.stat(OUT);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${stats.size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
