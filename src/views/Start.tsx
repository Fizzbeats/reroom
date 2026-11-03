import type { Raum } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";
import Szene from "./Szene";

interface Props {
  raeume: Raum[];
  aktiverRaum: string;
  onWaehlen: (id: string) => void;
  onScannen: () => void;
}

export default function Start({ raeume, aktiverRaum, onWaehlen, onScannen }: Props) {
  const alle = [...raeume, ...BEISPIELRAEUME];
  return (
    <section>
      <h1>ReRoom</h1>
      <p className="slogan">Scannen, Stil wählen, günstiger einrichten.</p>
      <Szene />
      <h2>Meine Räume</h2>
      {alle.map((r) => (
        <div className="karte reihe" key={r.id}>
          <div>
            <strong>{r.name}</strong>
            <div className="gedaempft">
              {r.breiteCm / 100} × {r.tiefeCm / 100} m · Tür {r.tuerBreiteCm} × {r.tuerHoeheCm} cm · Treppenhaus {r.treppenhausBreiteCm} cm
            </div>
          </div>
          <button className={r.id === aktiverRaum ? "primaer" : ""} onClick={() => onWaehlen(r.id)} aria-pressed={r.id === aktiverRaum}>
            {r.id === aktiverRaum ? "Ausgewählt" : "Auswählen"}
          </button>
        </div>
      ))}
      <button className="primaer" onClick={onScannen}>Neuen Raum anlegen</button>
    </section>
  );
}
