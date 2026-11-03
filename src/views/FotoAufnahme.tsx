import { useEffect, useRef, useState } from "react";
import { bildAusVideo, kameraMoeglich, kameraStarten, stromStoppen, type Kameraseite } from "../services/kamera";
import { kameraFehlerText, RAHMEN_TEXT, type RahmenArt } from "../logic/kameraText";
import { Icon } from "./ui";

interface Props {
  /** Was wird fotografiert: bestimmt Rahmen und Hinweis */
  rahmen: RahmenArt;
  titel: string;
  /** Wird für jedes Foto aufgerufen */
  onFoto: (datei: File) => void | Promise<void>;
  /** Mehrere Fotos hintereinander? Dann bleibt die Kamera offen, bis „Fertig“ gedrückt wird. */
  mehrere?: boolean;
  /** Höchstzahl bei `mehrere`, danach schließt die Kamera von selbst */
  max?: number;
  onSchliessen: () => void;
}

/** Eingebaute Kamera: Bild mit Rahmen, großer Auslöser, Kamerawechsel und Galerie als Ausweg. */
export default function FotoAufnahme({ rahmen, titel, onFoto, mehrere = false, max = 1, onSchliessen }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const strom = useRef<MediaStream | null>(null);
  const [seite, setSeite] = useState<Kameraseite>("environment");
  const [fehler, setFehler] = useState("");
  const [bereit, setBereit] = useState(false);
  const [anzahl, setAnzahl] = useState(0);
  const [blitz, setBlitz] = useState(false);
  const [beschaeftigt, setBeschaeftigt] = useState(false);

  useEffect(() => {
    if (!kameraMoeglich()) {
      setFehler(kameraFehlerText(undefined, window.isSecureContext));
      return;
    }
    let abgebrochen = false;
    setBereit(false);
    kameraStarten(seite)
      .then((s) => {
        if (abgebrochen) return stromStoppen(s);
        strom.current = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => undefined);
        }
        setFehler("");
      })
      .catch((e) => !abgebrochen && setFehler(kameraFehlerText(e)));
    return () => {
      abgebrochen = true;
      stromStoppen(strom.current);
      strom.current = null;
    };
  }, [seite]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onSchliessen();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onSchliessen]);

  async function aufnehmen() {
    const v = video.current;
    if (!v || !bereit || beschaeftigt || v.videoWidth === 0) return;
    setBeschaeftigt(true);
    try {
      const datei = await bildAusVideo(v);
      setBlitz(true);
      setTimeout(() => setBlitz(false), 140);
      await onFoto(datei);
      const neu = anzahl + 1;
      setAnzahl(neu);
      if (!mehrere || neu >= max) onSchliessen();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Das Foto konnte nicht aufgenommen werden.");
    } finally {
      setBeschaeftigt(false);
    }
  }

  async function ausGalerie(liste: FileList | null) {
    const dateien = [...(liste ?? [])].slice(0, mehrere ? Math.max(1, max - anzahl) : 1);
    if (dateien.length === 0) return;
    setBeschaeftigt(true);
    try {
      for (const d of dateien) await onFoto(d);
      onSchliessen();
    } finally {
      setBeschaeftigt(false);
    }
  }

  return (
    <div className="kamera" role="dialog" aria-modal="true" aria-label={titel}>
      <video ref={video} className="kamera-bild" playsInline muted autoPlay onPlaying={() => setBereit(true)} />
      {blitz && <div className="kamera-blitz" />}

      {!fehler && (
        <div className={`kamera-rahmen ${rahmen}`} aria-hidden="true">
          <i /><i /><i /><i />
          <span>{RAHMEN_TEXT[rahmen]}</span>
        </div>
      )}

      <div className="kamera-kopf">
        <button className="rund" onClick={onSchliessen} aria-label="Kamera schließen"><Icon name="schliessen" groesse={18} /></button>
        <strong>{titel}</strong>
        <span style={{ width: 42 }} />
      </div>

      {fehler && (
        <div className="kamera-fehler" role="alert">
          <Icon name="kamera" groesse={34} />
          <p>{fehler}</p>
        </div>
      )}

      <div className="kamera-fuss">
        <label className="kamera-galerie" aria-label="Aus der Galerie wählen">
          <Icon name="foto" groesse={24} />
          <span>Galerie</span>
          <input type="file" accept="image/*" multiple={mehrere} onChange={(e) => void ausGalerie(e.target.files)} disabled={beschaeftigt} />
        </label>

        <button className="kamera-ausloeser" onClick={() => void aufnehmen()} disabled={!bereit || beschaeftigt || Boolean(fehler)} aria-label="Foto aufnehmen">
          <span />
        </button>

        {mehrere && anzahl > 0 ? (
          <button className="kamera-fertig" onClick={onSchliessen}>Fertig ({anzahl})</button>
        ) : (
          <button className="kamera-wechsel" onClick={() => setSeite(seite === "environment" ? "user" : "environment")} aria-label="Kamera wechseln" disabled={Boolean(fehler)}>
            <Icon name="wechseln" groesse={26} />
            <span>Wechseln</span>
          </button>
        )}
      </div>
    </div>
  );
}
