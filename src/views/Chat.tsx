import { useEffect, useRef, useState } from "react";
import type { Moebel, Raum } from "../models/types";
import { antworte, type Kontext } from "../logic/chatbot";
import { FRAGEN_PRO_TAG, tagVon, verbleibend, verbrauche, type Verbrauch } from "../logic/chatLimit";
import { pruefeMoebel } from "../logic/passtCheck";
import { alsCent, euro } from "../logic/preisRechner";
import { chatBegruessung } from "../logic/texte";
import { AmpelSchild, Icon, MoebelBild, kurzInfo } from "./ui";

export interface Nachricht {
  id: number;
  von: "ich" | "bot";
  text: string;
  treffer?: Moebel[];
  kontext?: Kontext;
}

interface Props {
  katalog: Moebel[];
  raum?: Raum;
  nachrichten: Nachricht[];
  onNachrichten: (n: Nachricht[]) => void;
  verbrauch: Verbrauch;
  onVerbrauch: (v: Verbrauch) => void;
  onOeffnen: (id: string) => void;
  onSchliessen: () => void;
  /** Der Tarif erlaubt unbegrenzt Fragen */
  unbegrenzt: boolean;
  onTarife: () => void;
}

const VORSCHLAEGE = [
  "Graues Sofa unter 400 €, das in meine Nische passt",
  "Skandi-Regal unter 100 €",
  "Passt das Sofa Lund durch meine Tür?",
  "Wie funktioniert der Cashback?",
];

/** Chat als Sheet von unten. Lokaler Ersatz-Bot, später austauschbar gegen die Claude-API über eine Cloud-Funktion. */
export default function Chat({ katalog, raum, nachrichten, onNachrichten, verbrauch, onVerbrauch, onOeffnen, onSchliessen, unbegrenzt, onTarife }: Props) {
  const [eingabe, setEingabe] = useState("");
  const ende = useRef<HTMLDivElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const heute = tagVon(new Date());
  const rest = unbegrenzt ? Infinity : verbleibend(verbrauch, heute);

  useEffect(() => {
    feld.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onSchliessen();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onSchliessen]);

  useEffect(() => {
    ende.current?.scrollIntoView({ block: "end" });
  }, [nachrichten.length]);

  function senden(text: string) {
    const frage = text.trim();
    if (!frage) return;
    const naechsteId = (nachrichten.at(-1)?.id ?? 0) + 1;
    const ich: Nachricht = { id: naechsteId, von: "ich", text: frage };
    setEingabe("");

    const letzteBotAntwort = [...nachrichten].reverse().find((n) => n.von === "bot");
    const vorher = letzteBotAntwort?.kontext?.rueckfrage ? letzteBotAntwort.kontext : undefined;

    // Antworten auf eine Rückfrage kosten keine zusätzliche Frage
    if (!vorher && rest === 0) {
      onNachrichten([...nachrichten, ich, {
        id: naechsteId + 1, von: "bot",
        text: `Heute sind deine ${FRAGEN_PRO_TAG} kostenlosen Fragen aufgebraucht. Morgen sind es wieder ${FRAGEN_PRO_TAG}. Mit dem Umzugs-Pass fragst du unbegrenzt.`,
      }]);
      return;
    }

    const a = antworte(frage, katalog, raum, vorher ?? {});
    const bot: Nachricht = {
      id: naechsteId + 1, von: "bot", text: a.text, treffer: a.treffer,
      kontext: a.rueckfrage ? { kriterien: a.kriterien, rueckfrage: a.rueckfrage } : undefined,
    };
    onNachrichten([...nachrichten, ich, bot]);
    if (!vorher) onVerbrauch(verbrauche(verbrauch, heute));
  }

  const gesperrt = rest === 0 && !nachrichten.at(-1)?.kontext?.rueckfrage;

  return (
    <div className="sheet-hintergrund" onClick={onSchliessen}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="ReRoom-Assistent" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-kopf">
          <div>
            <strong className="titel-schrift">Assistent</strong>
            <small className="gedaempft" style={{ display: "block" }}>
              {rest === Infinity ? "Unbegrenzt mit deinem Tarif" : `Noch ${rest} von ${FRAGEN_PRO_TAG} Fragen heute`}
            </small>
          </div>
          <button className="rund" onClick={onSchliessen} aria-label="Chat schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>

        <div className="sheet-verlauf" aria-live="polite">
          <div className="blase bot">{chatBegruessung(raum?.name)}</div>
          {nachrichten.map((n) => (
            <div key={n.id} className={`zeile-chat ${n.von}`}>
              <div className={`blase ${n.von}`}>{n.text}</div>
              {n.treffer && n.treffer.length > 0 && (
                <div className="chat-treffer">
                  {n.treffer.map((m) => {
                    const passt = raum ? pruefeMoebel(m, raum) : undefined;
                    return (
                      <button key={m.id} className="chat-treffer-zeile" onClick={() => { onSchliessen(); onOeffnen(m.id); }}>
                        <span className="mini"><MoebelBild moebel={m} /></span>
                        <span className="info">
                          <strong>{m.name}</strong>
                          <span>{kurzInfo(m)}</span>
                        </span>
                        <span className="rechts">
                          <b>{euro(alsCent(m.preis))}</b>
                          {passt && <AmpelSchild ampel={passt.ampel} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {gesperrt && (
            <button className="knopf breit" onClick={onTarife}>Tarife ansehen</button>
          )}
          <div ref={ende} />
        </div>

        {nachrichten.length === 0 && (
          <div className="chips sheet-vorschlaege" aria-label="Vorschläge">
            {VORSCHLAEGE.map((v) => <button key={v} className="chip" onClick={() => senden(v)}>{v}</button>)}
          </div>
        )}

        <form className="sheet-eingabe" onSubmit={(e) => { e.preventDefault(); senden(eingabe); }}>
          <input ref={feld} value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Frag nach einem Möbel …" aria-label="Deine Frage" autoComplete="off" enterKeyHint="send" />
          <button className="knopf" type="submit" disabled={eingabe.trim() === "" || gesperrt} aria-label="Senden">Senden</button>
        </form>
      </div>
    </div>
  );
}
