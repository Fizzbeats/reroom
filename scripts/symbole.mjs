// Erzeugt die App-Symbole (PNG) aus dem Logo: weißes „R“ in Bricolage Grotesque ExtraBold
// auf Schwarz, dahinter ein oranger Punkt. Aufruf: node scripts/symbole.mjs
import { readFileSync, mkdirSync } from "node:fs";
import opentype from "opentype.js";
import sharp from "sharp";

const schrift = readFileSync("node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff");
const font = opentype.parse(schrift.buffer.slice(schrift.byteOffset, schrift.byteOffset + schrift.byteLength));

const TINTE = "#111111";
const ORANGE = "#FF5B2E";

/** Quadratisches Symbol: „R.“ mittig, bei `rand` Anteil Sicherheitsrand (für maskierbare Icons). */
function symbol(groesse, anteil) {
  const hoehe = groesse * anteil; // Höhe des R
  const fontGroesse = hoehe / 0.7; // Großbuchstabenhöhe ist etwa 0,7 em
  const pfad = font.getPath("R", 0, 0, fontGroesse);
  const box = pfad.getBoundingBox();
  const punkt = hoehe * 0.2;
  const gesamtBreite = box.x2 - box.x1 + punkt * 0.35 + punkt;
  const x = (groesse - gesamtBreite) / 2 - box.x1;
  const y = (groesse + (box.y2 - box.y1)) / 2 - box.y2;
  const p = font.getPath("R", x, y, fontGroesse);
  const rechts = x + box.x2;
  const unten = y + box.y2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 ${groesse} ${groesse}">
    <rect width="${groesse}" height="${groesse}" fill="${TINTE}"/>
    <path d="${p.toPathData(2)}" fill="#FFFFFF"/>
    <circle cx="${rechts + punkt * 0.35 + punkt / 2}" cy="${unten - punkt / 2}" r="${punkt / 2}" fill="${ORANGE}"/>
  </svg>`;
}

mkdirSync("public/icons", { recursive: true });
const ziele = [
  ["icon-192.png", 192, 0.5],
  ["icon-512.png", 512, 0.5],
  ["icon-maskable-512.png", 512, 0.4], // kleiner, damit nichts vom runden Zuschnitt abgeschnitten wird
  ["apple-touch-icon.png", 180, 0.5],
];
for (const [datei, g, a] of ziele) {
  await sharp(Buffer.from(symbol(g, a))).png().toFile(`public/icons/${datei}`);
  console.log("geschrieben:", datei);
}
