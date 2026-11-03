import { useState } from "react";
import { MESS_SCHRITTE, pruefeEingabe, type MessKey } from "../logic/messSchritte";
import KameraMesser from "./KameraMesser";
import { Icon } from "./ui";

interface Props {
  /** Schon eingetragene Werte in cm als Text */
  werte: Record<MessKey, string>;
  onWert: (key: MessKey, cm: number) => void;
  onFertig: () => void;
  onAlleEintippen: () => void;
  /** iPhone oder iPad: dann gibt es die Maßband-App */
  apple: boolean;
}

const PFEIL = "var(--orange)";

/** Kleine Skizze, die zeigt, was gemessen wird. */
function Skizze({ art }: { art: MessKey }) {
  const wand = { stroke: "currentColor", strokeWidth: 3, fill: "none", strokeLinejoin: "round" as const };
  const pfeil = { stroke: PFEIL, strokeWidth: 3, strokeLinecap: "round" as const };
  return (
    <svg className="skizze" viewBox="0 0 200 120" role="img" aria-label="Skizze der Messung">
      <defs>
        <marker id="spitze" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill={PFEIL} /></marker>
      </defs>
      {(art === "tuerB" || art === "tuerH") && (
        <>
          <rect x="70" y="10" width="60" height="100" rx="2" {...wand} />
          <circle cx="120" cy="62" r="3" fill="currentColor" />
          {art === "tuerB" ? <line x1="72" y1="60" x2="128" y2="60" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />
            : <line x1="150" y1="12" x2="150" y2="108" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />}
        </>
      )}
      {art === "treppe" && (
        <>
          <path d="M60 10v100M140 10v100" {...wand} />
          <path d="M60 90h-20M60 70h-20M60 50h-20M60 30h-20" stroke="currentColor" strokeWidth="2" opacity=".35" />
          <line x1="62" y1="60" x2="138" y2="60" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />
        </>
      )}
      {(art === "breite" || art === "tiefe") && (
        <>
          <rect x="40" y="14" width="120" height="84" {...wand} />
          <rect x="52" y="94" width="18" height="6" fill="var(--hintergrund)" stroke="none" />
          {art === "breite" ? <line x1="42" y1="110" x2="158" y2="110" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />
            : <line x1="178" y1="16" x2="178" y2="96" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />}
        </>
      )}
      {art === "hoehe" && (
        <>
          <path d="M30 14h140M30 106h140" {...wand} />
          <line x1="100" y1="16" x2="100" y2="104" {...pfeil} markerStart="url(#spitze)" markerEnd="url(#spitze)" />
        </>
      )}
    </svg>
  );
}

/** Führt durch die sechs Maße, eines pro Bildschirm. Misst per Foto oder mit der Maßband-App des iPhones. */
export default function MessAssistent({ werte, onWert, onFertig, onAlleEintippen, apple }: Props) {
  const [nr, setNr] = useState(0);
  const [foto, setFoto] = useState(false);
  const s = MESS_SCHRITTE[nr]!;
  const [eingabe, setEingabe] = useState(werte[s.key] ?? "");
  const pruefung = pruefeEingabe(s, eingabe);
  const kannWeiter = pruefung.status === "ok" || pruefung.status === "warnung";
  const letzte = nr === MESS_SCHRITTE.length - 1;

  function weiter() {
    if (pruefung.cm === undefined) return;
    onWert(s.key, pruefung.cm);
    if (letzte) return onFertig();
    const naechster = MESS_SCHRITTE[nr + 1]!;
    setNr(nr + 1);
    setFoto(false);
    setEingabe(werte[naechster.key] ?? "");
  }

  function zurueck() {
    const vorher = MESS_SCHRITTE[nr - 1]!;
    setNr(nr - 1);
    setFoto(false);
    setEingabe(werte[vorher.key] ?? "");
  }

  return (
    <div className="flaeche assistent">
      <div className="reihe">
        <span className="gedaempft">Schritt {nr + 1} von {MESS_SCHRITTE.length}</span>
        <button className="link" onClick={onAlleEintippen}>Alles auf einmal eintippen</button>
      </div>
      <div className="fortschritt"><i style={{ width: `${((nr + 1) / MESS_SCHRITTE.length) * 100}%` }} /></div>

      <Skizze art={s.key} />
      <h2 style={{ margin: "4px 0 0" }}>{s.titel}</h2>
      <p className="gedaempft" style={{ margin: 0 }}>{s.anleitung}</p>

      <label>
        {s.name} in cm
        <input
          inputMode="decimal"
          autoComplete="off"
          value={eingabe}
          placeholder={`z. B. ${s.beispiel}`}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && kannWeiter && weiter()}
          aria-describedby="eingabe-hinweis"
        />
      </label>
      <p id="eingabe-hinweis" role="status" className={pruefung.status === "warnung" || pruefung.status === "ungueltig" ? "hinweis" : "gedaempft"} style={{ minHeight: "1.4em", margin: 0 }}>
        {pruefung.text ?? ""}
      </p>

      <div className="werkzeuge">
        <button className="knopf leise" onClick={() => setFoto(!foto)} aria-expanded={foto}>
          <Icon name="foto" groesse={18} /> Mit Foto messen
        </button>
        {apple && (
          <a className="knopf leise" href="measure://">
            <Icon name="kamera" groesse={18} /> Maßband-App öffnen
          </a>
        )}
      </div>
      {apple && (
        <p className="gedaempft" style={{ margin: 0, fontSize: ".82rem" }}>
          Die Maßband-App misst mit der Kamera deines iPhones. Tippe auf „Messen“ und die Enden an, dann trägst du den Wert hier ein. Öffnet sie sich nicht, findest du sie im Ordner „Dienstprogramme“.
        </p>
      )}

      {foto && (
        <KameraMesser
          festesZiel={s.key}
          onWert={(_ziel, cm) => {
            setEingabe(String(cm));
            setFoto(false);
          }}
        />
      )}

      <div className="reihe" style={{ marginTop: 6 }}>
        {nr > 0 && <button className="knopf leise" onClick={zurueck}>Zurück</button>}
        <button className="knopf" disabled={!kannWeiter} onClick={weiter}>{letzte ? "Fertig" : "Weiter"}</button>
      </div>
    </div>
  );
}
