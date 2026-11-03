import { useState } from "react";
import type { Moebel } from "../models/types";
import { alsCent, berechneWarenkorb, euro, mitGuthaben } from "../logic/preisRechner";
import { Icon, Leer, MoebelBild, kurzInfo } from "./ui";

interface Props {
  positionen: Moebel[];
  /** Guthaben aus verkauften Möbeln, in Cent */
  guthabenCent: number;
  onGuthabenVerbraucht: (cent: number) => void;
  onEntfernen: (id: string) => void;
  onLeeren: () => void;
  onOeffnen: (id: string) => void;
}

export default function Warenkorb({ positionen, guthabenCent, onGuthabenVerbraucht, onEntfernen, onLeeren, onOeffnen }: Props) {
  const [gekauft, setGekauft] = useState<{ abzugCent: number } | undefined>();
  const [nutzeGuthaben, setNutzeGuthaben] = useState(true);
  const k = berechneWarenkorb(positionen);
  const g = mitGuthaben(k.endpreisCent, nutzeGuthaben ? guthabenCent : 0);

  if (gekauft) {
    return (
      <section>
        <h1>Danke!</h1>
        <Leer titel="Demo-Kauf abgeschlossen">
          Es wurde nichts bezahlt. Im echten Betrieb läuft die Zahlung über einen Zahlungsdienstleister.
          {gekauft.abzugCent > 0 && ` Dein Guthaben hat ${euro(gekauft.abzugCent)} gespart.`}
        </Leer>
        <button className="knopf breit" style={{ marginTop: 16 }} onClick={() => { setGekauft(undefined); onLeeren(); }}>Zurück</button>
      </section>
    );
  }

  return (
    <section>
      <h1>Warenkorb</h1>
      {positionen.length === 0 && <Leer titel="Noch leer">Tippe bei einem Möbel auf „In den Warenkorb“.</Leer>}

      {positionen.map((m) => (
        <div className="position" key={m.id}>
          <button className="mini" onClick={() => onOeffnen(m.id)} aria-label={`${m.name} ansehen`} style={{ border: 0, padding: 0 }}>
            <MoebelBild moebel={m} />
          </button>
          <div className="info">
            <strong>{m.name}</strong>
            <span>{kurzInfo(m)}</span>
            <b>{euro(alsCent(m.preis))}</b>
          </div>
          <button className="rund" onClick={() => onEntfernen(m.id)} aria-label={`${m.name} entfernen`}><Icon name="schliessen" groesse={18} /></button>
        </div>
      ))}

      {positionen.length > 0 && (
        <div className="flaeche">
          {guthabenCent > 0 && (
            <label className="guthaben-zeile">
              <input type="checkbox" checked={nutzeGuthaben} onChange={(e) => setNutzeGuthaben(e.target.checked)} />
              <span>Guthaben einsetzen</span>
              <b>{euro(guthabenCent)}</b>
            </label>
          )}
          <div className="summe"><span>Zwischensumme</span><span>{euro(k.zwischensummeCent)}</span></div>
          {k.kaeuferschutzCent > 0 && <div className="summe"><span>Käuferschutz (gebraucht)</span><span>{euro(k.kaeuferschutzCent)}</span></div>}
          {g.abzugCent > 0 && <div className="summe gruen"><span>Dein Guthaben</span><span>− {euro(g.abzugCent)}</span></div>}
          <div className="summe gross"><span>Du zahlst</span><span>{euro(g.zuZahlenCent)}</span></div>
          {k.cashbackCent > 0 && (
            <div className="summe gruen"><span>Du bekommst zurück (4 % Cashback)</span><span>{euro(k.cashbackCent)}</span></div>
          )}
          <button
            className="knopf breit"
            onClick={() => {
              if (g.abzugCent > 0) onGuthabenVerbraucht(g.abzugCent);
              setGekauft({ abzugCent: g.abzugCent });
            }}
          >
            Demo-Kauf
          </button>
        </div>
      )}
    </section>
  );
}
