import { useEffect, useState } from "react";
import type { Raum } from "../models/types";
import { arPruefen } from "../services/arSitzung";
import { istApple, type ArStatus } from "../logic/arStatus";
import { MESS_SCHRITTE, pruefeEingabe, type MessKey } from "../logic/messSchritte";
import ArMesser from "./ArMesser";
import MessAssistent from "./MessAssistent";

type Felder = Record<MessKey, string> & { name: string };

const LEER: Felder = { name: "", breite: "", tiefe: "", hoehe: "", tuerB: "", tuerH: "", treppe: "" };

/**
 * Raum messen. Auf Android mit Chrome misst die AR-Kamera von allein.
 * Überall sonst (z. B. iPhone) führt der Assistent durch die Maße, mit Foto oder Maßband-App.
 */
interface Props {
  onSpeichern: (r: Raum) => void;
  /** Der Tarif erlaubt keinen weiteren Raum */
  limitErreicht: boolean;
  tarifName: string;
  maxRaeume: number;
  onErsetzen: () => void;
  onTarife: () => void;
}

export default function Scannen({ onSpeichern, limitErreicht, tarifName, maxRaeume, onErsetzen, onTarife }: Props) {
  const [ar, setAr] = useState<ArStatus>();
  const [f, setF] = useState<Felder>(LEER);
  const [fertigGemessen, setFertigGemessen] = useState(false);

  useEffect(() => {
    arPruefen().then(setAr);
  }, []);

  const apple = istApple(navigator.userAgent);
  const werte = Object.fromEntries(MESS_SCHRITTE.map((s) => [s.key, pruefeEingabe(s, f[s.key]).cm])) as Record<MessKey, number | undefined>;
  const gueltig = f.name.trim() !== "" && MESS_SCHRITTE.every((s) => (werte[s.key] ?? 0) > 0);
  const zeigeFormular = ar?.ok === true || fertigGemessen;

  const feld = (s: (typeof MESS_SCHRITTE)[number]) => {
    const p = pruefeEingabe(s, f[s.key]);
    return (
      <label key={s.key}>
        {s.name} (cm)
        <input
          inputMode="decimal"
          value={f[s.key]}
          placeholder={`z. B. ${s.beispiel}`}
          onChange={(e) => setF({ ...f, [s.key]: e.target.value })}
          aria-invalid={p.status === "ungueltig"}
        />
        {(p.status === "warnung" || p.status === "ungueltig") && <span className="feld-hinweis">{p.text}</span>}
      </label>
    );
  };

  if (limitErreicht) {
    return (
      <section>
        <h1>Raum messen</h1>
        <div className="flaeche">
          <h2 style={{ margin: 0 }}>{tarifName} hat Platz für {maxRaeume} {maxRaeume === 1 ? "Raum" : "Räume"}</h2>
          <p className="gedaempft" style={{ margin: 0 }}>Du kannst deinen gespeicherten Raum ersetzen oder einen Tarif mit mehr Räumen wählen. Die Beispielräume bleiben immer frei.</p>
          <button className="knopf breit" onClick={onErsetzen}>Gespeicherten Raum ersetzen</button>
          <button className="knopf leise breit" onClick={onTarife}>Tarife ansehen</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Raum messen</h1>

      {ar?.ok === true && (
        <ArMesser
          onFertig={(gemessen) => {
            setF((alt) => ({ ...alt, ...Object.fromEntries(Object.entries(gemessen).map(([k, v]) => [k, String(v)])) }));
            setFertigGemessen(true);
          }}
        />
      )}

      {ar && !ar.ok && !fertigGemessen && (
        <>
          <p className="hinweis" role="status">{ar.text}</p>
          <MessAssistent
            apple={apple}
            werte={f}
            onWert={(key, cm) => setF((alt) => ({ ...alt, [key]: String(cm) }))}
            onFertig={() => setFertigGemessen(true)}
            onAlleEintippen={() => setFertigGemessen(true)}
          />
        </>
      )}

      {zeigeFormular && (
        <div className="flaeche">
          <h2>{ar?.ok ? "Gemessene Werte prüfen" : "Fast fertig"}</h2>
          <p className="gedaempft" style={{ margin: 0 }}>
            {ar?.ok ? "Fehlt ein Wert, kannst du ihn hier ergänzen." : "Prüfe die Maße und gib deinem Raum einen Namen."}
          </p>
          <label>
            Name des Raums
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="z. B. Mein Wohnzimmer" autoComplete="off" />
          </label>
          {MESS_SCHRITTE.map(feld)}
          <button
            className="knopf breit"
            disabled={!gueltig}
            onClick={() =>
              onSpeichern({
                id: `raum-${Date.now()}`,
                name: f.name.trim(),
                breiteCm: werte.breite!,
                tiefeCm: werte.tiefe!,
                hoeheCm: werte.hoehe!,
                tuerBreiteCm: werte.tuerB!,
                tuerHoeheCm: werte.tuerH!,
                treppenhausBreiteCm: werte.treppe!,
              })
            }
          >
            Raum speichern
          </button>
          {!ar?.ok && <button className="link" onClick={() => setFertigGemessen(false)}>Zurück zum Assistenten</button>}
        </div>
      )}
    </section>
  );
}
