import { useState } from "react";
import { kaeuferSenden } from "../services/uebergabeNetz";
import { Icon } from "./ui";

interface Props {
  id: string;
  code: string;
  peer: string;
  onSchliessen: () => void;
}

type Stand = "bereit" | "sendet" | "ok" | "falsch" | "keine-verbindung";

/** Käufer-Seite der Übergabe: Das zweite Handy hat den QR-Code gescannt und bestätigt hier, dass es das Möbel bekommen hat. */
export default function KaeuferUebergabe({ id, code, peer, onSchliessen }: Props) {
  const [stand, setStand] = useState<Stand>("bereit");
  const [titel, setTitel] = useState("");

  async function bestaetigen() {
    setStand("sendet");
    const antwort = await kaeuferSenden(peer, id, code);
    if (antwort === "keine-verbindung") return setStand("keine-verbindung");
    if (antwort.art === "ok") {
      setTitel(antwort.titel);
      setStand("ok");
    } else setStand("falsch");
  }

  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label="Übergabe bestätigen">
      <div className="vollbild-innen">
        <div className="reihe">
          <span className="gedaempft">Übergabe</span>
          <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>

        {stand !== "ok" && (
          <>
            <h1 style={{ margin: "14px 0 8px" }}>Hast du das Möbel bekommen?</h1>
            <p>Bestätige die Übergabe nur, wenn du das Möbel in der Hand hast und es in Ordnung ist. Erst dann bekommt der Verkäufer sein Geld.</p>
            <button className="knopf breit" disabled={stand === "sendet"} onClick={() => void bestaetigen()}>
              {stand === "sendet" ? "Verbindet mit dem Verkäufer …" : "Ja, Übergabe bestätigen"}
            </button>
            {stand === "falsch" && <p role="alert" className="hinweis">Der Code passt nicht zu diesem Inserat, oder die Übergabe ist schon erledigt.</p>}
            {stand === "keine-verbindung" && (
              <p role="alert" className="hinweis">Keine Verbindung zum Handy des Verkäufers. Der Verkäufer muss den QR-Code noch geöffnet haben, und ihr braucht beide Internet. Versuch es nochmal.</p>
            )}
          </>
        )}

        {stand === "ok" && (
          <>
            <h1 style={{ margin: "14px 0 8px" }}>Übergabe bestätigt</h1>
            <p><b>{titel}</b> gehört jetzt dir. Der Verkäufer bekommt sein Geld. Die Zahlung ist in diesem Entwurf ein Test, es ist nichts abgebucht worden.</p>
            <button className="knopf breit" onClick={onSchliessen}>Fertig</button>
          </>
        )}
      </div>
    </div>
  );
}
