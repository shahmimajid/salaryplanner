// One-off, dev-only asset-generation script — NOT wired into pnpm build,
// CI, or the Dockerfile. sharp needs a native binary; keeping it out of
// the build pipeline avoids complicating the Alpine Docker image for a
// step that only needs to run once, with its output committed as static
// assets. Run manually: `node scripts/generate-pwa-icons.mjs`.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

const targets = [
  { src: "icon-source.svg", out: "icon-192.png", size: 192 },
  { src: "icon-source.svg", out: "icon-512.png", size: 512 },
  { src: "icon-source-maskable.svg", out: "icon-maskable-512.png", size: 512 },
];

for (const target of targets) {
  const svg = readFileSync(join(iconsDir, target.src));
  await sharp(svg)
    .resize(target.size, target.size)
    .png()
    .toFile(join(iconsDir, target.out));
  console.log(`Generated ${target.out} (${target.size}x${target.size})`);
}
