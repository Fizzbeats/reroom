import { useEffect, useState } from "react";
import type { Moebel, Raum } from "../models/types";
import { ampelFuer, pruefeMoebel } from "../logic/passtCheck";
import { einrichten, type FestePlatz } from "../logic/einrichten";
import { alsCent, euro, kaeuferschutzCent } from "../logic/preisRechner";
import { STIL_INFO } from "./Start";
import { AMPEL_TEXT, Grundriss, Icon, MitReRoom, MoebelBild } from "./ui";

interface Props {
  moebel: Moebel;
  katalog: Moebel[];
  raum?: Raum;
  imRaum: string[];
  imKorb: boolean;
  onKorb: () => void;
  onImRaum: () => void;
  onZurueck: () => void;
  /** Vom Nutzer verschobene Möbel, damit der Grundriss hier derselbe ist wie auf der Startseite */
  feste?: Record<string, FestePlatz>;
  /** Preisalarm (Premium): erlaubt, an oder aus, und wohin ohne Premium */
  preisalarm?: { erlaubt: boolean; an: boolean; onUmschalten: () => void; onTarife: () => void };
}

const BALKEN_MAX_CM = 60; // ab hier ist der Balken voll
const FARBE_AMPEL = { gruen: "var(--ampel-gruen)", gelb: "var(--ampel-gelb)", rot: "var(--ampel-rot)" };

function Balken({ name, cm }: { name: string; cm: number }) {
  const breite = cm < 0 ? 100 : Math.max(3, Math.min(100, (cm / BALKEN_MAX_CM) * 100));
  return (
    <div className="balken-zeile">
      <span>{name}</span>
      <span className="spur"><i style={{ width: `${breite}%`, background: FARBE_AMPEL[ampelFuer(cm)] }} /></span>
      <em>{cm} cm</em>
    </div>
  );
}

/** Möbel-Detail: Foto oder „In meinem Raum“, Passt-Check als Balken, Maße, Kaufleiste unten. */
export default function Detail({ moebel: m, katalog, raum, imRaum, imKorb, onKorb, onImRaum, onZurueck, preisalarm, feste }: Props) {
  const [ansicht, setAnsicht] = useState<"foto" | "raum">("foto");
  const passt = raum ? pruefeMoebel(m, raum) : undefined;
  const cent = alsCent(m.preis);
  const istImRaum = imRaum.includes(m.id);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onZurueck();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onZurueck]);

  // Dieses Möbel zusammen mit dem, was schon im Raum steht
  const andere = imRaum.filter((id) => id !== m.id).map((id) => katalog.find((k) => k.id === id)).filter((k): k is Moebel => Boolean(k));
  const plan = raum ? einrichten(raum, [m, ...andere], feste) : undefined;
  const findetPlatz = plan?.platziert.some((p) => p.moebel.id === m.id) ?? false;
  const wegText = passt && (passt.details.tuerCm < 0 ? "Passt nicht durch die Tür" : `Tür: ${passt.details.tuerCm} cm Luft`);

  return (
    <div className="detail" role="dialog" aria-modal="true" aria-label={m.name}>
      <div className="detail-innen">
        {ansicht === "foto" || !raum || !plan ? (
          <div className="detail-bild">
            <button className="rund" onClick={onZurueck} aria-label="Zurück"><Icon name="zurueck" /></button>
            <MoebelBild moebel={m} />
          </div>
        ) : (
          <div className="detail-plan">
            <button className="rund" onClick={onZurueck} aria-label="Zurück"><Icon name="zurueck" /></button>
            <Grundriss raum={raum} platziert={plan.platziert} hervorheben={m.id} weg={wegText} />
            {!findetPlatz && <p className="plan-tipp">Für dieses Möbel ist im Raum gerade kein freier Platz.</p>}
          </div>
        )}

        <div className="detail-text">
          {raum && (
            <div className="umschalter" role="tablist" aria-label="Ansicht">
              <button role="tab" aria-selected={ansicht === "foto"} onClick={() => setAnsicht("foto")}><Icon name="foto" groesse={16} /> Foto</button>
              <button role="tab" aria-selected={ansicht === "raum"} onClick={() => setAnsicht("raum")}><Icon name="raum" groesse={16} /> In meinem Raum</button>
            </div>
          )}

          <div className="tags">
            <span className="tag">{m.zustand === "neu" ? "Neu" : "Gebraucht"}</span>
            {m.stile.map((s) => <span key={s} className="tag">{STIL_INFO[s].name}</span>)}
            {m.farben.map((f) => <span key={f} className="tag">{f}</span>)}
          </div>
          <h1>{m.name}</h1>
          <p className="gedaempft" style={{ margin: 0 }}>
            {m.anbieter}{m.entfernungKm !== undefined && ` · ${m.entfernungKm} km`}{m.zustand === "gebraucht" && " · Abholung"}
          </p>
          {preisalarm && (
            <button
              className="chip"
              style={{ marginTop: 10 }}
              aria-pressed={preisalarm.an}
              onClick={preisalarm.erlaubt ? preisalarm.onUmschalten : preisalarm.onTarife}
            >
              <Icon name="glocke" groesse={14} /> {preisalarm.an ? "Preisalarm ist an" : "Preisalarm"}{!preisalarm.erlaubt && " (Premium)"}
            </button>
          )}

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
          {raum && passt?.ampel !== "rot" && (
            <button
              className={`knopf-quadrat ${istImRaum ? "an" : ""}`}
              onClick={() => { onImRaum(); setAnsicht("raum"); }}
              aria-pressed={istImRaum}
              aria-label={istImRaum ? "Aus meinem Raum nehmen" : "In meinen Raum stellen"}
              title={istImRaum ? "Aus meinem Raum nehmen" : "In meinen Raum stellen"}
            >
              <Icon name="raum" />
            </button>
          )}
          <button className={`knopf ${imKorb ? "zweit" : ""}`} onClick={onKorb}>
            {imKorb ? "Im Warenkorb ✓" : "In den Warenkorb"}
          </button>
        </div>
      </div>
    </div>
  );
}
