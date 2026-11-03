// Gemeinsame Inhalte der Entwürfe: Beispielkarten (Werte aus der echten Logik), Tabs, Parallax, Bewegung an/aus.
const KARTEN = [
  { name: "Stuhl Ahorn", zustand: "neu", info: "Wohnwerk Nord · 45 × 50 × 82 cm", preis: "69,00 €", extra: "4 % Cashback: 2,76 €",
    ampel: "gruen", text: "Passt: Tür, Treppenhaus und Raum haben genug Platz." },
  { name: "Sofa Lund", zustand: "gebraucht", info: "Privat, Chemnitz-Kaßberg · 3 km · 200 × 85 × 80 cm", preis: "180,00 €", extra: "Käuferschutz: 7,70 €",
    ampel: "gelb", text: "Knapp: Tür: 10 cm Spielraum. Bitte nachmessen." },
  { name: "Bett Fjord", zustand: "neu", info: "Stilhaus Elbe · 160 × 210 × 95 cm", preis: "449,00 €", extra: "4 % Cashback: 17,96 €",
    ampel: "rot", text: "Passt nicht durch die Tür: kleinste Möbelmaße 95 × 160 cm, Tür nur 90 × 210 cm." },
];
const TABS = [["🏠", "Start"], ["📐", "Scannen"], ["🔍", "Entdecken"], ["🛒", "Warenkorb"], ["🏷️", "Verkaufen"]];

document.querySelector(".karten").innerHTML = KARTEN.map((k) => `
  <article class="karte">
    <div class="reihe"><strong>${k.name}</strong><span class="badge">${k.zustand}</span></div>
    <div class="muted">${k.info}</div>
    <div class="reihe preis"><strong>${k.preis}</strong><span class="muted">${k.extra}</span></div>
    <p class="ampel"><i style="background:var(--ampel-${k.ampel})"></i><span>${k.text}</span></p>
    <button class="primaer">In den Warenkorb</button>
  </article>`).join("");

document.querySelector(".tabs").innerHTML = TABS.map(([i, t]) => `<span class="${t === "Entdecken" ? "aktiv" : ""}"><b>${i}</b>${t}</span>`).join("");

// Deko bewegt sich leicht mit Maus oder Finger mit (Tiefeneffekt)
const phone = document.querySelector(".phone");
addEventListener("pointermove", (e) => {
  const r = phone.getBoundingClientRect();
  const lim = (v) => Math.max(-1, Math.min(1, v));
  phone.style.setProperty("--px", lim(((e.clientX - r.left) / r.width - 0.5) * 2));
  phone.style.setProperty("--py", lim(((e.clientY - r.top) / r.height - 0.5) * 2));
});

const knopf = document.getElementById("bew");
knopf.addEventListener("click", () => {
  const still = document.body.classList.toggle("still");
  knopf.textContent = still ? "Bewegung: aus" : "Bewegung: an";
});
