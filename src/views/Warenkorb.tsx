import { useState } from "react";
import type { Moebel } from "../models/types";
import { alsCent, berechneWarenkorb, euro } from "../logic/preisRechner";

export default function Warenkorb({ positionen, onLeeren }: { positionen: Moebel[]; onLeeren: () => void }) {
  const [gekauft, setGekauft] = useState(false);
  const k = berechneWarenkorb(positionen);

  if (gekauft) {
    return (
      <section>
        <h1>Danke!</h1>
        <p>Das war nur ein Demo-Kauf, es wurde nichts bezahlt.</p>
        <button className="primaer" onClick={() => { setGekauft(false); onLeeren(); }}>Zurück</button>
      </section>
    );
  }

  return (
    <section>
      <h1>Warenkorb</h1>
      {positionen.length === 0 && <p className="gedaempft">Dein Warenkorb ist leer.</p>}
      {positionen.map((m) => (
        <div className="karte reihe" key={m.id}>
          <span>{m.name} <span className="badge">{m.zustand}</span></span>
          <strong>{euro(alsCent(m.preis))}</strong>
        </div>
      ))}
      {positionen.length > 0 && (
        <div className="karte">
          <div className="summe"><span>Zwischensumme</span><span>{euro(k.zwischensummeCent)}</span></div>
          <div className="summe"><span>Käuferschutz (gebraucht)</span><span>{euro(k.kaeuferschutzCent)}</span></div>
          <div className="summe gross"><span>Endpreis</span><span>{euro(k.endpreisCent)}</span></div>
          <div className="summe"><span>Cashback (neu, 4 %)</span><span>{euro(k.cashbackCent)}</span></div>
          <button className="primaer" onClick={() => setGekauft(true)}>Demo-Kauf</button>
        </div>
      )}
    </section>
  );
}
