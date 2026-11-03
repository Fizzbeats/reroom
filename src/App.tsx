import { useEffect, useState } from "react";
import type { Moebel, Raum, Stil } from "./models/types";
import { BEISPIELRAEUME } from "./data/raeume";
import { LokalesMoebelRepository } from "./data/moebelRepository";
import { useLokal } from "./useLokal";
import Start from "./views/Start";
import Scannen from "./views/Scannen";
import Entdecken from "./views/Entdecken";
import Detail from "./views/Detail";
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
  const [katalog, setKatalog] = useState<Moebel[]>([]);
  const [raeume, setRaeume] = useLokal<Raum[]>("reroom.raeume", []);
  const [aktiverRaum, setAktiverRaum] = useLokal<string>("reroom.aktiverRaum", "");
  const [korb, setKorb] = useLokal<string[]>("reroom.korb", []);
  const [stile, setStile] = useLokal<Stil[]>("reroom.stile", []);

  useEffect(() => {
    repository.alle().then(setKatalog);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const raum = [...raeume, ...BEISPIELRAEUME].find((r) => r.id === aktiverRaum);
  const detail = katalog.find((m) => m.id === detailId);
  const korbUmschalten = (id: string) => setKorb(korb.includes(id) ? korb.filter((k) => k !== id) : [...korb, id]);

  return (
    <div className="app">
      <main>
        {tab === "Start" && (
          <Start
            katalog={katalog} raeume={raeume} raum={raum} stile={stile}
            onStile={setStile} onWaehlen={setAktiverRaum} onOeffnen={setDetailId}
            onMessen={() => setTab("Messen")} onEntdecken={() => setTab("Entdecken")}
          />
        )}
        {tab === "Messen" && (
          <Scannen
            onSpeichern={(r) => {
              setRaeume([...raeume, r]);
              setAktiverRaum(r.id);
              setTab("Start");
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
          raum={raum}
          imKorb={korb.includes(detail.id)}
          onKorb={() => korbUmschalten(detail.id)}
          onZurueck={() => setDetailId(undefined)}
        />
      )}

      <nav className="tabs" aria-label="Hauptmenü">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.mitte ? "mitte" : undefined}
            aria-current={tab === t.id && !detail ? "page" : undefined}
            onClick={() => { setDetailId(undefined); setTab(t.id); }}
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
