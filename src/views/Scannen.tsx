import { useEffect, useState } from "react";
import type { Raum } from "../models/types";
import { arPruefen } from "../services/arSitzung";
import type { ArStatus } from "../logic/arStatus";
import ArMesser from "./ArMesser";
import KameraMesser, { type Ziel } from "./KameraMesser";

type Felder = Record<Ziel, string> & { name: string };

const LEER: Felder = { name: "", breite: "", tiefe: "", hoehe: "", tuerB: "", tuerH: "", treppe: "" };

// Mit AR-Kamera (Android) misst die App selbst. Ohne AR (z. B. iPhone im Browser)
// gibt es die Foto-Messung mit Bankkarte oder Eintippen.
export default function Scannen({ onSpeichern }: { onSpeichern: (r: Raum) => void }) {
  const [ar, setAr] = useState<ArStatus>();
  const [f, setF] = useState<Felder>(LEER);
  const [gemessen, setGemessen] = useState(false);

  useEffect(() => {
    arPruefen().then(setAr);
  }, []);

  const zahl = (s: string) => Number(s.replace(",", "."));
  const gueltig = f.name.trim() !== "" && (Object.keys(LEER) as (keyof Felder)[]).every((k) => k === "name" || zahl(f[k]) > 0);

  const feld = (k: Ziel, label: string, beispiel: string) => (
    <label>
      {label} (cm)
      <input inputMode="numeric" value={f[k]} placeholder={`z. B. ${beispiel}`} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  );

  return (
    <section>
      <h1>Raum messen</h1>

      {ar?.ok === true && (
        <ArMesser
          onFertig={(werte) => {
            setF((alt) => ({ ...alt, ...Object.fromEntries(Object.entries(werte).map(([k, v]) => [k, String(v)])) }));
            setGemessen(true);
          }}
        />
      )}

      {ar && !ar.ok && (
        <>
          <p className="hinweis" role="status">{ar.text}</p>
          <KameraMesser onWert={(ziel, cm) => setF({ ...f, [ziel]: String(cm) })} />
        </>
      )}

      <div className="flaeche">
        <h2>{gemessen ? "Gemessene Werte prüfen" : "Maße"}</h2>
        {gemessen && <p className="gedaempft">Fehlt ein Wert, kannst du ihn hier ergänzen.</p>}
        <label>
          Name des Raums
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="z. B. Mein Wohnzimmer" />
        </label>
        {feld("breite", "Raumbreite", "400")}
        {feld("tiefe", "Raumtiefe", "500")}
        {feld("hoehe", "Raumhöhe", "250")}
        {feld("tuerB", "Türbreite", "85")}
        {feld("tuerH", "Türhöhe", "205")}
        {feld("treppe", "Treppenhaus an der engsten Stelle", "110")}
        <button
          className="knopf"
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
