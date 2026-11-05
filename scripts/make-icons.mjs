// Gera os PNGs do PWA a partir de um SVG simples (marca provisória até vir a arte oficial).
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const svg = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
<rect width="100" height="100" fill="#0E0C13"/>
<g transform="translate(${pad} ${pad}) scale(${(100 - 2 * pad) / 100})">
<rect x="8" y="8" width="84" height="84" rx="22" fill="#17141F" stroke="#A98BFF" stroke-width="3"/>
<text x="50" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="30" fill="#A98BFF" letter-spacing="1">SDM</text>
</g></svg>`;

const out = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/icon-maskable-512.png", 512, 12],
  ["public/icons/apple-touch-icon.png", 180, 0],
  ["src/app/favicon.ico", 48, 0],
];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
for (const [file, size, pad] of out) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg(size, pad)}</body></html>`);
  writeFileSync(file, await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } }));
}
await browser.close();
console.log("ícones gerados");
