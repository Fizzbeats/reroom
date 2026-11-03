import { useEffect, useState } from "react";
import type { Moebel } from "../models/types";
import { aktionText } from "../logic/aktion";
import {
  abonnieren, aktiverTarif, freundBeigetreten, gueltigBisText, preisalarmUmschalten, TARIFE,
  type Konto as KontoDaten, type Tarif,
} from "../logic/tarif";
import { Icon } from "./ui";
import Rechtliches, { type RechtlichesSeite } from "./Rechtliches";

interface Props {
  konto: KontoDaten;
  katalog: Moebel[];
  onKonto: (k: KontoDaten) => void;
  onSchliessen: () => void;
}

function TarifKarte({ t, aktiv, onWaehlen }: { t: Tarif; aktiv: boolean; onWaehlen: () => void }) {
  return (
    <article className={`tarif-karte${aktiv ? " aktiv" : ""}`}>
      <div className="reihe">
        <strong className="titel-schrift">{t.name}</strong>
        {aktiv && <span className="status-pille online">Dein Tarif</span>}
      </div>
      <p className="tarif-preis">{t.preis}</p>
      <ul className="tarif-features">
        {t.features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {!aktiv && t.id !== "free" && <button className="knopf breit" onClick={onWaehlen}>Freischalten (Demo, ohne Zahlung)</button>}
      {!aktiv && t.id === "free" && <button className="knopf leise breit" onClick={onWaehlen}>Zu Free wechseln</button>}
    </article>
  );
}

/** Konto und Preise: aktueller Tarif, die Tarife aus dem Businessplan, Freunde einladen, Preisalarm. Bezahlt wird nicht. */
export default function Konto({ konto, katalog, onKonto, onSchliessen }: Props) {
  const jetzt = new Date();
  const aktiv = aktiverTarif(konto, jetzt);
  const aktion = aktionText(jetzt);
  const [hinweis, setHinweis] = useState("");
  const [recht, setRecht] = useState<RechtlichesSeite>();
  const [alarmMeldung, setAlarmMeldung] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onSchliessen();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onSchliessen]);

  async function teilen() {
    const text = `Komm zu ReRoom: Ausmessen, Stil wählen, günstiger einrichten. Mein Einladungscode: ${konto.einladungsCode}`;
    const url = `${location.origin}${location.pathname}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ReRoom", text, url });
        return;
      } catch {
        /* abgebrochen: dann kopieren wir stattdessen */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setHinweis("Einladung kopiert. Schick sie einem Freund.");
    } catch {
      setHinweis(`Dein Code: ${konto.einladungsCode}`);
    }
  }

  const alarme = konto.preisalarm.map((id) => katalog.find((m) => m.id === id)).filter((m): m is Moebel => Boolean(m));

  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label="Dein Konto">
      <div className="vollbild-innen">
        <div className="reihe">
          <h1 style={{ margin: 0 }}>Dein Konto</h1>
          <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>

        <div className="konto-karte">
          <small>{konto.name ? `Hallo ${konto.name}` : "Dein Tarif"}</small>
          <strong>{aktiv.name}</strong>
          <span>{gueltigBisText(konto, jetzt)}</span>
        </div>
        {aktion && <p className="aktion-banner">{aktion}</p>}
        <p className="gedaempft" style={{ fontSize: ".84rem", margin: "4px 0 0" }}>In dieser Demo wird nichts bezahlt. „Freischalten“ zeigt, wie es später aussieht.</p>

        <label className="profil-feld">
          Dein Name (Demo-Profil, bleibt auf diesem Gerät)
          <input value={konto.name ?? ""} maxLength={30} autoComplete="off" placeholder="z. B. Alex" onChange={(e) => onKonto({ ...konto, name: e.target.value })} />
        </label>

        <h2>Tarife</h2>
        {TARIFE.filter((t) => !t.fuerMakler).map((t) => (
          <TarifKarte key={t.id} t={t} aktiv={aktiv.id === t.id} onWaehlen={() => onKonto(abonnieren(konto, t.id, new Date()))} />
        ))}

        <h2>Für Makler und Vermieter</h2>
        {TARIFE.filter((t) => t.fuerMakler).map((t) => (
          <TarifKarte key={t.id} t={t} aktiv={aktiv.id === t.id} onWaehlen={() => onKonto(abonnieren(konto, t.id, new Date()))} />
        ))}

        <h2>Freunde einladen</h2>
        <div className="flaeche">
          <p style={{ margin: 0 }}>Wer Freunde einlädt, bekommt den Umzugs-Pass gratis.</p>
          <div className="einladung">
            <span className="code-pille" aria-label={`Dein Code ${konto.einladungsCode}`}>{konto.einladungsCode}</span>
            <button className="knopf" onClick={() => void teilen()}>Einladen</button>
          </div>
          <p className="gedaempft" style={{ margin: 0, fontSize: ".84rem" }}>
            {konto.freunde === 0 ? "Noch niemand beigetreten." : `${konto.freunde} ${konto.freunde === 1 ? "Freund ist" : "Freunde sind"} beigetreten.`}
          </p>
          <button className="knopf leise" onClick={() => onKonto(freundBeigetreten(konto, new Date()))}>Demo: Ein Freund tritt bei</button>
          {hinweis && <p role="status" className="hinweis" style={{ margin: 0 }}>{hinweis}</p>}
        </div>

        {aktiv.preisalarm && (
          <>
            <h2>Preisalarm</h2>
            <div className="flaeche">
              {alarme.length === 0 && <p className="gedaempft" style={{ margin: 0 }}>Öffne ein Möbel und tippe auf „Preisalarm“.</p>}
              {alarme.map((m) => (
                <div className="reihe" key={m.id}>
                  <span>{m.name}</span>
                  <span className="reihe" style={{ gap: 8 }}>
                    <button className="chip" onClick={() => setAlarmMeldung(`Preisalarm: ${m.name} kostet jetzt ${Math.round(m.preis * 0.9).toLocaleString("de-DE")} € statt ${m.preis.toLocaleString("de-DE")} €. (Demo, −10 %)`)}>Demo: Preis sinkt</button>
                    <button className="chip" onClick={() => onKonto(preisalarmUmschalten(konto, m.id))}>Entfernen</button>
                  </span>
                </div>
              ))}
              {alarmMeldung && <p role="status" className="hinweis" style={{ margin: 0 }}>{alarmMeldung}</p>}
              <p className="gedaempft" style={{ margin: 0, fontSize: ".82rem" }}>Echte Benachrichtigungen braucht ein Server. Hier zeigt „Demo: Preis sinkt“, wie sie später aussehen.</p>
            </div>
          </>
        )}

        <p className="gedaempft" style={{ marginTop: 28, display: "flex", gap: 16 }}>
          <button className="link" onClick={() => setRecht("datenschutz")}>Datenschutz</button>
          <button className="link" onClick={() => setRecht("impressum")}>Impressum</button>
        </p>
      </div>
      {recht && <Rechtliches seite={recht} onSchliessen={() => setRecht(undefined)} />}
    </div>
  );
}
