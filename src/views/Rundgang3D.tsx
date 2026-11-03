import { useEffect, useRef, useState } from "react";
import type { Raum } from "../models/types";
import type { Platzierung } from "../logic/einrichten";
import { starteSzene, type Modus, type Szene3D } from "../services/szene3d";
import { euro, alsCent } from "../logic/preisRechner";
import { Icon } from "./ui";

interface Props {
  raum: Raum;
  platziert: Platzierung[];
  onSchliessen: () => void;
}

/** 3D-Ansicht des eingerichteten Raums: im Überblick mit dem Finger drehen, im Rundgang durch den Raum gehen. */
export default function Rundgang3D({ raum, platziert, onSchliessen }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const szene = useRef<Szene3D | null>(null);
  const [modus, setModus] = useState<Modus>("ueberblick");
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    try {
      szene.current = starteSzene(el, raum, platziert);
    } catch {
      setFehler("Die 3D-Ansicht wird auf diesem Gerät nicht unterstützt. Der Grundriss zeigt dir trotzdem alles.");
    }
    return () => {
      szene.current?.zerstoeren();
      szene.current = null;
    };
  }, [raum, platziert]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onSchliessen();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onSchliessen]);

  const wechseln = (neu: Modus) => {
    setModus(neu);
    szene.current?.setModus(neu);
  };
  const summe = platziert.reduce((s, p) => s + alsCent(p.moebel.preis), 0);

  return (
    <div className="vollbild rundgang" role="dialog" aria-modal="true" aria-label="3D-Rundgang">
      <div className="rundgang-buehne" ref={host} />
      {fehler && <p className="hinweis rundgang-fehler" role="alert">{fehler}</p>}

      <div className="rundgang-kopf">
        <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        <div className="umschalter rundgang-umschalter" role="tablist" aria-label="Ansicht">
          <button role="tab" aria-selected={modus === "ueberblick"} onClick={() => wechseln("ueberblick")}>Überblick</button>
          <button role="tab" aria-selected={modus === "rundgang"} onClick={() => wechseln("rundgang")}>Rundgang</button>
        </div>
      </div>

      <div className="rundgang-fuss">
        <strong>{raum.name}</strong>
        <span>{platziert.length} Möbel · {euro(summe)}</span>
        <small>{modus === "ueberblick" ? "Mit dem Finger drehen, mit zwei Fingern zoomen." : "Du gehst einmal durch den Raum."}</small>
      </div>
    </div>
  );
}
