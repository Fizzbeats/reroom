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
  /** Der Tarif (Umzugs-Pass, Premium) enthält das Rundgang-Video */
  videoErlaubt: boolean;
  onTarife: () => void;
}

/** 3D-Ansicht des eingerichteten Raums: im Überblick mit dem Finger drehen, im Rundgang durch den Raum gehen. */
export default function Rundgang3D({ raum, platziert, onSchliessen, videoErlaubt, onTarife }: Props) {
  const [aufnahme, setAufnahme] = useState<"bereit" | "laeuft">("bereit");
  const [video, setVideo] = useState<{ url: string; endung: string; blob: Blob }>();
  const [videoFehler, setVideoFehler] = useState("");
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
  useEffect(() => () => { if (video) URL.revokeObjectURL(video.url); }, [video]);

  async function aufnehmen() {
    if (!videoErlaubt) return onTarife();
    setVideoFehler("");
    setAufnahme("laeuft");
    setModus("rundgang");
    try {
      const r = await szene.current?.aufnehmen();
      if (r) setVideo({ ...r, url: URL.createObjectURL(r.blob) });
    } catch (e) {
      setVideoFehler(e instanceof Error ? e.message : "Aufnahme fehlgeschlagen.");
    }
    setAufnahme("bereit");
  }

  async function speichern() {
    if (!video) return;
    const datei = new File([video.blob], `reroom-rundgang.${video.endung}`, { type: video.blob.type });
    if (navigator.canShare?.({ files: [datei] })) {
      try {
        await navigator.share({ files: [datei], title: "Mein Raum mit ReRoom" });
        return;
      } catch {
        /* abgebrochen: dann laden wir herunter */
      }
    }
    const a = document.createElement("a");
    a.href = video.url;
    a.download = datei.name;
    a.click();
  }

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
        {videoFehler && <small role="alert">{videoFehler}</small>}
        {!video && (
          <button className="knopf leise" disabled={aufnahme === "laeuft" || !!fehler} onClick={() => void aufnehmen()}>
            <Icon name="video" groesse={16} />{" "}
            {aufnahme === "laeuft" ? "Nimmt auf … ca. 30 Sekunden" : videoErlaubt ? "Als Video aufnehmen" : "Als Video (Umzugs-Pass)"}
          </button>
        )}
        {video && (
          <>
            <video src={video.url} controls playsInline muted style={{ width: "100%", borderRadius: 12 }} />
            <button className="knopf" onClick={() => void speichern()}>Video speichern oder teilen</button>
            <button className="link" onClick={() => setVideo(undefined)}>Neu aufnehmen</button>
          </>
        )}
      </div>
    </div>
  );
}
