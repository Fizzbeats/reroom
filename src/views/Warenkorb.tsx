import { useState } from "react";
import type { Moebel } from "../models/types";
import { alsCent, berechneWarenkorb, euro } from "../logic/preisRechner";
import { Icon, Leer, MoebelBild, kurzInfo } from "./ui";

interface Props {
  positionen: Moebel[];
  onEntfernen: (id: string) => void;
  onLeeren: () => void;
  onOeffnen: (id: string) => void;
}

export default function Warenkorb({ positionen, onEntfernen, onLeeren, onOeffnen }: Props) {
  const [gekauft, setGekauft] = useState(false);
  const k = berechneWarenkorb(positionen);

  if (gekauft) {
    return (
      <section>
        <h1>Danke!</h1>
        <Leer titel="Demo-Kauf abgeschlossen">Es wurde nichts bezahlt. Im echten Betrieb läuft die Zahlung über einen Zahlungsdienstleister.</Leer>
        <button className="knopf breit" style={{ marginTop: 16 }} onClick={() => { setGekauft(false); onLeeren(); }}>Zurück</button>
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
          <div className="summe"><span>Zwischensumme</span><span>{euro(k.zwischensummeCent)}</span></div>
          {k.kaeuferschutzCent > 0 && <div className="summe"><span>Käuferschutz (gebraucht)</span><span>{euro(k.kaeuferschutzCent)}</span></div>}
          <div className="summe gross"><span>Endpreis</span><span>{euro(k.endpreisCent)}</span></div>
          {k.cashbackCent > 0 && (
            <div className="summe gruen"><span>Du bekommst zurück (4 % Cashback)</span><span>{euro(k.cashbackCent)}</span></div>
          )}
          <button className="knopf breit" onClick={() => setGekauft(true)}>Demo-Kauf</button>
        </div>
      )}
    </section>
  );
}
