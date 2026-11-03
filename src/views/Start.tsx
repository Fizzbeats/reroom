import type { Raum } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";

interface Props {
  raeume: Raum[];
  aktiverRaum: string;
  onWaehlen: (id: string) => void;
  onMessen: () => void;
  onEntdecken: () => void;
}

/** Startseite als geführter Weg: Raum messen → Stil wählen → passende Möbel. */
export default function Start({ raeume, aktiverRaum, onWaehlen, onMessen, onEntdecken }: Props) {
  const alle = [...raeume, ...BEISPIELRAEUME];
  const raum = alle.find((r) => r.id === aktiverRaum);
  const schritte = [
    { titel: "Raum ausmessen", text: raum ? `${raum.name} · Tür ${raum.tuerBreiteCm} cm` : "Mit der Kamera, ganz ohne Zollstock" },
    { titel: "Stil wählen", text: "Stil, Budget und Farben" },
    { titel: "Passende Möbel finden", text: "Neu und gebraucht, mit Passt-Check" },
  ];
  const dran = raum ? 1 : 0;

  return (
    <section>
      <h1>ReRoom</h1>
      <p className="slogan">Ausmessen, Stil wählen, günstiger einrichten.</p>

      <ol className="schritte">
        {schritte.map((s, i) => (
          <li key={s.titel} className={`schritt ${i < dran ? "erledigt" : ""} ${i === dran ? "dran" : ""}`}>
            <span className="nr" aria-hidden="true">{i < dran ? "✓" : i + 1}</span>
            <span>
              <strong>{s.titel}</strong>
              <small>{s.text}</small>
            </span>
          </li>
        ))}
      </ol>

      {raum ? (
        <button className="primaer" style={{ width: "100%" }} onClick={onEntdecken}>Weiter: Stil wählen</button>
      ) : (
        <button className="primaer" style={{ width: "100%" }} onClick={onMessen}>Raum ausmessen</button>
      )}

      <h2>Meine Räume</h2>
      {raeume.length === 0 && <p className="gedaempft">Noch kein eigener Raum. Zum Ausprobieren kannst du einen Beispielraum wählen.</p>}
      {alle.map((r) => (
        <div className="karte reihe" key={r.id}>
          <div>
            <strong>{r.name}</strong>
            {BEISPIELRAEUME.includes(r) && <span className="gedaempft"> · Beispiel</span>}
            <div className="gedaempft">
              {r.breiteCm / 100} × {r.tiefeCm / 100} m · Tür {r.tuerBreiteCm} × {r.tuerHoeheCm} cm · Treppe {r.treppenhausBreiteCm} cm
            </div>
          </div>
          <button className={r.id === aktiverRaum ? "primaer" : ""} onClick={() => onWaehlen(r.id)} aria-pressed={r.id === aktiverRaum}>
            {r.id === aktiverRaum ? "Aktiv" : "Verwenden"}
          </button>
        </div>
      ))}
    </section>
  );
}
