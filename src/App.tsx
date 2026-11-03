import { useEffect, useState } from "react";
import type { Moebel, Raum } from "./models/types";
import { BEISPIELRAEUME } from "./data/raeume";
import { LokalesMoebelRepository } from "./data/moebelRepository";
import { useLokal } from "./useLokal";
import Start from "./views/Start";
import Scannen from "./views/Scannen";
import Entdecken from "./views/Entdecken";
import Warenkorb from "./views/Warenkorb";
import Verkaufen from "./views/Verkaufen";

const TABS = ["Start", "Messen", "Entdecken", "Warenkorb", "Verkaufen"] as const;
type Tab = (typeof TABS)[number];
const ICONS: Record<Tab, string> = { Start: "🏠", Messen: "📐", Entdecken: "🔍", Warenkorb: "🛒", Verkaufen: "🏷️" };

const repository = new LokalesMoebelRepository();

export default function App() {
  const [tab, setTab] = useState<Tab>("Start");
  const [katalog, setKatalog] = useState<Moebel[]>([]);
  const [raeume, setRaeume] = useLokal<Raum[]>("reroom.raeume", []);
  const [aktiverRaum, setAktiverRaum] = useLokal<string>("reroom.aktiverRaum", "");
  const [korb, setKorb] = useLokal<string[]>("reroom.korb", []);

  useEffect(() => {
    repository.alle().then(setKatalog);
  }, []);

  const raum = [...BEISPIELRAEUME, ...raeume].find((r) => r.id === aktiverRaum);

  return (
    <div className="app">
      <main>
        {tab === "Start" && <Start raeume={raeume} aktiverRaum={aktiverRaum} onWaehlen={setAktiverRaum} onMessen={() => setTab("Messen")} onEntdecken={() => setTab("Entdecken")} />}
        {tab === "Messen" && (
          <Scannen
            onSpeichern={(r) => {
              setRaeume([...raeume, r]);
              setAktiverRaum(r.id);
              setTab("Start");
            }}
          />
        )}
        {tab === "Entdecken" && (
          <Entdecken
            katalog={katalog}
            raum={raum}
            korb={korb}
            onKorb={(id) => setKorb(korb.includes(id) ? korb.filter((k) => k !== id) : [...korb, id])}
          />
        )}
        {tab === "Warenkorb" && <Warenkorb positionen={katalog.filter((m) => korb.includes(m.id))} onLeeren={() => setKorb([])} />}
        {tab === "Verkaufen" && <Verkaufen />}
      </main>
      <nav className="tabs" aria-label="Hauptmenü">
        {TABS.map((t) => (
          <button key={t} aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)}>
            <b aria-hidden="true">{ICONS[t]}</b>
            {t === "Warenkorb" && korb.length > 0 ? `${t} (${korb.length})` : t}
          </button>
        ))}
      </nav>
    </div>
  );
}
