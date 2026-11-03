import type { Stil } from "../models/types";
import type { InspoKarte } from "../logic/stilAuswertung";
import { FARBE, MoebelZeichnung } from "./ui";
import { STIL_INFO } from "./Start";

// Wand- und Bodenfarbe je Stil, damit jede Karte eine eigene Stimmung hat
const STIMMUNG: Record<Stil, { wand: string; boden: string; rahmen: string }> = {
  skandi: { wand: "#EFE9DF", boden: "#E0D2BC", rahmen: "#C9A06E" },
  modern: { wand: "#E7E9EB", boden: "#CFD3D6", rahmen: "#2E2E2E" },
  industrial: { wand: "#5B5F62", boden: "#3E4144", rahmen: "#1E1E1E" },
  boho: { wand: "#F2E1CF", boden: "#DCC0A0", rahmen: "#A86B45" },
  vintage: { wand: "#E8DCC0", boden: "#B98C5C", rahmen: "#6E4A2E" },
};

/** Eine gezeichnete Einrichtungs-Szene als Inspo-Karte (Platzhalter für echte Fotos). */
export function Moodboard({ karte, beschriftet = true }: { karte: InspoKarte; beschriftet?: boolean }) {
  const st = STIMMUNG[karte.stil];
  const [f1 = "grau", f2 = "holz"] = karte.farben;
  if (karte.bildUrl) {
    return <img src={karte.bildUrl} alt={`Dein Bild, Stil ${STIL_INFO[karte.stil].name}`} className="moodboard eigenes-bild" draggable={false} />;
  }
  return (
    <svg viewBox="0 0 330 400" role="img" aria-label={`Einrichtungsbeispiel im Stil ${STIL_INFO[karte.stil].name}`} className="moodboard">
      <rect width="330" height="400" fill={st.wand} />
      <rect y="292" width="330" height="108" fill={st.boden} />
      <rect x="208" y="40" width="82" height="108" rx="3" fill="#F7F3EC" stroke={st.rahmen} strokeWidth="5" />
      <path d="M218 130l20-30 15 18 12-10 15 22z" fill={karte.stil === "industrial" ? "#8A8F93" : "#9FB49B"} />
      <g transform="translate(-6 162) scale(1.25)"><MoebelZeichnung art="sofa" c={FARBE[f1]!} /></g>
      <g transform="translate(204 150) scale(.75)"><MoebelZeichnung art="lampe" c={FARBE[f2]!} /></g>
      <g transform="translate(24 70) scale(.6)"><MoebelZeichnung art="pflanze" c={FARBE[f2]!} /></g>
      <g transform="translate(80 300)"><MoebelZeichnung art="teppich" c={FARBE[f2 === f1 ? "grau" : f2]!} /></g>
      {beschriftet && (
        <g transform="translate(16 16)">
          <rect width="104" height="30" rx="15" fill="#fff" />
          <text x="52" y="15.5" textAnchor="middle" dominantBaseline="middle" className="moodboard-text">{STIL_INFO[karte.stil].name}</text>
        </g>
      )}
    </svg>
  );
}
