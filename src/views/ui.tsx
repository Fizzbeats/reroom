import { useRef, useState, type ReactNode } from "react";
import type { Kategorie, Moebel, Raum } from "../models/types";
import type { Ampel } from "../logic/passtCheck";
import { TUER_ABSTAND_CM, type Platzierung } from "../logic/einrichten";
import { cashbackProzent } from "../logic/aktion";
import { alsCent, cashbackCent, euro } from "../logic/preisRechner";

// ---------- Icons (eigene Strich-Icons statt Emojis) ----------

const PFADE = {
  home: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />,
  suche: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></>,
  kamera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.5" /></>,
  tasche: <><path d="M5 8h14l-1 12H6z" strokeLinejoin="round" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  etikett: <><path d="M3 12V4h8l10 10-8 8z" strokeLinejoin="round" /><circle cx="7.5" cy="8" r="1" fill="currentColor" /></>,
  herz: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" strokeLinejoin="round" />,
  filter: <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />,
  zurueck: <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
  raum: <path d="M4 4h16v16H4zM4 14h6v6" strokeLinejoin="round" />,
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  schliessen: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  foto: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" strokeLinejoin="round" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />,
  wuerfel: <path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" strokeLinejoin="round" />,
  wechseln: <path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2M20 4v4h-4M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5" strokeLinecap="round" /></>,
  glocke: <path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5zM10 20a2 2 0 0 0 4 0" strokeLinejoin="round" />,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" strokeLinejoin="round" /></>,
  funkeln: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" strokeLinecap="round" />,
};
export type IconName = keyof typeof PFADE;

export function Icon({ name, groesse = 22, gefuellt = false }: { name: IconName; groesse?: number; gefuellt?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={groesse} height={groesse} fill={gefuellt ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {PFADE[name]}
    </svg>
  );
}

/**
 * Platz für das Logo mit fester Größe (--logo-breite × --logo-hoehe in tokens.css).
 * Zum Austauschen den Inhalt durch <img src="/reroom/logo.svg" alt="ReRoom" /> ersetzen, Größe und Platz bleiben gleich.
 */
export function Logo() {
  return <span className="logo-platz" role="img" aria-label="Platzhalter für das Logo">Logo</span>;
}

// ---------- Möbel-Zeichnungen ----------

export const FARBE: Record<string, string> = {
  grau: "#A3A7AB", weiss: "#ECEAE5", holz: "#C9A06E", schwarz: "#2E2E2E", braun: "#80553A", terrakotta: "#C9694C",
};
export const farbeVon = (m: Moebel) => FARBE[m.farben[0] ?? "grau"] ?? "#A3A7AB";
const HOLZ = "#B98C5C";

function mischen(hex: string, ziel: number, anteil: number): string {
  return "#" + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (ziel - v) * anteil).toString(16).padStart(2, "0");
  }).join("");
}
const dunkler = (hex: string, anteil = 0.22) => mischen(hex, 0, anteil);
const heller = (hex: string, anteil = 0.18) => mischen(hex, 255, anteil);

export type ZeichnungsArt = Kategorie | "pflanze";

/** Zeichnung eines Möbels als SVG-Gruppe im Feld 200 × 150 (zum Einbetten in größere Bilder). */
export function MoebelZeichnung({ art, c }: { art: ZeichnungsArt; c: string }) {
  const schatten = <ellipse cx="100" cy="134" rx="78" ry="6" fill="#000" opacity=".08" />;
  switch (art) {
    case "sofa":
      return (<g>{schatten}
        <rect x="34" y="54" width="132" height="44" rx="16" fill={dunkler(c)} />
        <rect x="20" y="86" width="160" height="36" rx="13" fill={c} />
        <rect x="14" y="72" width="28" height="50" rx="13" fill={dunkler(c, 0.12)} />
        <rect x="158" y="72" width="28" height="50" rx="13" fill={dunkler(c, 0.12)} />
        <rect x="46" y="84" width="52" height="16" rx="7" fill={heller(c)} />
        <rect x="102" y="84" width="52" height="16" rx="7" fill={heller(c)} />
        <rect x="34" y="122" width="6" height="10" rx="2" fill={HOLZ} /><rect x="160" y="122" width="6" height="10" rx="2" fill={HOLZ} />
      </g>);
    case "stuhl":
      return (<g>{schatten}
        <rect x="70" y="30" width="60" height="54" rx="12" fill={dunkler(c, 0.1)} />
        <rect x="62" y="80" width="76" height="16" rx="7" fill={c} />
        <path d="M70 96 64 132M130 96 136 132M82 96 80 128M118 96 120 128" stroke={HOLZ} strokeWidth="5" strokeLinecap="round" />
      </g>);
    case "bett":
      return (<g>{schatten}
        <rect x="22" y="40" width="40" height="88" rx="8" fill={dunkler(c)} />
        <rect x="40" y="92" width="150" height="30" rx="8" fill={c} />
        <rect x="48" y="74" width="40" height="18" rx="8" fill="#FFFFFF" />
        <rect x="36" y="118" width="156" height="10" rx="4" fill={dunkler(c, 0.3)} />
      </g>);
    case "schrank":
      return (<g>{schatten}
        <rect x="50" y="14" width="100" height="116" rx="6" fill={c} />
        <line x1="100" y1="18" x2="100" y2="126" stroke={dunkler(c, 0.2)} strokeWidth="2" />
        <rect x="90" y="66" width="3" height="16" rx="1.5" fill={dunkler(c, 0.4)} /><rect x="107" y="66" width="3" height="16" rx="1.5" fill={dunkler(c, 0.4)} />
      </g>);
    case "tisch":
      return (<g>{schatten}
        <rect x="22" y="62" width="156" height="12" rx="4" fill={c} />
        <path d="M38 74 34 130M162 74 166 130M56 74 58 120M144 74 142 120" stroke={dunkler(c, 0.25)} strokeWidth="6" strokeLinecap="round" />
        <rect x="112" y="46" width="20" height="16" rx="3" fill="#FFFFFF" />
      </g>);
    case "regal":
      return (<g>{schatten}
        <rect x="58" y="12" width="84" height="120" rx="3" fill="none" stroke={c} strokeWidth="7" />
        {[44, 74, 104].map((y) => <rect key={y} x="58" y={y} width="84" height="6" fill={c} />)}
        <rect x="68" y="22" width="8" height="22" fill="#C9694C" /><rect x="78" y="26" width="7" height="18" fill="#555" />
        <rect x="87" y="20" width="9" height="24" fill="#D9C27A" /><circle cx="120" cy="66" r="8" fill="#7E9B7A" />
        <rect x="70" y="86" width="22" height="18" rx="3" fill="#D8D6D0" />
      </g>);
    case "lampe":
      return (<g>{schatten}
        <ellipse cx="100" cy="130" rx="24" ry="5" fill={dunkler(c, 0.3)} />
        <rect x="98" y="46" width="4" height="84" fill={dunkler(c, 0.3)} />
        <path d="M72 46h56l-10-32H82z" fill={c} />
        <ellipse cx="100" cy="52" rx="38" ry="10" fill="#FFE7A3" opacity=".55" />
      </g>);
    case "teppich":
      return (<g>{schatten}
        <path d="M30 118 62 62h108l-32 56z" fill={c} />
        <path d="M46 110 70 70h84l-24 40z" fill="none" stroke={heller(c, 0.45)} strokeWidth="3" />
      </g>);
    case "pflanze":
      return (<g>{schatten}
        <path d="M84 96h32l-4 34H88z" fill={c} />
        <path d="M100 96c-4-20-22-26-28-40 14 2 24 14 28 30 2-22 12-34 26-40-4 16-14 30-20 48" fill="#5E8C5A" />
      </g>);
  }
}

export function MoebelBild({ moebel }: { moebel: Moebel }) {
  if (moebel.bildUrl) return <img src={moebel.bildUrl} alt={moebel.name} loading="lazy" />;
  return (
    <svg viewBox="0 0 200 150" role="img" aria-label={`Zeichnung: ${moebel.name}`}>
      <MoebelZeichnung art={moebel.kategorie} c={farbeVon(moebel)} />
    </svg>
  );
}

// ---------- Ampel, Preise, Produktkarte ----------

export const AMPEL_TEXT: Record<Ampel, string> = { gruen: "Passt", gelb: "Knapp", rot: "Passt nicht" };

export function AmpelSchild({ ampel }: { ampel: Ampel }) {
  return <span className={`ampel-schild ${ampel}`}>{AMPEL_TEXT[ampel]}</span>;
}

/** Preis mit ReRoom (nach 4 % Cashback), nur für neue Möbel. Werbesatz aus dem Businessplan. */
export function MitReRoom({ moebel }: { moebel: Moebel }) {
  if (moebel.zustand !== "neu") return null;
  const cent = alsCent(moebel.preis);
  return <span className="mit-reroom">mit ReRoom {euro(cent - cashbackCent(cent, cashbackProzent()))}</span>;
}

export function kurzInfo(m: Moebel): string {
  return m.zustand === "gebraucht" ? `Gebraucht · ${m.entfernungKm ?? "?"} km` : `Neu · ${m.anbieter}`;
}

export function ProduktKarte({ moebel, ampel, onOeffnen }: { moebel: Moebel; ampel?: Ampel; onOeffnen: () => void }) {
  return (
    <button className="produkt" onClick={onOeffnen} aria-label={`${moebel.name}, ${euro(alsCent(moebel.preis))}`}>
      <span className="produkt-bild">
        <MoebelBild moebel={moebel} />
        {ampel && <AmpelSchild ampel={ampel} />}
        {moebel.hervorgehoben && <span className="hervorgehoben-schild">Oben</span>}
      </span>
      <span className="produkt-preis">{euro(alsCent(moebel.preis))}</span>
      <MitReRoom moebel={moebel} />
      <span className="produkt-name">{moebel.name}</span>
      <span className="produkt-meta">{kurzInfo(moebel)}</span>
    </button>
  );
}

// ---------- Grundriss mit Möbeln ----------

interface GrundrissProps {
  raum: Raum;
  platziert?: Platzierung[];
  /** Dieses Möbel wird orange umrandet, die anderen treten zurück */
  hervorheben?: string;
  /** Gestrichelter Weg von der Tür zum hervorgehobenen Möbel, mit Hinweis zum Spielraum */
  weg?: string;
  onMoebel?: (id: string) => void;
  /** Möbel lassen sich mit dem Finger verschieben; Position in cm (obere linke Ecke), schon auf 5 cm gerastet */
  onVerschieben?: (id: string, xCm: number, yCm: number) => void;
  /** Prüft live, ob das Möbel dort stehen darf (sonst wird es rot) */
  darfStehen?: (id: string, xCm: number, yCm: number) => boolean;
}

const RASTER_VERSCHIEBEN_CM = 5;

/** Maßstäblicher Grundriss (Draufsicht) mit Tür unten links und optional platzierten Möbeln. */
export function Grundriss({ raum, platziert = [], hervorheben, weg, onMoebel, onVerschieben, darfStehen }: GrundrissProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Beim Ziehen: aktuelle Lage in cm, und ob schon wirklich gezogen wurde (sonst ist es ein Tippen)
  const [zug, setZug] = useState<{ id: string; x: number; y: number; dx: number; dy: number; bewegt: boolean }>();
  const FLAECHE = 230;
  const s = Math.min(FLAECHE / raum.breiteCm, FLAECHE / raum.tiefeCm);
  const w = raum.breiteCm * s, h = raum.tiefeCm * s;
  const x0 = 20 + (FLAECHE - w) / 2, y0 = 12;
  const tuer = raum.tuerBreiteCm * s;
  const tx = x0 + TUER_ABSTAND_CM * s, ty = y0 + h;
  const m = (cm: number) => `${(cm / 100).toFixed(2).replace(".", ",")} m`;
  const ziel = platziert.find((p) => p.moebel.id === hervorheben);
  // Teppiche zuerst zeichnen, damit sie unter den anderen Möbeln liegen
  const reihenfolge = [...platziert].sort((a, b) => Number(b.moebel.kategorie === "teppich") - Number(a.moebel.kategorie === "teppich"));

  return (
    <svg ref={svgRef} className="grundriss" style={onVerschieben ? { touchAction: "none" } : undefined} viewBox={`0 0 300 ${h + 44}`} role="img" aria-label={`Grundriss ${m(raum.breiteCm)} mal ${m(raum.tiefeCm)} mit ${platziert.length} Möbeln`}>
      <defs>
        <marker id="pfeil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10z" fill="var(--orange)" /></marker>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill="rgb(255 255 255 / .04)" stroke="#fff" strokeWidth="3.5" />
      <rect x={tx} y={ty - 2} width={tuer} height="5" fill="var(--raumkarte)" />
      <path d={`M${tx} ${ty} A${tuer} ${tuer} 0 0 1 ${tx + tuer} ${ty - tuer}`} fill="none" stroke="var(--orange)" strokeWidth="1.6" strokeDasharray="3 3" />
      <line x1={tx} y1={ty} x2={tx} y2={ty - tuer} stroke="var(--orange)" strokeWidth="2.5" />

      {reihenfolge.map((p) => {
        const gezogen = zug?.id === p.moebel.id && zug.bewegt ? zug : undefined;
        const px = x0 + (gezogen?.x ?? p.x) * s, py = y0 + (gezogen?.y ?? p.y) * s, pw = p.w * s, ph = p.h * s;
        const verboten = gezogen && darfStehen ? !darfStehen(p.moebel.id, gezogen.x, gezogen.y) : false;
        const aktiv = p.moebel.id === hervorheben;
        const leise = hervorheben !== undefined && !aktiv;
        const titel = p.moebel.name.split(" ")[0]!;
        return (
          <g
            key={p.moebel.id}
            className={onMoebel ? "fussabdruck klickbar" : "fussabdruck"}
            opacity={leise ? 0.35 : 1}
            style={onVerschieben ? { cursor: "grab" } : undefined}
            onClick={onMoebel && !onVerschieben ? () => onMoebel(p.moebel.id) : undefined}
            onPointerDown={onVerschieben ? (e) => {
              const svg = svgRef.current;
              if (!svg) return;
              const ctm = svg.getScreenCTM();
              if (!ctm) return;
              // Abstand zwischen Finger und Möbel-Ecke merken, damit das Möbel nicht springt
              const fx = (e.clientX - ctm.e) / ctm.a, fy = (e.clientY - ctm.f) / ctm.d;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ohne aktiven Zeiger egal */ }
              setZug({ id: p.moebel.id, x: p.x, y: p.y, dx: fx / s - x0 / s - p.x, dy: fy / s - y0 / s - p.y, bewegt: false });
            } : undefined}
            onPointerMove={onVerschieben ? (e) => {
              if (!zug || zug.id !== p.moebel.id) return;
              const ctm = svgRef.current?.getScreenCTM();
              if (!ctm) return;
              const fx = (e.clientX - ctm.e) / ctm.a, fy = (e.clientY - ctm.f) / ctm.d;
              const raster = (v: number) => Math.round(v / RASTER_VERSCHIEBEN_CM) * RASTER_VERSCHIEBEN_CM;
              const x = Math.min(Math.max(0, raster(fx / s - x0 / s - zug.dx)), raum.breiteCm - p.w);
              const y = Math.min(Math.max(0, raster(fy / s - y0 / s - zug.dy)), raum.tiefeCm - p.h);
              setZug({ ...zug, x, y, bewegt: zug.bewegt || x !== p.x || y !== p.y });
            } : undefined}
            onPointerUp={onVerschieben ? () => {
              if (zug?.id === p.moebel.id) {
                if (zug.bewegt) onVerschieben(p.moebel.id, zug.x, zug.y);
                else onMoebel?.(p.moebel.id);
              }
              setZug(undefined);
            } : undefined}
            onPointerCancel={onVerschieben ? () => setZug(undefined) : undefined}
          >
            <rect x={px} y={py} width={pw} height={ph} rx="4" fill={farbeVon(p.moebel)} stroke={verboten ? "#D93025" : aktiv ? "var(--orange)" : "rgb(0 0 0 / .25)"} strokeWidth={aktiv || gezogen ? 2.5 : 1} />
            {pw > 30 && ph > 14 && (
              <text x={px + pw / 2} y={py + ph / 2} textAnchor="middle" dominantBaseline="middle" className="fuss-text" fill={p.moebel.farben[0] === "weiss" ? "#111" : "#fff"}>
                {titel}
              </text>
            )}
          </g>
        );
      })}

      {ziel && weg && (
        <>
          <path
            d={`M${tx + tuer / 2} ${ty + 14} L${tx + tuer / 2} ${ty - tuer} Q${tx + tuer / 2} ${y0 + (ziel.y + ziel.h) * s + 30} ${x0 + (ziel.x + ziel.w / 2) * s} ${y0 + (ziel.y + ziel.h) * s + 4}`}
            fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#pfeil)"
          />
          <g transform={`translate(${tx + tuer + 6} ${ty - 22})`}>
            <rect width="92" height="20" rx="10" fill="var(--gelb-bg)" />
            <text x="46" y="10.5" textAnchor="middle" dominantBaseline="middle" className="weg-text">{weg}</text>
          </g>
        </>
      )}

      <text x={x0 + w / 2} y={y0 + h + 22} textAnchor="middle">{m(raum.breiteCm)}</text>
      <text x={x0 + w + 8} y={y0 + h / 2} dominantBaseline="middle">{m(raum.tiefeCm)}</text>
    </svg>
  );
}

export function Leer({ titel, children }: { titel: string; children?: ReactNode }) {
  return (
    <div className="leer">
      <strong>{titel}</strong>
      {children}
    </div>
  );
}
