import { useMemo } from "react";
import type { Moebel } from "../models/types";
import { einrichten, type Platzierung } from "../logic/einrichten";
import type { Teilen } from "../logic/teilen";
import { alsCent, euro } from "../logic/preisRechner";
import { pruefeMoebel } from "../logic/passtCheck";
import { AMPEL_TEXT, Grundriss, Icon, MoebelBild, kurzInfo } from "./ui";

interface Props {
  daten: Teilen;
  katalog: Moebel[];
  onRundgang: (platziert: Platzierung[]) => void;
  onSchliessen: () => void;
}

/** Ansicht für jemanden, der einen Wohnungs-Link bekommen hat (Mieter, Freund, Makler-Kunde). Nur ansehen, nichts ändern. */
export default function GeteilteWohnung({ daten, katalog, onRundgang, onSchliessen }: Props) {
  const moebel = useMemo(
    () => daten.moebelIds.map((id) => katalog.find((m) => m.id === id)).filter((m): m is Moebel => Boolean(m)),
    [daten, katalog],
  );
  const plan = einrichten(daten.raum, moebel, daten.feste);
  const summe = moebel.reduce((s, m) => s + alsCent(m.preis), 0);
  const fehlend = daten.moebelIds.length - moebel.length;

  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label="Geteilte Wohnung">
      <div className="vollbild-innen">
        <div className="reihe">
          <span className="gedaempft">Geteilte Wohnung</span>
          <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>
        <h1 style={{ margin: "10px 0 4px" }}>{daten.raum.name}</h1>
        <p className="gedaempft" style={{ marginTop: 0 }}>
          {((daten.raum.breiteCm * daten.raum.tiefeCm) / 10000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} m² · {moebel.length} Möbel · zusammen {euro(summe)}
        </p>
        <div className="raumkarte"><Grundriss raum={daten.raum} platziert={plan.platziert} /></div>
        <button className="knopf breit" style={{ marginTop: 12 }} onClick={() => onRundgang(plan.platziert)}><Icon name="wuerfel" groesse={18} /> In 3D ansehen</button>

        <h2>Einrichtung</h2>
        {moebel.map((m) => (
          <div className="position" key={m.id}>
            <span className="mini"><MoebelBild moebel={m} /></span>
            <div className="info"><strong>{m.name}</strong><span>{kurzInfo(m)} · {AMPEL_TEXT[pruefeMoebel(m, daten.raum).ampel]}</span></div>
            <b>{euro(alsCent(m.preis))}</b>
          </div>
        ))}
        {fehlend > 0 && <p className="gedaempft">{fehlend} Möbel aus dem Link gibt es in diesem Katalog nicht (zum Beispiel ein verkauftes Inserat).</p>}
        <button className="knopf leise breit" style={{ marginTop: 16 }} onClick={onSchliessen}>Eigene Wohnung einrichten</button>
      </div>
    </div>
  );
}
