import { useEffect, useState } from "react";
import { arPruefen } from "../services/arSitzung";
import { istApple } from "../logic/arStatus";
import { cashbackProzent } from "../logic/aktion";
import { DEMO_HINWEIS, messArt, messKachel, SLOGAN, type MessArt } from "../logic/texte";
import { FARBE, Icon, Logo, MoebelZeichnung, type IconName } from "./ui";

interface Props {
  onMessen: () => void;
  onStilFinder: () => void;
  onStoebern: () => void;
}

/** Kleine Szene für den Einstieg: Sofa mit Maßlinie, ohne Text. */
function Szene() {
  return (
    <svg className="einstieg-szene" viewBox="0 0 320 200" aria-hidden="true">
      <defs><clipPath id="einstieg-rahmen"><rect width="320" height="200" rx="28" /></clipPath></defs>
      <g clipPath="url(#einstieg-rahmen)">
        <rect width="320" height="200" fill="var(--pastell)" />
        <ellipse cx="160" cy="176" rx="120" ry="10" fill="var(--pastell-stark)" />
        <g transform="translate(48 56) scale(1.1)"><MoebelZeichnung art="sofa" c={FARBE.grau!} /></g>
        <g transform="translate(232 92) scale(.5)"><MoebelZeichnung art="pflanze" c={FARBE.holz!} /></g>
        <path d="M56 36h208M56 30v12M264 30v12" stroke="var(--orange)" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

/** Einstieg beim ersten Besuch: am Handy erst nur Überschrift, ein Satz und ein Knopf, die Erklärung darunter als Kacheln. */
export default function Willkommen({ onMessen, onStilFinder, onStoebern }: Props) {
  const [art, setArt] = useState<MessArt>(messArt(false, istApple(navigator.userAgent)));
  useEffect(() => {
    arPruefen().then((status) => setArt(messArt(status.ok, istApple(navigator.userAgent))));
  }, []);

  const prozent = cashbackProzent();
  const messen = messKachel(art);
  const kacheln: { icon: IconName; titel: string; zusatz: string }[] = [
    { icon: "kamera", ...messen },
    { icon: "raum", titel: "Passt-Check", zusatz: "Tür, Treppe, Raum" },
    { icon: "herz", titel: "Stil finden", zusatz: "Bilder wischen" },
    { icon: "etikett", titel: "Neu und gebraucht", zusatz: "in einer App" },
    { icon: "tasche", titel: `${prozent} % Cashback`, zusatz: "auf neue Möbel" },
    { icon: "wuerfel", titel: "3D-Rundgang", zusatz: "dein Zimmer fertig" },
  ];

  return (
    <div className="vollbild willkommen" role="dialog" aria-modal="true" aria-label="Willkommen bei ReRoom">
      <div className="vollbild-innen einstieg">
        <header className="einstieg-kopf">
          <Logo />
          <button className="link" onClick={onStoebern}>Überspringen</button>
        </header>

        <section className="einstieg-hero" aria-label="Start">
          <Szene />
          <h1 className="einstieg-titel">Möbel, die wirklich passen.</h1>
          <p className="einstieg-unter">{SLOGAN}</p>
          <button className="knopf breit pastell" onClick={onMessen}><Icon name="kamera" /> Raum ausmessen</button>
          <button className="link einstieg-zweit" onClick={onStoebern}>Erst stöbern</button>
        </section>

        <section className="einstieg-mehr" aria-label="Das kann ReRoom">
          <h2>Das kann ReRoom</h2>
          <ul className="kacheln">
            {kacheln.map((k) => (
              <li key={k.titel} className="kachel">
                <span className="kachel-icon"><Icon name={k.icon} groesse={24} /></span>
                <strong>{k.titel}</strong>
                <span>{k.zusatz}</span>
              </li>
            ))}
          </ul>
          <button className="knopf breit zweit" onClick={onStilFinder}>Stil-Finder ausprobieren</button>
          <p className="einstieg-hinweis">{DEMO_HINWEIS}</p>
        </section>
      </div>
    </div>
  );
}
