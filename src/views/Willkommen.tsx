import { cashbackProzent } from "../logic/aktion";
import { DEMO_HINWEIS, SLOGAN } from "../logic/texte";
import { Icon, Logo } from "./ui";

interface Props {
  onMessen: () => void;
  onStilFinder: () => void;
  onStoebern: () => void;
}

/** Einstieg beim ersten Besuch: weinrote Fläche mit Überschrift, ein Satz, ein Knopf und drei kurze Zeilen. Die Navigation unten bleibt sichtbar. */
export default function Willkommen({ onMessen, onStilFinder, onStoebern }: Props) {
  const prozent = cashbackProzent();
  return (
    <div className="vollbild willkommen" role="dialog" aria-label="Willkommen bei ReRoom">
      <div className="einstieg">
        <header className="einstieg-hero">
          <div className="einstieg-kopf">
            <Logo />
            <button className="link" onClick={onStoebern}>Überspringen</button>
          </div>
          <h1 className="einstieg-titel">Möbel, die wirklich passen.</h1>
        </header>

        <section className="einstieg-body" aria-label="Start">
          <p className="einstieg-unter">{SLOGAN}</p>
          <button className="knopf breit" onClick={onMessen}><Icon name="kamera" /> Raum ausmessen</button>
          <ul className="einstieg-zeilen">
            <li><button onClick={onStoebern}><b>Passt-Check</b><span>Tür, Treppe, Raum</span></button></li>
            <li><button onClick={onStilFinder}><b>Stil finden</b><span>Bilder wischen</span></button></li>
            <li><button onClick={onStoebern}><b>{prozent}{"\u00a0"}% Cashback</b><span>auf neue Möbel</span></button></li>
          </ul>
          <p className="einstieg-hinweis">{DEMO_HINWEIS}</p>
        </section>
      </div>
    </div>
  );
}
