import { useEffect, useState } from "react";
import { INSPO_KARTEN } from "../data/inspo";
import { arPruefen } from "../services/arSitzung";
import { istApple } from "../logic/arStatus";
import { DEMO_HINWEIS, messArt, SLOGAN, willkommenMessText, type MessArt } from "../logic/texte";
import { Moodboard } from "./Moodboard";
import { FARBE, Icon, MoebelZeichnung } from "./ui";

interface Props {
  onMessen: () => void;
  onStilFinder: () => void;
  onStoebern: () => void;
}

// Bild 1: Handy misst den Raum
function BildMessen() {
  return (
    <svg viewBox="0 0 340 300" role="img" aria-label="Ein Handy misst den Raum mit der Kamera">
      <rect width="340" height="300" rx="24" fill="var(--karte)" />
      <path d="M20 210 120 150h200v150H20z" fill="#E2DCD2" /><path d="M120 20v130M120 150 20 210" stroke="#CFC8BC" strokeWidth="2" />
      <rect x="200" y="60" width="70" height="90" fill="#E8E4DC" stroke="#CFC8BC" strokeWidth="2" />
      <g transform="translate(150 110) rotate(-8)">
        <rect width="120" height="200" rx="18" fill="#111" /><rect x="6" y="10" width="108" height="180" rx="12" fill="#3A3A3A" />
        <path d="M20 150 60 120h50v60H20z" fill="#5A544B" /><ellipse cx="62" cy="140" rx="14" ry="5" fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx="30" cy="160" r="4" fill="#FF5B2E" /><circle cx="96" cy="128" r="4" fill="#FF5B2E" />
        <line x1="30" y1="160" x2="96" y2="128" stroke="#FF5B2E" strokeWidth="2" />
        <rect x="34" y="96" width="54" height="20" rx="10" fill="#fff" />
        <text x="61" y="106.5" textAnchor="middle" dominantBaseline="middle" className="bild-text">412 cm</text>
      </g>
      <path d="M40 60h24M40 60v24M300 260h-24M300 260v-24" stroke="#FF5B2E" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Bild 3: Preisschild mit Cashback
function BildSparen() {
  return (
    <svg viewBox="0 0 340 300" role="img" aria-label="Sofa mit Preisschild: 800 Euro, mit ReRoom 768 Euro">
      <rect width="340" height="300" rx="24" fill="var(--karte)" />
      <g transform="translate(40 40) scale(1.3)"><MoebelZeichnung art="sofa" c={FARBE.terrakotta!} /></g>
      <g transform="translate(196 28) rotate(8)">
        <rect width="120" height="92" rx="14" fill="#fff" stroke="#111" strokeWidth="2" />
        <circle cx="18" cy="18" r="6" fill="none" stroke="#111" strokeWidth="2" />
        <text x="60" y="40" textAnchor="middle" className="bild-preis alt">800 €</text>
        <text x="60" y="72" textAnchor="middle" className="bild-preis">768 €</text>
      </g>
      <g transform="translate(36 214)">
        <rect width="150" height="44" rx="22" fill="#111" />
        <text x="75" y="23" textAnchor="middle" dominantBaseline="middle" className="bild-text hell">− 4 % Cashback</text>
      </g>
    </svg>
  );
}

const SEITEN = [
  {
    bild: <BildMessen />,
    ...willkommenMessText("sonst"), // wird je Gerät ersetzt, siehe unten
  },
  {
    bild: <div className="willkommen-moodboard"><Moodboard karte={INSPO_KARTEN[0]!} /></div>,
    titel: "Finde deinen Stil",
    text: "Wisch durch Einrichtungsbilder. ReRoom erkennt deinen Stil und stellt ein Set fürs ganze Zimmer zusammen, passend zu deinem Budget.",
  },
  {
    bild: <BildSparen />,
    titel: "Neu und gebraucht. Mit 4 % zurück.",
    text: "Neue Möbel von Partner-Shops und gebrauchte aus deiner Nähe in Chemnitz. Bei neuen Möbeln bekommst du 4 % zurück.",
  },
];

/** Einstieg beim ersten Besuch: drei Karten, jederzeit überspringbar. */
export default function Willkommen({ onMessen, onStilFinder, onStoebern }: Props) {
  const [seite, setSeite] = useState(0);
  const [art, setArt] = useState<MessArt>(messArt(false, istApple(navigator.userAgent)));
  useEffect(() => {
    arPruefen().then((status) => setArt(messArt(status.ok, istApple(navigator.userAgent))));
  }, []);
  // Die Mess-Karte verspricht die Kamera nur, wo sie wirklich misst
  const seiten = SEITEN.map((x, i) => (i === 0 ? { ...x, ...willkommenMessText(art) } : x));
  const s = seiten[seite]!;
  const letzte = seite === seiten.length - 1;

  return (
    <div className="vollbild willkommen" role="dialog" aria-modal="true" aria-label="Willkommen bei ReRoom">
      <div className="vollbild-innen">
        <div className="reihe">
          <p className="marke" style={{ fontSize: "1.3rem" }}>ReRoom<i /></p>
          <button className="link" onClick={onStoebern}>Überspringen</button>
        </div>
        <p className="slogan" style={{ margin: "2px 0 0" }}>{SLOGAN}</p>
        <div className="willkommen-bild">{s.bild}</div>
        <div className="seiten" aria-label={`Seite ${seite + 1} von ${seiten.length}`}>
          {seiten.map((_, i) => (
            <button key={i} className={i === seite ? "an" : ""} onClick={() => setSeite(i)} aria-label={`Seite ${i + 1}`} />
          ))}
        </div>
        <h1 className="willkommen-titel">{s.titel}</h1>
        <p className="gedaempft willkommen-text">{s.text}</p>
        {letzte && <p className="gedaempft" style={{ fontSize: ".8rem", margin: "8px 0 0" }}>{DEMO_HINWEIS}</p>}

        <div className="willkommen-knoepfe">
          {seite === 0 && <button className="knopf breit" onClick={() => setSeite(1)}>Weiter</button>}
          {seite === 1 && (
            <>
              <button className="knopf breit" onClick={() => setSeite(2)}>Weiter</button>
              <button className="knopf breit zweit" onClick={onStilFinder}>Stil-Finder ausprobieren</button>
            </>
          )}
          {letzte && (
            <>
              <button className="knopf breit" onClick={onMessen}><Icon name="kamera" /> Raum ausmessen</button>
              <button className="knopf breit zweit" onClick={onStoebern}>Erst stöbern</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
