import re

def edit(p, pairs):
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert a in s, (p, a[:70])
        s = s.replace(a, b, 1)
    open(p, "w", encoding="utf-8").write(s)

# --- Tokens: Seitenrand zentral ---
edit("src/styles/tokens.css", [
    ("  --abstand-xl: 64px;", "  --abstand-xl: 64px;\n  --seite-rand: 24px;"),
])

# --- Kurztext für die Aktion ---
edit("src/logic/aktion.ts", [
    ("export function aktionText(", '''/** Kurzfassung für schmale Bildschirme: „6 % Cashback bis 31. Januar“ (ohne Jahr). */
export function aktionKurz(jetzt: Date = new Date()): string | undefined {
  if (!aktionAktiv(jetzt)) return undefined;
  const letzterTag = new Date(AKTION_BIS.getTime() - 24 * 60 * 60 * 1000);
  const tag = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long" }).format(letzterTag);
  return `${AKTION_PROZENT}\\u00a0% Cashback bis ${tag}`;
}

export function aktionText('''),
])
open("src/logic/paket.test.ts", "a", encoding="utf-8").write('''
import { aktionKurz } from "./aktion";

describe("Aktion kurz", () => {
  it("nennt Prozent und letzten Tag, nur während der Aktion", () => {
    expect(aktionKurz(new Date(2026, 10, 5))).toBe("6\\u00a0% Cashback bis 31. Januar");
    expect(aktionKurz(new Date(2027, 1, 2))).toBeUndefined();
  });
});
''')

# --- Start: weniger Text, Pastell-Banner ---
edit("src/views/Start.tsx", [
    ("import { aktionText } from \"../logic/aktion\";", "import { aktionKurz } from \"../logic/aktion\";"),
    ("import { START_MESSEN_TEXT, SLOGAN, DEMO_HINWEIS } from \"../logic/texte\";", "import { START_MESSEN_TEXT, DEMO_HINWEIS } from \"../logic/texte\";"),
    ('''      <p className="slogan" style={{ margin: "-6px 0 14px" }}>{SLOGAN}</p>
      {aktionText() && <button className="aktion-banner" style={{ width: "100%", border: 0, textAlign: "left", margin: "0 0 14px" }} onClick={onKonto}>{aktionText()}</button>}''',
     '''      {aktionKurz() && <button className="aktion-banner start-aktion" onClick={onKonto}>Start-Aktion: {aktionKurz()}</button>}'''),
    ('{platzHinweis || "Ziehe ein Möbel mit dem Finger, tippe darauf, um es anzusehen."}', '{platzHinweis || "Möbel ziehen zum Verschieben, tippen zum Ansehen."}'),
])
edit("src/styles/konto.css", [
    (".konto-karte { background: var(--raumkarte); color: #fff; border-radius: 22px; padding: 18px 20px; margin-top: 16px; display: grid; gap: 2px; }\n.konto-karte small { color: #B5B5B5; }",
     ".konto-karte { background: var(--pastell); color: var(--text); border-radius: 22px; padding: 22px 24px; margin-top: var(--abstand-m); display: grid; gap: 2px; }\n.konto-karte small { color: var(--text-gedaempft); }"),
    (".konto-karte span { color: #D8D8D8; font-size: .9rem; }", ".konto-karte span { color: var(--text-gedaempft); font-size: .9rem; }"),
    (".aktion-banner { margin: 10px 0 0; background: var(--akzent); color: var(--auf-akzent); border-radius: 12px; padding: 9px 14px; font: 700 .84rem var(--schrift); }",
     ".aktion-banner { margin: var(--abstand-s) 0 0; background: var(--pastell-stark); color: var(--auf-pastell); border-radius: 12px; padding: 10px 16px; font: 700 .86rem var(--schrift); }\n.start-aktion { display: block; width: 100%; border: 0; text-align: left; margin: 0 0 var(--abstand-s); cursor: pointer; }"),
])

# --- Raumkarte pastell, Grundriss mit dunklen Linien ---
edit("src/styles/app.css", [
    (".app { max-width: 560px; margin: 0 auto; padding: 14px 20px 120px; }", ".app { max-width: 560px; margin: 0 auto; padding: var(--abstand-s) var(--seite-rand) 140px; }"),
    ("h2 { font-size: 1.25rem; font-weight: 700; letter-spacing: -.02em; margin: 26px 12px; display: flex;", "h2 { font-size: 1.25rem; font-weight: 700; letter-spacing: -.02em; margin: 26px 12px; display: flex;"),
])
s = open("src/styles/app.css", encoding="utf-8").read()
def r(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)
r("margin: 26px 0 12px; display: flex;", "margin: var(--abstand-l) 0 var(--abstand-s); display: flex;")
r(".kopf { display: flex; justify-content: space-between; align-items: center; padding: 6px 0 14px; }", ".kopf { display: flex; justify-content: space-between; align-items: center; padding: var(--abstand-s) 0 var(--abstand-m); }")
r("margin: 0 -20px; padding: 0 20px 2px; }", "margin: 0 calc(-1 * var(--seite-rand)); padding: 0 var(--seite-rand) 2px; }")
r(".flaeche { background: var(--karte); border-radius: var(--radius); padding: 18px; margin: 14px 0; }", ".flaeche { background: var(--karte); border-radius: var(--radius); padding: 22px; margin: var(--abstand-m) 0; }")
r(".flaeche > * + * { margin-top: 10px; }", ".flaeche > * + * { margin-top: 14px; }")
r(".raumkarte { background: var(--raumkarte); color: #fff; border-radius: 24px; padding: 18px; }", ".raumkarte { background: var(--pastell); color: var(--text); border-radius: 24px; padding: 22px; }")
r(".raumkarte small { color: #B5B5B5; font-size: .78rem; }", ".raumkarte small { color: var(--text-gedaempft); font-size: .8rem; }")
r(".raumkarte .chip { background: rgb(255 255 255 / .12); color: #fff; }", ".raumkarte .chip { background: var(--pastell-stark); color: var(--auf-pastell); }")
r(".grundriss > text { fill: #B5B5B5; font: 11px var(--schrift); }", ".grundriss > text { fill: var(--text-gedaempft); font: 11px var(--schrift); }")
r(".passt-zahl { font: 700 .76rem var(--schrift); color: #5FD39A; white-space: nowrap; }", ".passt-zahl { font: 700 .78rem var(--schrift); color: var(--auf-pastell); white-space: nowrap; }")
r(".plan-leiste { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: rgb(255 255 255 / .08); border-radius: 14px; padding: 10px 12px; font-size: .86rem; }",
  ".plan-leiste { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: var(--hintergrund); border-radius: 16px; padding: 14px 16px; margin-top: var(--abstand-s); font-size: .86rem; }")
r(".chip.hell { background: #fff; color: #111; }", ".chip.hell { background: var(--pastell-stark); color: var(--auf-pastell); }")
r(".plan-tipp { margin: 8px 2px 0; font-size: .76rem; color: #A8A8A8; }", ".plan-tipp { margin: var(--abstand-s) 2px 0; font-size: .8rem; color: var(--text-gedaempft); }")
r(".werte div { background: rgb(255 255 255 / .08); border-radius: 12px; padding: 8px 10px; font-size: .74rem; color: #B5B5B5; }", ".werte div { background: var(--hintergrund); border-radius: 12px; padding: 8px 10px; font-size: .74rem; color: var(--text-gedaempft); }")
r(".werte b { display: block; color: #fff;", ".werte b { display: block; color: var(--text);")
r(".raumwahl { display: flex; gap: 8px; overflow-x: auto; margin-top: 12px; scrollbar-width: none; }", ".raumwahl { display: flex; gap: 8px; overflow-x: auto; margin-top: var(--abstand-s); scrollbar-width: none; }")
r(".raumwahl .chip { background: rgb(255 255 255 / .08); color: #ddd; }", ".raumwahl .chip { background: var(--pastell-stark); color: var(--auf-pastell); }")
r('.raumwahl .chip[aria-pressed="true"] { background: #fff; color: #111; }', '.raumwahl .chip[aria-pressed="true"] { background: var(--primaer); color: var(--auf-primaer); }')
r(".raster { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 12px; }", ".raster { display: grid; grid-template-columns: 1fr 1fr; gap: var(--abstand-m) var(--abstand-s); }")
open("src/styles/app.css", "w", encoding="utf-8").write(s)

# Grundriss: dunkle Linien auf hellem Boden
edit("src/views/ui.tsx", [
    ('<rect x={x0} y={y0} width={w} height={h} fill="rgb(255 255 255 / .04)" stroke="#fff" strokeWidth="3.5" />', '<rect x={x0} y={y0} width={w} height={h} fill="var(--hintergrund)" stroke="var(--text)" strokeWidth="3.5" />'),
    ('<rect x={tx} y={ty - 2} width={tuer} height="5" fill="var(--raumkarte)" />', '<rect x={tx} y={ty - 2} width={tuer} height="5" fill="var(--pastell)" />'),
])
print("fertig")
