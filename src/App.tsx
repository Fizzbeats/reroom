import { useEffect, useState } from "react";
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
import Warenkorb from "./views/Warenkorb";
import Verkaufen from "./views/Verkaufen";
import { Icon, type IconName } from "./views/ui";

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

export default function App() {
  const [tab, setTab] = useState<Tab>("Start");
  const [detailId, setDetailId] = useState<string>();
  const [stilFinderOffen, setStilFinderOffen] = useState(false);
  const [katalog, setKatalog] = useState<Moebel[]>([]);
  const [raeume, setRaeume] = useLokal<Raum[]>("reroom.raeume", []);
  const [aktiverRaum, setAktiverRaum] = useLokal<string>("reroom.aktiverRaum", "");
  const [korb, setKorb] = useLokal<string[]>("reroom.korb", []);
  const [stile, setStile] = useLokal<Stil[]>("reroom.stile", []);
  // Möbel, die der Nutzer in einen Raum gestellt hat, je Raum-ID
  const [moebelImRaum, setMoebelImRaum] = useLokal<Record<string, string[]>>("reroom.imRaum", {});
  const [willkommenGesehen, setWillkommenGesehen] = useLokal<boolean>("reroom.willkommenGesehen", false);

  useEffect(() => {
    repository.alle().then(setKatalog);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

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
          />
        )}
        {tab === "Messen" && (
          <Scannen
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
            onEntfernen={korbUmschalten}
            onLeeren={() => setKorb([])}
            onOeffnen={setDetailId}
          />
        )}
        {tab === "Verkaufen" && <Verkaufen />}
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

      {!willkommenGesehen && (
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
            onClick={() => gehe(t.id)}
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
