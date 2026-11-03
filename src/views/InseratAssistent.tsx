import { useRef, useState } from "react";
import { ALLE_FARBEN, type Kategorie } from "../models/types";
import { bildVerkleinern } from "../services/foto";
import { preisVorschlag } from "../logic/verkaufsPreis";
import { alsCent, euro } from "../logic/preisRechner";
import {
  euroAusText, guthabenCent, HERVORHEBEN_CENT, kaeuferZahltCent, LEERER_ENTWURF, MAX_FOTOS, pruefeSchritt, TRANSPORT_AB_CENT, ZUSTAENDE,
  type Entwurf,
} from "../logic/verkaufen";
import KameraMesser from "./KameraMesser";
import { FARBE, Icon } from "./ui";

interface Props {
  onFertig: (entwurf: Entwurf) => void;
  onSchliessen: () => void;
}

const SCHRITTE = ["Fotos", "Was ist es?", "Maße", "Preis"];
const KATEGORIEN: [Kategorie, string][] = [
  ["sofa", "Sofa"], ["bett", "Bett"], ["schrank", "Schrank"], ["tisch", "Tisch"], ["stuhl", "Stuhl"], ["regal", "Regal"], ["lampe", "Lampe"], ["teppich", "Teppich"],
];
const MASS_ZIELE = [{ id: "breite" as const, name: "Breite" }, { id: "tiefe" as const, name: "Tiefe" }, { id: "hoehe" as const, name: "Höhe" }];

/** Möbel einstellen in vier Schritten: Fotos, Angaben, Maße, Preis. Kostenlos, laut Businessplan. */
export default function InseratAssistent({ onFertig, onSchliessen }: Props) {
  const [nr, setNr] = useState(0);
  const [e, setE] = useState<Entwurf>(LEERER_ENTWURF);
  const [hinweis, setHinweis] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [foto, setFoto] = useState(false);
  const datei = useRef<HTMLInputElement>(null);

  const aendern = (teil: Partial<Entwurf>) => { setE((alt) => ({ ...alt, ...teil })); setHinweis(""); };

  async function fotosWaehlen(liste: FileList | null) {
    if (!liste?.length) return;
    setLaedt(true);
    setHinweis("");
    try {
      const frei = MAX_FOTOS - e.fotos.length;
      const neu = await Promise.all([...liste].slice(0, frei).map((d) => bildVerkleinern(d)));
      aendern({ fotos: [...e.fotos, ...neu] });
      if (liste.length > frei) setHinweis(`Mehr als ${MAX_FOTOS} Fotos sind nicht möglich.`);
    } catch (fehler) {
      setHinweis(fehler instanceof Error ? fehler.message : "Das Foto konnte nicht gelesen werden.");
    } finally {
      setLaedt(false);
      if (datei.current) datei.current.value = "";
    }
  }

  function weiter() {
    const problem = pruefeSchritt(nr, e);
    if (problem) return setHinweis(problem);
    if (nr === SCHRITTE.length - 1) return onFertig(e);
    setNr(nr + 1);
    setFoto(false);
  }

  const preis = euroAusText(e.preis);
  const vorschlag = preisVorschlag(Number(e.neupreis.replace(",", ".")));
  const letzter = nr === SCHRITTE.length - 1;

  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label="Möbel einstellen">
      <div className="vollbild-innen">
        <div className="reihe">
          <span className="gedaempft">Schritt {nr + 1} von {SCHRITTE.length}: {SCHRITTE[nr]}</span>
          <button className="rund" onClick={onSchliessen} aria-label="Abbrechen"><Icon name="schliessen" groesse={18} /></button>
        </div>
        <div className="fortschritt"><i style={{ width: `${((nr + 1) / SCHRITTE.length) * 100}%` }} /></div>

        {nr === 0 && (
          <div className="assistent">
            <h1 style={{ marginTop: 18 }}>Zeig dein Möbel</h1>
            <p className="gedaempft" style={{ margin: 0 }}>Das erste Foto zeigt das ganze Möbel, am besten vor hellem Hintergrund. Einstellen ist kostenlos.</p>
            <div className="fotos">
              {e.fotos.map((f, i) => (
                <div key={i} className="foto-kachel">
                  <img src={f} alt={`Foto ${i + 1}`} />
                  <button className="rund" onClick={() => aendern({ fotos: e.fotos.filter((_, j) => j !== i) })} aria-label={`Foto ${i + 1} entfernen`}><Icon name="schliessen" groesse={14} /></button>
                  {i === 0 && <span className="foto-titel">Titelbild</span>}
                </div>
              ))}
              {e.fotos.length < MAX_FOTOS && (
                <label className="foto-neu">
                  <Icon name="foto" groesse={26} />
                  <span>{laedt ? "Lädt …" : e.fotos.length === 0 ? "Foto aufnehmen oder auswählen" : "Weiteres Foto"}</span>
                  <input ref={datei} type="file" accept="image/*" multiple onChange={(ev) => void fotosWaehlen(ev.target.files)} disabled={laedt} />
                </label>
              )}
            </div>
          </div>
        )}

        {nr === 1 && (
          <div className="assistent">
            <h1 style={{ marginTop: 18 }}>Was verkaufst du?</h1>
            <label>
              Name
              <input value={e.titel} onChange={(ev) => aendern({ titel: ev.target.value })} placeholder="z. B. Sofa Lund" autoComplete="off" />
            </label>
            <fieldset className="auswahl"><legend>Art</legend>
              <div className="chips" style={{ flexWrap: "wrap", margin: 0, padding: 0 }}>
                {KATEGORIEN.map(([k, n]) => <button key={k} className="chip" aria-pressed={e.kategorie === k} onClick={() => aendern({ kategorie: k })}>{n}</button>)}
              </div>
            </fieldset>
            <fieldset className="auswahl"><legend>Hauptfarbe</legend>
              <div className="chips" style={{ flexWrap: "wrap", margin: 0, padding: 0 }}>
                {ALLE_FARBEN.map((f) => (
                  <button key={f} className="chip" aria-pressed={e.farbe === f} onClick={() => aendern({ farbe: f })}>
                    <i className="punkt" style={{ background: FARBE[f] }} />{f}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="auswahl"><legend>Zustand</legend>
              <div className="chips" style={{ flexWrap: "wrap", margin: 0, padding: 0 }}>
                {ZUSTAENDE.map((z) => <button key={z} className="chip" aria-pressed={e.zustand === z} onClick={() => aendern({ zustand: z })}>{z}</button>)}
              </div>
            </fieldset>
          </div>
        )}

        {nr === 2 && (
          <div className="assistent">
            <h1 style={{ marginTop: 18 }}>Wie groß ist es?</h1>
            <p className="gedaempft" style={{ margin: 0 }}>Käufer sehen sofort, ob es in ihren Raum und durch die Tür passt. Miss darum so genau, wie du kannst.</p>
            <div className="masse-felder">
              {([["breite", "Breite"], ["tiefe", "Tiefe"], ["hoehe", "Höhe"]] as const).map(([k, n]) => (
                <label key={k}>{n} (cm)
                  <input inputMode="decimal" value={e[k]} onChange={(ev) => aendern({ [k]: ev.target.value })} placeholder="z. B. 85" />
                </label>
              ))}
            </div>
            <button className="knopf leise" onClick={() => setFoto(!foto)} aria-expanded={foto}><Icon name="foto" groesse={18} /> Mit Foto und Bankkarte messen</button>
            {foto && <KameraMesser ziele={MASS_ZIELE} onWert={(ziel, cm) => { aendern({ [ziel]: String(cm) }); setFoto(false); }} />}
          </div>
        )}

        {nr === 3 && (
          <div className="assistent">
            <h1 style={{ marginTop: 18 }}>Dein Preis</h1>
            <label>
              Neupreis, geschätzt (€)
              <input inputMode="decimal" value={e.neupreis} onChange={(ev) => aendern({ neupreis: ev.target.value })} placeholder="z. B. 450" />
            </label>
            {vorschlag > 0 && (
              <button className="chip" onClick={() => aendern({ preis: String(vorschlag) })}>Vorschlag übernehmen: {euro(alsCent(vorschlag))}</button>
            )}
            <label>
              Dein Preis (€)
              <input inputMode="decimal" value={e.preis} onChange={(ev) => aendern({ preis: ev.target.value })} placeholder="z. B. 180" />
            </label>

            <fieldset className="auswahl"><legend>Übergabe</legend>
              <div className="chips" style={{ flexWrap: "wrap", margin: 0, padding: 0 }}>
                <button className="chip" aria-pressed={e.abholung === "abholung"} onClick={() => aendern({ abholung: "abholung" })}>Käufer holt ab</button>
                <button className="chip" aria-pressed={e.abholung === "transport"} onClick={() => aendern({ abholung: "transport" })}>Transport buchbar (ab {euro(TRANSPORT_AB_CENT)})</button>
              </div>
            </fieldset>

            <label className="haken">
              <input type="checkbox" checked={e.hervorgehoben} onChange={(ev) => aendern({ hervorgehoben: ev.target.checked })} />
              <span>Inserat oben anzeigen <small className="gedaempft">(einmalig {euro(HERVORHEBEN_CENT)}, Demo ohne Zahlung)</small></span>
            </label>

            {preis && (
              <div className="flaeche">
                <div className="summe"><span>Käufer zahlt</span><span>{euro(kaeuferZahltCent(preis))}</span></div>
                <p className="gedaempft" style={{ margin: 0, fontSize: ".82rem" }}>Das ist dein Preis plus Käuferschutz (4 % + 0,50 €), den der Käufer trägt.</p>
                <div className="summe gross"><span>Du bekommst</span><span>{euro(alsCent(preis))}</span></div>
                <div className="summe gruen"><span>Als Guthaben (5 % Bonus)</span><span>{euro(guthabenCent(alsCent(preis)))}</span></div>
              </div>
            )}
          </div>
        )}

        <p role="alert" className={hinweis ? "hinweis" : undefined} style={{ margin: "10px 0 0", minHeight: "1.4em" }}>{hinweis}</p>

        <div className="assistent-fuss">
          {nr > 0 && <button className="knopf leise" onClick={() => { setNr(nr - 1); setHinweis(""); setFoto(false); }}>Zurück</button>}
          <button className="knopf" onClick={weiter} disabled={laedt}>{letzter ? "Jetzt einstellen" : "Weiter"}</button>
        </div>
      </div>
    </div>
  );
}
