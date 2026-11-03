import { useState } from "react";
import type { Raum } from "../models/types";

// Auf Windows/Web gibt es kein LiDAR (RoomPlan): Der Raum wird von Hand eingegeben.
// Ein echter Scan kommt später mit der iPhone-App (siehe CLAUDE.md, Stufe 4).
export default function Scannen({ onSpeichern }: { onSpeichern: (r: Raum) => void }) {
  const [f, setF] = useState({ name: "", breite: "400", tiefe: "500", hoehe: "250", tuerB: "85", tuerH: "205", treppe: "110" });
  const zahl = (s: string) => Number(s);
  const gueltig = f.name.trim() !== "" && Object.entries(f).every(([k, v]) => k === "name" || zahl(v) > 0);

  const feld = (k: keyof typeof f, label: string) => (
    <label>
      {label}
      <input inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  );

  return (
    <section>
      <h1>Raum anlegen</h1>
      <p className="gedaempft">Alle Maße in Zentimetern. Der automatische Scan ist nur auf dem iPhone mit LiDAR möglich.</p>
      <div className="karte">
        <label>
          Name
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="z. B. Mein Wohnzimmer" />
        </label>
        {feld("breite", "Raumbreite")}
        {feld("tiefe", "Raumtiefe")}
        {feld("hoehe", "Raumhöhe")}
        {feld("tuerB", "Türbreite")}
        {feld("tuerH", "Türhöhe")}
        {feld("treppe", "Treppenhausbreite")}
        <button
          className="primaer"
          disabled={!gueltig}
          onClick={() =>
            onSpeichern({
              id: `raum-${Date.now()}`,
              name: f.name.trim(),
              breiteCm: zahl(f.breite),
              tiefeCm: zahl(f.tiefe),
              hoeheCm: zahl(f.hoehe),
              tuerBreiteCm: zahl(f.tuerB),
              tuerHoeheCm: zahl(f.tuerH),
              treppenhausBreiteCm: zahl(f.treppe),
            })
          }
        >
          Raum speichern
        </button>
      </div>
    </section>
  );
}
