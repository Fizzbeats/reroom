import { useState } from "react";
import type { Moebel } from "../models/types";
import { cashbackProzent } from "../logic/aktion";
import { alsCent, berechneWarenkorb, euro, mitGuthaben, TRANSPORT_CENT, transportKostenCent } from "../logic/preisRechner";
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
  const [gekauft, setGekauft] = useState<{ abzugCent: number; nummer: string; gebraucht: number; neu: number } | undefined>();
  const [kasseOffen, setKasseOffen] = useState(false);
  const [bezahlt, setBezahlt] = useState(false);
  const [nutzeGuthaben, setNutzeGuthaben] = useState(true);
  // Gebrauchte Möbel: abholen (kostenlos) oder vom Transport-Partner bringen lassen
  const [transport, setTransport] = useState<string[]>([]);
  const prozent = cashbackProzent();
  const k = berechneWarenkorb(positionen, prozent);
  const anzahlTransport = positionen.filter((m) => m.zustand === "gebraucht" && transport.includes(m.id)).length;
  const transportCent = transportKostenCent(anzahlTransport);
  const g = mitGuthaben(k.endpreisCent + transportCent, nutzeGuthaben ? guthabenCent : 0);

  if (gekauft) {
    return (
      <section>
        <h1>Danke!</h1>
        <Leer titel={`Testbestellung ${gekauft.nummer}`}>
          Es wurde nichts bezahlt, die Testkasse bucht kein Geld ab.
          {gekauft.abzugCent > 0 && ` Dein Guthaben hat ${euro(gekauft.abzugCent)} gespart.`}
        </Leer>
        <ul className="beleg-liste">
          {gekauft.gebraucht > 0 && <li>Gebrauchte Möbel ({gekauft.gebraucht}): Das Geld hält der Zahlungsdienstleister, bis du die Übergabe per QR-Code bestätigst.</li>}
          {gekauft.neu > 0 && <li>Neue Möbel ({gekauft.neu}): Der Partner-Shop liefert. Dein Cashback kommt nach der Lieferung.</li>}
        </ul>
        <button className="knopf breit" style={{ marginTop: 16 }} onClick={() => { setGekauft(undefined); setTransport([]); onLeeren(); }}>Zurück</button>
      </section>
    );
  }

  return (
    <section>
      <h1>Warenkorb</h1>
      {positionen.length === 0 && <Leer titel="Noch leer">Tippe bei einem Möbel auf „In den Warenkorb“.</Leer>}

      {positionen.map((m) => {
        const bringen = transport.includes(m.id);
        return (
          <div className="position-block" key={m.id}>
            <div className="position">
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
            {m.zustand === "gebraucht" && (
              <div className="chips transport-wahl" role="group" aria-label={`Übergabe für ${m.name}`}>
                <button className="chip" aria-pressed={!bringen} onClick={() => setTransport(transport.filter((x) => x !== m.id))}>Ich hole es ab</button>
                <button className="chip" aria-pressed={bringen} onClick={() => setTransport([...transport.filter((x) => x !== m.id), m.id])}>
                  Transport buchen (+ {euro(TRANSPORT_CENT)})
                </button>
              </div>
            )}
          </div>
        );
      })}

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
          {transportCent > 0 && <div className="summe"><span>Transport in Chemnitz ({anzahlTransport}×)</span><span>{euro(transportCent)}</span></div>}
          {transportCent > 0 && <p className="gedaempft" style={{ margin: 0, fontSize: ".8rem" }}>Davon gehen 15 % ({euro(Math.round((transportCent * 15) / 100))}) an ReRoom, den Rest bekommt der Transport-Partner. Die Buchung ist eine Demo.</p>}
          {g.abzugCent > 0 && <div className="summe gruen"><span>Dein Guthaben</span><span>− {euro(g.abzugCent)}</span></div>}
          <div className="summe gross"><span>Du zahlst</span><span>{euro(g.zuZahlenCent)}</span></div>
          {k.cashbackCent > 0 && (
            <div className="summe gruen"><span>Du bekommst zurück ({prozent} % Cashback)</span><span>{euro(k.cashbackCent)}</span></div>
          )}
          <button className="knopf breit" onClick={() => { setBezahlt(false); setKasseOffen(true); }}>
            Zur Testkasse
          </button>
        </div>
      )}

      {kasseOffen && (
        <div className="sheet-hintergrund" onClick={() => setKasseOffen(false)}>
          <div className="sheet qr-sheet" role="dialog" aria-modal="true" aria-label="Testkasse" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-kopf">
              <strong className="titel-schrift">Testkasse</strong>
              <button className="rund" onClick={() => setKasseOffen(false)} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
            </div>
            <div className="qr-inhalt">
              <p className="hinweis" role="note" style={{ margin: 0 }}>Testmodus: Hier gibst du keine Kartendaten ein und es wird nichts abgebucht.</p>
              <div className="summe gross"><span>Du zahlst</span><span>{euro(g.zuZahlenCent)}</span></div>
              <p className="gedaempft" style={{ margin: 0, fontSize: ".84rem" }}>
                Echte Zahlungen laufen später über einen Zahlungsdienstleister. Gebrauchtes Geld bleibt dort, bis die Übergabe per QR-Code bestätigt ist.
              </p>
              <button
                className="knopf breit"
                disabled={bezahlt}
                onClick={() => {
                  setBezahlt(true);
                  setTimeout(() => {
                    if (g.abzugCent > 0) onGuthabenVerbraucht(g.abzugCent);
                    setGekauft({
                      abzugCent: g.abzugCent,
                      nummer: `RR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
                      gebraucht: positionen.filter((m) => m.zustand === "gebraucht").length,
                      neu: positionen.filter((m) => m.zustand === "neu").length,
                    });
                    setKasseOffen(false);
                  }, 900);
                }}
              >
                {bezahlt ? "Zahlung wird geprüft …" : "Mit Testkarte bezahlen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
