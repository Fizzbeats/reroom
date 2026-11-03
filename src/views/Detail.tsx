import { useEffect } from "react";
import type { Moebel, Raum } from "../models/types";
import { ampelFuer, pruefePasst } from "../logic/passtCheck";
import { alsCent, euro, kaeuferschutzCent } from "../logic/preisRechner";
import { STIL_INFO } from "./Start";
import { AMPEL_TEXT, Icon, MitReRoom, MoebelBild } from "./ui";

interface Props {
  moebel: Moebel;
  raum?: Raum;
  imKorb: boolean;
  onKorb: () => void;
  onZurueck: () => void;
}

const BALKEN_MAX_CM = 60; // ab hier ist der Balken voll

function Balken({ name, cm }: { name: string; cm: number }) {
  const farbe = { gruen: "var(--ampel-gruen)", gelb: "var(--ampel-gelb)", rot: "var(--ampel-rot)" }[ampelFuer(cm)];
  const breite = Math.max(0, Math.min(100, (cm / BALKEN_MAX_CM) * 100));
  return (
    <div className="balken-zeile">
      <span>{name}</span>
      <span className="spur"><i style={{ width: `${Math.max(breite, cm < 0 ? 100 : 3)}%`, background: farbe }} /></span>
      <em>{cm} cm</em>
    </div>
  );
}

/** Möbel-Detail: großes Bild, Passt-Check als Balken, Maße, Kaufleiste unten. */
export default function Detail({ moebel: m, raum, imKorb, onKorb, onZurueck }: Props) {
  const passt = raum ? pruefePasst(m.masseCm, raum) : undefined;
  const cent = alsCent(m.preis);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onZurueck();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onZurueck]);

  return (
    <div className="detail" role="dialog" aria-modal="true" aria-label={m.name}>
      <div className="detail-innen">
        <div className="detail-bild">
          <button className="rund" onClick={onZurueck} aria-label="Zurück"><Icon name="zurueck" /></button>
          <MoebelBild moebel={m} />
        </div>

        <div className="detail-text">
          <div className="tags">
            <span className="tag">{m.zustand === "neu" ? "Neu" : "Gebraucht"}</span>
            {m.stile.map((s) => <span key={s} className="tag">{STIL_INFO[s].name}</span>)}
            {m.farben.map((f) => <span key={f} className="tag">{f}</span>)}
          </div>
          <h1>{m.name}</h1>
          <p className="gedaempft" style={{ margin: 0 }}>
            {m.anbieter}{m.entfernungKm !== undefined && ` · ${m.entfernungKm} km`}{m.zustand === "gebraucht" && " · Abholung"}
          </p>

          {passt && raum ? (
            <div className="passt">
              <div className="passt-kopf">
                <b>Passt-Check · {raum.name}</b>
                <span className={`status ${passt.ampel}`}>{AMPEL_TEXT[passt.ampel]}</span>
              </div>
              <div className="balken">
                <Balken name="Tür" cm={passt.details.tuerCm} />
                <Balken name="Treppenhaus" cm={passt.details.treppenhausCm} />
                <Balken name="Raum" cm={passt.details.raumCm} />
              </div>
              <p>{passt.begruendung}</p>
            </div>
          ) : (
            <p className="hinweis" style={{ marginTop: 16 }}>Miss deinen Raum, dann zeigt ReRoom hier, ob das Möbel durch Tür und Treppenhaus passt.</p>
          )}

          <div className="masse">
            <div><b>{m.masseCm.breite}</b>Breite cm</div>
            <div><b>{m.masseCm.tiefe}</b>Tiefe cm</div>
            <div><b>{m.masseCm.hoehe}</b>Höhe cm</div>
          </div>

          <p className="beschreibung">{m.beschreibung}</p>
        </div>
      </div>

      <div className="kaufleiste">
        <div>
          <div className="preisblock">
            <span className="preis-gross">{euro(cent)}</span>
            {m.zustand === "neu" ? <MitReRoom moebel={m} /> : <small>+ {euro(kaeuferschutzCent(cent))} Käuferschutz</small>}
          </div>
          <button className={`knopf ${imKorb ? "zweit" : ""}`} onClick={onKorb}>
            {imKorb ? "Im Warenkorb ✓" : "In den Warenkorb"}
          </button>
        </div>
      </div>
    </div>
  );
}
