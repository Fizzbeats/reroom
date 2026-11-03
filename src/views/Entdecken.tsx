import { useMemo, useState } from "react";
import { ALLE_FARBEN, type Moebel, type Raum, type Stil, type Zustand } from "../models/types";
import { findePassende } from "../logic/stilFinder";
import { pruefePasst } from "../logic/passtCheck";
import { alsCent, euro } from "../logic/preisRechner";
import { STIL_INFO } from "./Start";
import { Icon, Leer, ProduktKarte } from "./ui";

interface Props {
  katalog: Moebel[];
  raum?: Raum;
  stile: Stil[];
  onStile: (s: Stil[]) => void;
  onOeffnen: (id: string) => void;
}

function umschalten<T>(liste: T[], wert: T): T[] {
  return liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert];
}

const FARB_PUNKT: Record<string, string> = {
  grau: "#A3A7AB", weiss: "#ECEAE5", holz: "#C9A06E", schwarz: "#2E2E2E", braun: "#80553A", terrakotta: "#C9694C",
};

/** Alle Möbel als Bilder-Raster, sortiert nach Stil-Finder, mit Passt-Ampel auf dem Bild. */
export default function Entdecken({ katalog, raum, stile, onStile, onOeffnen }: Props) {
  const [suche, setSuche] = useState("");
  const [nurPassend, setNurPassend] = useState(true);
  const [zustand, setZustand] = useState<Zustand | "alle">("alle");
  const [filterOffen, setFilterOffen] = useState(false);
  const [budget, setBudget] = useState(1500);
  const [farben, setFarben] = useState<string[]>([]);

  const treffer = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return findePassende(katalog, { budget, stile, farben })
      .map((t) => ({ ...t, passt: raum ? pruefePasst(t.moebel.masseCm, raum) : undefined }))
      .filter((t) => zustand === "alle" || t.moebel.zustand === zustand)
      .filter((t) => !s || `${t.moebel.name} ${t.moebel.kategorie} ${t.moebel.farben.join(" ")}`.toLowerCase().includes(s))
      .filter((t) => !raum || !nurPassend || t.passt?.ampel !== "rot");
  }, [katalog, budget, stile, farben, zustand, suche, raum, nurPassend]);

  return (
    <section>
      <div className="kopf">
        <h1 style={{ margin: 0 }}>Entdecken</h1>
        <button className="rund" aria-expanded={filterOffen} aria-label="Weitere Filter" onClick={() => setFilterOffen(!filterOffen)}>
          <Icon name={filterOffen ? "schliessen" : "filter"} groesse={20} />
        </button>
      </div>

      <label className="suche">
        <Icon name="suche" groesse={18} />
        <input type="search" placeholder="Sofa, Regal, Lampe …" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Möbel suchen" />
      </label>

      <div className="chips">
        {raum && (
          <button className="chip" aria-pressed={nurPassend} onClick={() => setNurPassend(!nurPassend)}>
            <Icon name="raum" groesse={14} /> Passt ins {raum.name}
          </button>
        )}
        {(Object.keys(STIL_INFO) as Stil[]).map((s) => (
          <button key={s} className="chip" aria-pressed={stile.includes(s)} onClick={() => onStile(umschalten(stile, s))}>
            {STIL_INFO[s].name}
          </button>
        ))}
        <button className="chip" aria-pressed={zustand === "neu"} onClick={() => setZustand(zustand === "neu" ? "alle" : "neu")}>Neu</button>
        <button className="chip" aria-pressed={zustand === "gebraucht"} onClick={() => setZustand(zustand === "gebraucht" ? "alle" : "gebraucht")}>
          Gebraucht
        </button>
      </div>

      {filterOffen && (
        <div className="filterpanel">
          <label>
            Höchstens {euro(alsCent(budget))} pro Möbel
            <input type="range" min={20} max={1500} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </label>
          <div className="chips">
            {ALLE_FARBEN.map((f) => (
              <button key={f} className="chip" aria-pressed={farben.includes(f)} onClick={() => setFarben(umschalten(farben, f))}>
                <i className="punkt" style={{ background: FARB_PUNKT[f] }} />{f}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="anzahl">{treffer.length} Möbel{raum && nurPassend ? ` passen in dein ${raum.name}` : ""}</p>

      {treffer.length === 0 ? (
        <Leer titel="Nichts gefunden">Lockere die Filter oder such nach etwas anderem.</Leer>
      ) : (
        <div className="raster">
          {treffer.map((t) => (
            <ProduktKarte key={t.moebel.id} moebel={t.moebel} ampel={t.passt?.ampel} onOeffnen={() => onOeffnen(t.moebel.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
