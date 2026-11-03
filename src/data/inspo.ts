import type { InspoKarte } from "../logic/stilAuswertung";

// Inspo-Karten für den Stil-Finder: je Stil mindestens eine, gemischte Farben.
// Später können hier echte Einrichtungsfotos oder eigene Uploads stehen.
export const INSPO_KARTEN: InspoKarte[] = [
  { id: "skandi-hell", stil: "skandi", farben: ["weiss", "holz"] },
  { id: "industrial-dunkel", stil: "industrial", farben: ["schwarz", "grau"] },
  { id: "boho-warm", stil: "boho", farben: ["terrakotta", "holz"] },
  { id: "modern-klar", stil: "modern", farben: ["grau", "weiss"] },
  { id: "vintage-braun", stil: "vintage", farben: ["braun", "holz"] },
  { id: "skandi-grau", stil: "skandi", farben: ["grau", "holz"] },
  { id: "boho-erdig", stil: "boho", farben: ["braun", "terrakotta"] },
  { id: "modern-kontrast", stil: "modern", farben: ["schwarz", "weiss"] },
];
