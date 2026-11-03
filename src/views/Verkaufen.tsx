import { useEffect, useRef, useState } from "react";
import { verkaeuferStarten } from "../services/uebergabeNetz";
import {
  erloesCent, guthabenCent, kaeuferZahltCent, neuesInserat, qrText, STATUS_TEXT, uebergabeGueltig, uebergabeLink,
  type Entwurf, type Erloesart, type Inserat,
} from "../logic/verkaufen";
import { alsCent, euro } from "../logic/preisRechner";
import { ausSternen, bewertungText } from "../logic/bewertung";
import InseratAssistent from "./InseratAssistent";
import QrCode from "./QrCode";
import { Icon, Leer } from "./ui";

interface Props {
  inserate: Inserat[];
  onInserate: (neu: Inserat[]) => void;
  guthabenCent: number;
  onGuthaben: (cent: number) => void;
  onOeffnen: (id: string) => void;
}

const SCHRITTE = [
  ["Einstellen", "Fotos und Maße, kostenlos"],
  ["Bezahlen", "Der Käufer zahlt in der App. Das Geld hält ein Zahlungsdienstleister."],
  ["Abholen", "Der Käufer holt ab oder bucht einen Transport."],
  ["Übergabe", "Er scannt deinen QR-Code. Erst dann bekommst du dein Geld."],
];

/** Verkaufen: Möbel einstellen, Status verfolgen, per QR-Code übergeben, Erlös auszahlen oder als Guthaben nutzen. */
export default function Verkaufen({ inserate, onInserate, guthabenCent: guthaben, onGuthaben, onOeffnen }: Props) {
  const [assistent, setAssistent] = useState(false);
  const [qrFuer, setQrFuer] = useState<string>();
  const [erloesFuer, setErloesFuer] = useState<string>();
  const [fehler, setFehler] = useState("");
  // Zweites Handy: Verbindungs-Nummer für den QR-Code und Stand der Verbindung
  const [peerId, setPeerId] = useState<string>();
  const [netzFehler, setNetzFehler] = useState(false);
  const inserateRef = useRef(inserate);
  inserateRef.current = inserate;

  const aendern = (id: string, teil: Partial<Inserat>) => onInserate(inserate.map((i) => (i.id === id ? { ...i, ...teil } : i)));
  const qrInserat = inserate.find((i) => i.id === qrFuer);
  const erloesInserat = inserate.find((i) => i.id === erloesFuer);

  function einstellen(entwurf: Entwurf) {
    const inserat = neuesInserat(entwurf, `ins-${Date.now().toString(36)}`, new Date());
    if (!inserat) return;
    onInserate([inserat, ...inserate]);
    setAssistent(false);
  }

  // Solange der QR-Code offen ist, wartet dieses Handy auf das zweite Handy des Käufers
  useEffect(() => {
    if (!qrFuer) return;
    setPeerId(undefined);
    setNetzFehler(false);
    let beenden = () => {};
    let aktiv = true;
    verkaeuferStarten(
      (id, code) => {
        const i = inserateRef.current.find((x) => x.id === qrFuer);
        if (!i || !uebergabeGueltig(i, `reroom://uebergabe/${id}/${code}`)) return undefined;
        // Bestätigung vom Käufer-Handy: weiter wie beim Scannen
        setTimeout(() => { setQrFuer(undefined); setErloesFuer(i.id); }, 600);
        return i.titel;
      },
      (id) => aktiv && setPeerId(id),
      () => aktiv && setNetzFehler(true),
    ).then((v) => {
      if (aktiv) beenden = v.stoppen;
      else v.stoppen();
    }, () => aktiv && setNetzFehler(true));
    return () => {
      aktiv = false;
      beenden();
    };
  }, [qrFuer]);

  /** Ohne zweites Handy: Der Käufer scannt den QR-Code. Wir lesen den echten Code-Text und prüfen ihn. */
  function kaeuferScannt(i: Inserat) {
    if (!uebergabeGueltig(i, qrText(i))) return setFehler("Der Code passt nicht zu diesem Inserat.");
    setFehler("");
    setQrFuer(undefined);
    setErloesFuer(i.id);
  }

  function erloesWaehlen(i: Inserat, art: Erloesart) {
    aendern(i.id, { status: "uebergeben", erloesart: art });
    if (art === "guthaben") onGuthaben(guthaben + guthabenCent(erloesCent(i.preis)));
    setErloesFuer(undefined);
  }

  return (
    <section>
      <div className="kopf">
        <h1 style={{ margin: 0 }}>Verkaufen</h1>
        {guthaben > 0 && <span className="chip" title="Wird im Warenkorb abgezogen"><Icon name="tasche" groesse={14} /> Guthaben {euro(guthaben)}</span>}
      </div>
      <p className="gedaempft" style={{ marginTop: 0 }}>Alte Möbel verkaufen und den Erlös für neue nutzen.</p>

      <button className="knopf breit" onClick={() => setAssistent(true)}><Icon name="plus" groesse={20} /> Möbel einstellen</button>

      <h2 style={{ marginBottom: 4 }}>So läuft Verkaufen</h2>
      <p className="gedaempft" style={{ margin: "0 0 6px", fontSize: ".84rem" }}>In dieser Demo gibt es keine echte Zahlung. Die Schritte zeigen, wie es später abläuft.</p>
      <ol className="ablauf" aria-label="So funktioniert Verkaufen">
        {SCHRITTE.map(([titel, text], i) => (
          <li key={titel}><span className="nr" aria-hidden="true">{i + 1}</span><span><strong>{titel}</strong><small>{text}</small></span></li>
        ))}
      </ol>

      {(() => {
        const b = ausSternen(inserate.flatMap((i) => (i.bewertung ? [i.bewertung] : [])));
        return b ? <p className="bewertung" style={{ margin: "12px 0 0" }}><b aria-hidden="true">★</b> Deine Bewertung: {bewertungText(b)}</p> : null;
      })()}
      <h2>Meine Inserate</h2>
      {inserate.length === 0 && <Leer titel="Noch nichts eingestellt">Tippe oben auf „Möbel einstellen“. Das dauert etwa eine Minute.</Leer>}

      {inserate.map((i) => (
        <article className="inserat" key={i.id}>
          <div className="inserat-kopf">
            <button className="inserat-bild" onClick={() => onOeffnen(i.id)} aria-label={`${i.titel} so ansehen, wie Käufer es sehen`}>
              <img src={i.fotos[0]} alt="" />
            </button>
            <div className="inserat-text">
              <strong>{i.titel}</strong>
              <span className="gedaempft">{i.zustand} · {i.masseCm.breite} × {i.masseCm.tiefe} × {i.masseCm.hoehe} cm</span>
              <b className="preis-zahl">{euro(alsCent(i.preis))}</b>
            </div>
            <span className={`status-pille ${i.status}`}>{i.status === "online" ? "Online" : i.status === "verkauft" ? "Bezahlt" : "Übergeben"}</span>
          </div>
          {i.hervorgehoben && <p className="gedaempft" style={{ margin: 0, fontSize: ".82rem" }}>Wird oben angezeigt.</p>}

          {i.status === "online" && (
            <div className="inserat-aktionen">
              <p className="gedaempft" style={{ margin: 0, fontSize: ".84rem" }}>
                Käufer zahlen {euro(kaeuferZahltCent(i.preis))} (mit Käuferschutz). Du bekommst {euro(erloesCent(i.preis))}.
              </p>
              <div className="reihe">
                <button className="knopf leise" onClick={() => aendern(i.id, { status: "verkauft" })}>Demo: Käufer kauft jetzt</button>
                <button className="knopf leise" onClick={() => onInserate(inserate.filter((x) => x.id !== i.id))} aria-label={`${i.titel} löschen`}>Löschen</button>
              </div>
            </div>
          )}

          {i.status === "verkauft" && (
            <div className="inserat-aktionen">
              <p style={{ margin: 0 }}>Ein Käufer hat bezahlt. Das Geld liegt beim Zahlungsdienstleister, bis du das Möbel übergeben hast.</p>
              <button className="knopf breit" onClick={() => { setFehler(""); setQrFuer(i.id); }}>Zur Übergabe: QR-Code zeigen</button>
            </div>
          )}

          {i.status === "uebergeben" && (
            <div className="inserat-aktionen">
              <p style={{ margin: 0 }}>
                {i.erloesart === "guthaben"
                  ? <>Übergeben. <b>{euro(guthabenCent(erloesCent(i.preis)))}</b> Guthaben sind gutgeschrieben (mit 5 % Bonus).</>
                  : <>Übergeben. <b>{euro(erloesCent(i.preis))}</b> werden auf dein Konto ausgezahlt (Demo).</>}
              </p>
              {i.bewertung ? (
                <p className="bewertung" style={{ margin: 0 }}><b aria-hidden="true">{"★".repeat(i.bewertung)}</b> Der Käufer hat dich bewertet.</p>
              ) : (
                <div>
                  <p className="gedaempft" style={{ margin: "0 0 6px", fontSize: ".84rem" }}>Demo: So bewertet dich der Käufer.</p>
                  <div className="stern-wahl" role="group" aria-label="Bewertung des Käufers">
                    {[1, 2, 3, 4, 5].map((n) => <button key={n} className="chip" onClick={() => aendern(i.id, { bewertung: n })}>{n} ★</button>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </article>
      ))}

      {assistent && <InseratAssistent onFertig={einstellen} onSchliessen={() => setAssistent(false)} />}

      {qrInserat && (
        <div className="sheet-hintergrund" onClick={() => setQrFuer(undefined)}>
          <div className="sheet qr-sheet" role="dialog" aria-modal="true" aria-label="Übergabe-Code" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-kopf">
              <strong className="titel-schrift">Übergabe</strong>
              <button className="rund" onClick={() => setQrFuer(undefined)} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
            </div>
            <div className="qr-inhalt">
              <p style={{ margin: 0, textAlign: "center" }}>Zeig dem Käufer diesen Code, wenn er {qrInserat.titel} abholt. Erst wenn er ihn scannt, bekommst du dein Geld.</p>
              <div className="qr-rahmen" data-link={peerId ? uebergabeLink(qrInserat, peerId, location.origin + location.pathname) : undefined}><QrCode text={peerId ? uebergabeLink(qrInserat, peerId, location.origin + location.pathname) : qrText(qrInserat)} groesse={230} /></div>
              <p className="code-ziffern" aria-label={`Code ${qrInserat.code.split("").join(" ")}`}>{qrInserat.code.slice(0, 3)} {qrInserat.code.slice(3)}</p>
              <p className="gedaempft" role="status" style={{ margin: 0, textAlign: "center", fontSize: ".86rem" }}>
                {netzFehler
                  ? "Keine Verbindung zum Vermittler. Ohne Internet geht die Übergabe nur mit dem Knopf unten."
                  : peerId
                    ? "Bereit. Der Käufer scannt mit seiner Kamera, öffnet den Link und bestätigt. Lass diese Seite offen."
                    : "Verbindung wird vorbereitet …"}
              </p>
              {fehler && <p role="alert" className="hinweis">{fehler}</p>}
              <button className="knopf leise breit" onClick={() => kaeuferScannt(qrInserat)}>Ohne zweites Handy testen: Käufer scannt jetzt</button>
            </div>
          </div>
        </div>
      )}

      {erloesInserat && (
        <div className="sheet-hintergrund">
          <div className="sheet qr-sheet" role="dialog" aria-modal="true" aria-label="Erlös wählen">
            <div className="sheet-kopf"><strong className="titel-schrift">Übergeben. Wie willst du dein Geld?</strong></div>
            <div className="qr-inhalt">
              <button className="erloes-wahl" onClick={() => erloesWaehlen(erloesInserat, "guthaben")}>
                <span><strong>Als Guthaben</strong><small>Für den nächsten Einkauf, mit 5 % Bonus</small></span>
                <b>{euro(guthabenCent(erloesCent(erloesInserat.preis)))}</b>
              </button>
              <button className="erloes-wahl" onClick={() => erloesWaehlen(erloesInserat, "auszahlung")}>
                <span><strong>Auf mein Konto</strong><small>Ohne Bonus, Auszahlung ist hier eine Demo</small></span>
                <b>{euro(erloesCent(erloesInserat.preis))}</b>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
