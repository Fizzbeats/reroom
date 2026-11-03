import { useState } from "react";
import { useLokal } from "../useLokal";
import { preisVorschlag } from "../logic/verkaufsPreis";
import { euro } from "../logic/preisRechner";

interface Inserat {
  id: string;
  name: string;
  preis: number;
}

export default function Verkaufen() {
  const [inserate, setInserate] = useLokal<Inserat[]>("reroom.inserate", []);
  const [name, setName] = useState("");
  const [neupreis, setNeupreis] = useState("");
  const vorschlag = preisVorschlag(Number(neupreis));
  const [preis, setPreis] = useState("");

  return (
    <section>
      <h1>Verkaufen</h1>
      <div className="karte">
        <label>
          Was verkaufst du?
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Geschätzter Neupreis (€)
          <input inputMode="numeric" value={neupreis} onChange={(e) => { setNeupreis(e.target.value); setPreis(""); }} />
        </label>
        {vorschlag > 0 && <p className="gedaempft">Preisvorschlag: {euro(vorschlag * 100)}</p>}
        <label>
          Dein Preis (€)
          <input inputMode="numeric" value={preis || (vorschlag > 0 ? String(vorschlag) : "")} onChange={(e) => setPreis(e.target.value)} />
        </label>
        <p className="gedaempft">Die Abholung erfolgt beim Verkäufer.</p>
        <button
          className="primaer"
          disabled={name.trim() === "" || !(Number(preis || vorschlag) > 0)}
          onClick={() => {
            setInserate([...inserate, { id: `ins-${Date.now()}`, name: name.trim(), preis: Number(preis || vorschlag) }]);
            setName(""); setNeupreis(""); setPreis("");
          }}
        >
          Inserat einstellen
        </button>
      </div>
      <h2>Meine Inserate</h2>
      {inserate.length === 0 && <p className="gedaempft">Noch keine Inserate.</p>}
      {inserate.map((i) => (
        <div className="karte reihe" key={i.id}>
          <span>{i.name}</span>
          <strong>{euro(i.preis * 100)}</strong>
        </div>
      ))}
    </section>
  );
}
