import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { Moebel, Raum, Stil } from "./models/types";
import { BEISPIELRAEUME } from "./data/raeume";
import { LokalesMoebelRepository } from "./data/moebelRepository";
import { useLokal } from "./useLokal";
import Start from "./views/Start";
import Scannen from "./views/Scannen";
import Entdecken from "./views/Entdecken";
import Detail from "./views/Detail";
import StilFinder from "./views/StilFinder";
import Willkommen from "./views/Willkommen";
import Chat, { type Nachricht } from "./views/Chat";
import Warenkorb from "./views/Warenkorb";
import Verkaufen from "./views/Verkaufen";
import KontoSeite from "./views/Konto";
import GeteilteWohnung from "./views/GeteilteWohnung";
import { leseTeilLink, teilLink, type Teilen } from "./logic/teilen";
import KaeuferUebergabe from "./views/KaeuferUebergabe";
import { liesUebergabeLink } from "./logic/verkaufen";
import { Icon, type IconName } from "./views/ui";
import type { FestePlatz, Platzierung } from "./logic/einrichten";
import { inseratZuMoebel, type Inserat } from "./logic/verkaufen";
import { aktiverTarif, darfRaumSpeichern, neuesKonto, preisalarmUmschalten, type Konto } from "./logic/tarif";
import { NEU as KEIN_VERBRAUCH, type Verbrauch } from "./logic/chatLimit";

// Die 3D-Bibliothek ist groß und wird erst geladen, wenn jemand den Rundgang öffnet
const Rundgang3D = lazy(() => import("./views/Rundgang3D"));

type Tab = "Start" | "Entdecken" | "Messen" | "Warenkorb" | "Verkaufen";

// Messen sitzt als runder Knopf in der Mitte der Leiste
const TABS: { id: Tab; icon: IconName; mitte?: boolean }[] = [
  { id: "Start", icon: "home" },
  { id: "Entdecken", icon: "suche" },
  { id: "Messen", icon: "kamera", mitte: true },
  { id: "Warenkorb", icon: "tasche" },
  { id: "Verkaufen", icon: "etikett" },
];

const repository = new LokalesMoebelRepository();
const START_KONTO: Konto = neuesKonto();

export default function App() {
  const [tab, setTab] = useState<Tab>("Start");
  const [detailId, setDetailId] = useState<string>();
  const [stilFinderOffen, setStilFinderOffen] = useState(false);
  const [chatOffen, setChatOffen] = useState(false);
  const [kontoOffen, setKontoOffen] = useState(false);
  // Wer einen Wohnungs-Link öffnet, sieht zuerst die geteilte Wohnung
  const [geteilt, setGeteilt] = useState<Teilen | undefined>(() => leseTeilLink(location.hash));
  const [geteiltRundgang, setGeteiltRundgang] = useState<Platzierung[]>();
  // Zweites Handy: Käufer hat den QR-Code der Übergabe gescannt
  const [uebergabe, setUebergabe] = useState(() => liesUebergabeLink(location.hash));
  const [konto, setKonto] = useLokal<Konto>("reroom.konto", START_KONTO);
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [verbrauch, setVerbrauch] = useLokal<Verbrauch>("reroom.chat", KEIN_VERBRAUCH);
  const [rundgang, setRundgang] = useState<Platzierung[]>();
  const [basisKatalog, setKatalog] = useState<Moebel[]>([]);
  // Eigene Inserate und Guthaben aus verkauften Möbeln (in Cent)
  const [inserate, setInserate] = useLokal<Inserat[]>("reroom.inserate2", []);
  const [guthaben, setGuthaben] = useLokal<number>("reroom.guthaben", 0);
  // Online stehende Inserate sehen Käufer wie jedes andere gebrauchte Möbel
  const katalog = useMemo(
    () => [...inserate.filter((i) => i.status === "online").map(inseratZuMoebel), ...basisKatalog],
    [inserate, basisKatalog],
  );
  const [raeume, setRaeume] = useLokal<Raum[]>("reroom.raeume", []);
  const [aktiverRaum, setAktiverRaum] = useLokal<string>("reroom.aktiverRaum", "");
  const [korb, setKorb] = useLokal<string[]>("reroom.korb", []);
  const [stile, setStile] = useLokal<Stil[]>("reroom.stile", []);
  // Möbel, die der Nutzer in einen Raum gestellt hat, je Raum-ID
  const [moebelImRaum, setMoebelImRaum] = useLokal<Record<string, string[]>>("reroom.imRaum", {});
  // Vom Nutzer verschobene Möbel, je Raum
  const [festePlaetze, setFestePlaetze] = useLokal<Record<string, Record<string, FestePlatz>>>("reroom.positionen", {});
  const [willkommenGesehen, setWillkommenGesehen] = useLokal<boolean>("reroom.willkommenGesehen", false);

  useEffect(() => {
    repository.alle().then(setKatalog);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const tarif = aktiverTarif(konto, new Date());
  const limitErreicht = !darfRaumSpeichern(raeume.length, tarif);
  const tarifeOeffnen = () => {
    setChatOffen(false);
    setDetailId(undefined);
    setKontoOffen(true);
  };
  const raum = [...raeume, ...BEISPIELRAEUME].find((r) => r.id === aktiverRaum);
  const imRaum = raum ? moebelImRaum[raum.id] ?? [] : [];
  const detail = katalog.find((m) => m.id === detailId);

  const korbUmschalten = (id: string) => setKorb(korb.includes(id) ? korb.filter((k) => k !== id) : [...korb, id]);
  const inKorb = (ids: string[]) => setKorb([...new Set([...korb, ...ids])]);
  const imRaumUmschalten = (id: string) => {
    if (!raum) return;
    const neu = imRaum.includes(id) ? imRaum.filter((k) => k !== id) : [...imRaum, id];
    setMoebelImRaum({ ...moebelImRaum, [raum.id]: neu });
  };
  const gehe = (t: Tab) => {
    setDetailId(undefined);
    setTab(t);
  };

  return (
    <div className="app">
      <main>
        {tab === "Start" && (
          <Start
            katalog={katalog} raeume={raeume} raum={raum} imRaum={imRaum} stile={stile}
            onStile={setStile} onWaehlen={setAktiverRaum} onOeffnen={setDetailId}
            onAlleInKorb={(ids) => { inKorb(ids); gehe("Warenkorb"); }}
            onMessen={() => gehe("Messen")} onEntdecken={() => gehe("Entdecken")} onStilFinder={() => setStilFinderOffen(true)}
            onRundgang={setRundgang} onKonto={() => setKontoOffen(true)}
            feste={raum ? festePlaetze[raum.id] ?? {} : {}}
            onTeilen={async (ids) => {
              if (!raum) return "";
              const link = teilLink({ raum, moebelIds: ids, feste: festePlaetze[raum.id] ?? {} }, location.origin + location.pathname);
              if (navigator.share) {
                try {
                  await navigator.share({ title: `Meine Wohnung mit ReRoom: ${raum.name}`, url: link });
                  return "";
                } catch {
                  /* abgebrochen: dann kopieren wir den Link */
                }
              }
              try {
                await navigator.clipboard.writeText(link);
                return "Link kopiert. Wer ihn öffnet, sieht deine Wohnung.";
              } catch {
                return "Der Link konnte nicht kopiert werden.";
              }
            }}
            onFeste={(f) => raum && setFestePlaetze({ ...festePlaetze, [raum.id]: f })}
          />
        )}
        {tab === "Messen" && (
          <Scannen
            limitErreicht={limitErreicht}
            tarifName={tarif.name}
            maxRaeume={tarif.maxRaeume}
            onTarife={tarifeOeffnen}
            onErsetzen={() => {
              setRaeume([]);
              setAktiverRaum("");
            }}
            onSpeichern={(r) => {
              setRaeume([...raeume, r]);
              setAktiverRaum(r.id);
              gehe("Start");
            }}
          />
        )}
        {tab === "Entdecken" && <Entdecken katalog={katalog} raum={raum} stile={stile} onStile={setStile} onOeffnen={setDetailId} />}
        {tab === "Warenkorb" && (
          <Warenkorb
            positionen={katalog.filter((m) => korb.includes(m.id))}
            guthabenCent={guthaben}
            onGuthabenVerbraucht={(cent) => setGuthaben(Math.max(0, guthaben - cent))}
            onEntfernen={korbUmschalten}
            onLeeren={() => setKorb([])}
            onOeffnen={setDetailId}
          />
        )}
        {tab === "Verkaufen" && (
          <Verkaufen inserate={inserate} onInserate={setInserate} guthabenCent={guthaben} onGuthaben={setGuthaben} onOeffnen={setDetailId} />
        )}
      </main>

      {detail && (
        <Detail
          moebel={detail}
          katalog={katalog}
          raum={raum}
          imRaum={imRaum}
          imKorb={korb.includes(detail.id)}
          onKorb={() => korbUmschalten(detail.id)}
          onImRaum={() => imRaumUmschalten(detail.id)}
          onZurueck={() => setDetailId(undefined)}
          feste={raum ? festePlaetze[raum.id] : undefined}
          preisalarm={{
            erlaubt: tarif.preisalarm,
            an: konto.preisalarm.includes(detail.id),
            onUmschalten: () => setKonto(preisalarmUmschalten(konto, detail.id)),
            onTarife: tarifeOeffnen,
          }}
        />
      )}

      {stilFinderOffen && (
        <StilFinder
          katalog={katalog}
          raum={raum}
          onSchliessen={() => setStilFinderOffen(false)}
          onFertig={(ergebnis, setIds) => {
            if (ergebnis.stile.length > 0) setStile(ergebnis.stile);
            inKorb(setIds);
            setStilFinderOffen(false);
            gehe("Warenkorb");
          }}
        />
      )}

      {!chatOffen && !detail && willkommenGesehen && (
        <button className="chat-fab" onClick={() => setChatOffen(true)} aria-label="Assistent öffnen">
          <Icon name="chat" groesse={24} />
        </button>
      )}

      {chatOffen && (
        <Chat
          katalog={katalog}
          raum={raum}
          nachrichten={nachrichten}
          onNachrichten={setNachrichten}
          verbrauch={verbrauch}
          onVerbrauch={setVerbrauch}
          onOeffnen={setDetailId}
          onSchliessen={() => setChatOffen(false)}
          unbegrenzt={tarif.chatUnbegrenzt}
          onTarife={tarifeOeffnen}
        />
      )}

      {geteilt && basisKatalog.length > 0 && !geteiltRundgang && (
        <GeteilteWohnung
          daten={geteilt}
          katalog={katalog}
          onRundgang={setGeteiltRundgang}
          onSchliessen={() => { setGeteilt(undefined); history.replaceState(null, "", location.pathname + location.search); }}
        />
      )}

      {kontoOffen && <KontoSeite konto={konto} katalog={katalog} onKonto={setKonto} onSchliessen={() => setKontoOffen(false)} />}

      {rundgang && raum && (
        <Suspense fallback={<div className="vollbild rundgang"><p className="rundgang-laden">3D wird geladen …</p></div>}>
          <Rundgang3D raum={raum} platziert={rundgang} onSchliessen={() => setRundgang(undefined)}
            videoErlaubt={tarif.video} onTarife={() => { setRundgang(undefined); setKontoOffen(true); }} />
        </Suspense>
      )}

      {geteilt && geteiltRundgang && (
        <Suspense fallback={null}>
          <Rundgang3D raum={geteilt.raum} platziert={geteiltRundgang} onSchliessen={() => setGeteiltRundgang(undefined)} videoErlaubt={tarif.video} onTarife={() => { setGeteiltRundgang(undefined); setKontoOffen(true); }} />
        </Suspense>
      )}

      {uebergabe && (
        <KaeuferUebergabe
          {...uebergabe}
          onSchliessen={() => { setUebergabe(undefined); history.replaceState(null, "", location.pathname + location.search); }}
        />
      )}

      {!willkommenGesehen && !geteilt && !uebergabe && (
        <Willkommen
          onMessen={() => { setWillkommenGesehen(true); gehe("Messen"); }}
          onStilFinder={() => { setWillkommenGesehen(true); setStilFinderOffen(true); }}
          onStoebern={() => setWillkommenGesehen(true)}
        />
      )}

      <nav className="tabs" aria-label="Hauptmenü">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.mitte ? "mitte" : undefined}
            aria-current={tab === t.id && !detail ? "page" : undefined}
            onClick={() => { setWillkommenGesehen(true); gehe(t.id); }}
          >
            {t.mitte ? <b><Icon name={t.icon} /></b> : <Icon name={t.icon} groesse={24} />}
            {t.id}
            {t.id === "Warenkorb" && korb.length > 0 && <span className="anzahl-punkt">{korb.length}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
