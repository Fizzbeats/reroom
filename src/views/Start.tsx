import type { Moebel, Raum, Stil } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";
import { findePassende } from "../logic/stilFinder";
import { pruefeMoebel } from "../logic/passtCheck";
import { einrichten, type Platzierung } from "../logic/einrichten";
import { zimmerSet } from "../logic/stilAuswertung";
import { alsCent, euro } from "../logic/preisRechner";
import { Grundriss, Icon, ProduktKarte } from "./ui";

export const STIL_INFO: Record<Stil, { name: string; farbe: string }> = {
  skandi: { name: "Skandi", farbe: "#C9A06E" },
  modern: { name: "Modern", farbe: "#A3A7AB" },
  industrial: { name: "Industrial", farbe: "#2E2E2E" },
  boho: { name: "Boho", farbe: "#C9694C" },
  vintage: { name: "Vintage", farbe: "#80553A" },
};

const VORSCHLAG_BUDGET = 1000; // Budget für das automatische „So könnte es aussehen“

interface Props {
  katalog: Moebel[];
  raeume: Raum[];
  raum?: Raum;
  imRaum: string[];
  stile: Stil[];
  onStile: (s: Stil[]) => void;
  onWaehlen: (id: string) => void;
  onOeffnen: (id: string) => void;
  onAlleInKorb: (ids: string[]) => void;
  onMessen: () => void;
  onEntdecken: () => void;
  onStilFinder: () => void;
  onRundgang: (platziert: Platzierung[]) => void;
}

/** Startseite: der eigene Raum als Grundriss mit Möbeln, dazu Stil und weitere Vorschläge. */
export default function Start(props: Props) {
  const { katalog, raeume, raum, imRaum, stile, onStile, onWaehlen, onOeffnen, onAlleInKorb, onMessen, onEntdecken, onStilFinder, onRundgang } = props;
  const alleRaeume = [...raeume, ...BEISPIELRAEUME];

  // Eigene Auswahl im Raum, sonst ein automatischer Vorschlag
  const eigene = imRaum.map((id) => katalog.find((m) => m.id === id)).filter((m): m is Moebel => Boolean(m));
  const vorschlag = raum && eigene.length === 0 ? zimmerSet(katalog, { stile, farben: [] }, VORSCHLAG_BUDGET, raum).moebel : [];
  const imPlan = eigene.length > 0 ? eigene : vorschlag;
  const plan = raum ? einrichten(raum, imPlan) : undefined;
  const summe = imPlan.reduce((s, m) => s + alsCent(m.preis), 0);

  const imPlanIds = new Set(imPlan.map((m) => m.id));
  const imPlanKategorien = new Set(imPlan.map((m) => m.kategorie));
  const nochPlatz = raum
    ? findePassende(katalog, { budget: Infinity, stile, farben: [] })
        .filter((t) => !imPlanIds.has(t.moebel.id))
        .map((t) => ({ ...t, passt: pruefeMoebel(t.moebel, raum) }))
        .filter((t) => t.passt.ampel !== "rot")
        .sort((a, b) => Number(imPlanKategorien.has(a.moebel.kategorie)) - Number(imPlanKategorien.has(b.moebel.kategorie)))
        .slice(0, 4)
    : [];

  return (
    <section>
      <div className="kopf">
        <p className="marke">ReRoom<i /></p>
        {raum && <button className="chip" onClick={onMessen}><Icon name="kamera" groesse={16} /> Neu messen</button>}
      </div>

      {raum && plan ? (
        <div className="raumkarte">
          <div className="zeile">
            <div>
              <small>Dein {raum.name} · {((raum.breiteCm * raum.tiefeCm) / 10000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} m²</small>
              <h3>{eigene.length > 0 ? "Dein Raum, eingerichtet" : "So könnte es aussehen"}</h3>
            </div>
            <span className="passt-zahl">{plan.platziert.length} Möbel passen</span>
          </div>
          <Grundriss raum={raum} platziert={plan.platziert} onMoebel={onOeffnen} />
          {imPlan.length > 0 && (
            <div className="plan-leiste">
              <span>Zusammen <b>{euro(summe)}</b></span>
              <span className="plan-knoepfe">
                <button className="chip hell" onClick={() => onRundgang(plan.platziert)}><Icon name="wuerfel" groesse={16} /> 3D</button>
                <button className="chip hell" onClick={() => onAlleInKorb(imPlan.map((m) => m.id))}>Alle in den Korb</button>
              </span>
            </div>
          )}
          <p className="plan-tipp">Tippe auf ein Möbel im Grundriss, um es anzusehen.</p>
          {alleRaeume.length > 1 && (
            <div className="raumwahl" aria-label="Raum wechseln">
              {alleRaeume.map((r) => (
                <button key={r.id} className="chip" aria-pressed={r.id === raum.id} onClick={() => onWaehlen(r.id)}>{r.name}</button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="messen-cta">
          <h3>Passt das Sofa durch die Tür?</h3>
          <p>Miss deinen Raum mit der Handykamera. ReRoom zeigt dir dann nur Möbel, die wirklich passen.</p>
          <button className="knopf breit" onClick={onMessen}><Icon name="kamera" /> Raum ausmessen</button>
          <button className="link" style={{ color: "#C8C8C8" }} onClick={() => onWaehlen(BEISPIELRAEUME[2]!.id)}>
            Erst mit einem Beispielraum ausprobieren
          </button>
        </div>
      )}

      <h2>Dein Stil <button className="link" onClick={onStilFinder}>Stil-Finder starten</button></h2>
      <div className="chips">
        {(Object.keys(STIL_INFO) as Stil[]).map((s) => (
          <button
            key={s}
            className="chip"
            aria-pressed={stile.includes(s)}
            onClick={() => onStile(stile.includes(s) ? stile.filter((x) => x !== s) : [...stile, s])}
          >
            <i className="punkt" style={{ background: STIL_INFO[s].farbe }} />{STIL_INFO[s].name}
          </button>
        ))}
      </div>

      {raum ? (
        <>
          <h2>Noch Platz für <button className="link" onClick={onEntdecken}>Alle</button></h2>
          <div className="raster">
            {nochPlatz.map((t) => (
              <ProduktKarte key={t.moebel.id} moebel={t.moebel} ampel={t.passt.ampel} onOeffnen={() => onOeffnen(t.moebel.id)} />
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>Für deinen Stil <button className="link" onClick={onEntdecken}>Alle</button></h2>
          <div className="raster">
            {findePassende(katalog, { budget: Infinity, stile, farben: [] }).slice(0, 4).map((t) => (
              <ProduktKarte key={t.moebel.id} moebel={t.moebel} onOeffnen={() => onOeffnen(t.moebel.id)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
