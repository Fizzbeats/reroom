# Erzeugt weitere Bildschirme der Variante 18 als SVG zum Hineinziehen in Figma (docs/figma-import/).
# Aufruf: python scripts/figma_svg_mehr.py
import os, random
SER = "'Source Serif 4', Georgia, serif"; SAN = "Inter, Arial, sans-serif"
INK, BG, MUTED, LINIE, KACHEL, WEIN, ORANGE, HELL, SPUR = "#3A0F18", "#FFF8EE", "#7A5058", "#E2D8CE", "#F6E6DA", "#7B1E2E", "#FF5B2E", "#E7C3C0", "#E8DDD3"

def t(x, y, s, size=15, fill=INK, w=400, font=SAN, anchor="start", op=1, deco=""):
    d = f' text-decoration="{deco}"' if deco else ""
    return f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}" opacity="{op}"{d}>{s}</text>'
def r(x, y, w, h, fill="none", rx=2, stroke="none", sw=1, op=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def knopf(x, y, w, label, hell=False, h=56):
    if hell: return f'<g id="Knopf {label}">{r(x, y, w, h, BG, 2, LINIE)}{t(x + w/2, y + h/2 + 5, label, 16, WEIN, 700, SAN, "middle")}</g>'
    return f'<g id="Knopf {label}">{r(x, y, w, h, INK)}{t(x + w/2, y + h/2 + 5, label, 16, BG, 700, SAN, "middle")}</g>'
def tab(aktiv=None):
    s = [f'<g id="Tab-Leiste (Platzhalter, hier die Komponente einsetzen)"><line x1="0" y1="782" x2="390" y2="782" stroke="{LINIE}"/>']
    for i, n in enumerate(["Start", "Entdecken", "Messen", "Korb", "Verkaufen"]):
        s.append(t(39 + 78 * i, 817, n, 11, INK if n == aktiv else MUTED, 700 if n == aktiv else 500, SAN, "middle"))
    return "".join(s) + "</g>"
def svg(name, inner, bg=BG):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><title>{name}</title><rect id="Hintergrund" width="390" height="844" fill="{bg}"/>{inner}</svg>'
def close(x=346, y=56, col=KACHEL, fg=INK):
    return f'<g id="Schliessen"><circle cx="{x}" cy="{y}" r="20" fill="{col}"/>{t(x, y + 7, "×", 22, fg, 700, SAN, "middle")}</g>'

S = {}

# 10 Stil-Finder: Farben
chips = [("grau", "#A3A7AB", "n"), ("weiss", "#ECEAE5", "n"), ("holz", "#C9A06E", "mag"), ("schwarz", "#2E2E2E", "nicht"), ("braun", "#80553A", "n"), ("terrakotta", "#C9694C", "n")]
ch = []; x, y = 24, 232
for name, col, z in chips:
    w = 40 + len(name) * 8 + (16 if z != "n" else 0)
    if x + w > 366: x, y = 24, y + 52
    fillc, fg = (INK, BG) if z == "mag" else (BG, INK)
    ch.append(f'<g id="Farbe {name}">{r(x, y, w, 40, fillc, 2, LINIE if z != "mag" else "none")}<circle cx="{x+20}" cy="{y+20}" r="7" fill="{col}"/>'
              f'{t(x+34, y+25, name + (" ✓" if z == "mag" else " ✕" if z == "nicht" else ""), 14, fg, 700, SAN, deco="line-through" if z == "nicht" else "")}</g>')
    x += w + 8
S["10-stilfinder-farben"] = svg("10 Stil-Finder Farben", f'{t(24, 60, "Schritt 1: Farben", 13, MUTED)}{close()}{t(24, 130, "Welche Farben magst du?", 28, INK, 700, SER)}'
    f'{t(24, 168, "Tippe einmal für „mag ich“, zweimal für „mag ich nicht“,", 13, MUTED)}{t(24, 188, "dreimal zum Zurücksetzen.", 13, MUTED)}' + "".join(ch) + knopf(24, 740, 342, "Weiter zu den Bildern"))

# 11 Stil-Finder: Wischkarte
S["11-stilfinder-wischen"] = svg("11 Stil-Finder Wischen",
    f'{t(24, 60, "Bild 1 von 8", 13, MUTED)}{t(366, 60, "Überspringen", 13, MUTED, 600, SAN, "end")}{r(24, 76, 342, 4, SPUR)}{r(24, 76, 42, 4, INK)}{t(24, 130, "Gefällt dir das?", 33, INK, 700, SER)}'
    f'<g id="Wischkarte" transform="rotate(-2 195 330)">{r(30, 160, 330, 400, "#EFE9DF", 2)}<rect x="46" y="176" width="104" height="30" rx="2" fill="#fff"/>{t(98, 196, "Skandi", 13, INK, 700, SAN, "middle")}'
    f'<rect x="250" y="200" width="82" height="108" fill="#F7F3EC" stroke="#C9A06E" stroke-width="5"/><path d="M260 292l20-30 15 18 12-10 15 22z" fill="#9FB49B"/>'
    f'<rect x="60" y="400" width="190" height="64" rx="16" fill="#B7B5AF"/><rect x="46" y="430" width="40" height="64" rx="14" fill="#CDCBC5"/><rect x="226" y="430" width="40" height="64" rx="14" fill="#CDCBC5"/><rect x="80" y="440" width="150" height="40" rx="10" fill="#ECEAE5"/>'
    f'<rect x="90" y="520" width="140" height="22" fill="#C9A06E"/></g>'
    f'<g id="Ablehnen"><circle cx="150" cy="614" r="33" fill="none" stroke="{INK}" stroke-width="2"/>{t(150, 623, "×", 28, INK, 400, SAN, "middle")}</g>'
    f'<g id="Gefaellt mir"><circle cx="240" cy="614" r="33" fill="{ORANGE}"/>{t(240, 625, "♥", 26, "#fff", 400, SAN, "middle")}</g>'
    f'{t(195, 678, "Nach links wischen: nicht mein Stil · nach rechts: gefällt mir", 12, MUTED, 400, SAN, "middle")}{r(24, 700, 342, 56, KACHEL)}{t(195, 733, "Eigenes Inspirationsbild hinzufügen", 15, INK, 700, SAN, "middle")}')

# 12 Chat
S["12-chat"] = svg("12 Chat",
    f'{t(24, 64, "Assistent", 19, INK, 700, SER)}{t(24, 84, "Noch 4 von 5 Fragen heute", 13, MUTED)}{close(346, 64)}<line x1="0" y1="104" x2="390" y2="104" stroke="{LINIE}"/>'
    f'<g id="Bot-Blase 1">{r(24, 124, 290, 124, KACHEL)}{t(40, 150, "Hallo! Ich bin der ReRoom-Assistent, noch", 13)}{t(40, 170, "ohne KI. Ich verstehe Möbelart, Farbe, Stil,", 13)}{t(40, 190, "Preis, Entfernung und Nische. Ich kenne die", 13)}{t(40, 210, "Maße deines Raums und schlage nur Möbel", 13)}{t(40, 230, "vor, die durch Tür und Treppenhaus passen.", 13)}</g>'
    f'<g id="Nutzer-Blase">{r(86, 268, 280, 62, INK)}{t(102, 294, "Graues Sofa unter 400 €, das in", 13, BG)}{t(102, 314, "meine Nische passt.", 13, BG)}</g>'
    f'<g id="Bot-Blase 2">{r(24, 350, 290, 62, KACHEL)}{t(40, 376, "Wie breit ist deine Nische? Miss von Wand", 13)}{t(40, 396, "zu Wand, zum Beispiel „140 cm“.", 13)}</g>'
    f'<line x1="0" y1="740" x2="390" y2="740" stroke="{LINIE}"/>{r(24, 756, 252, 48, KACHEL)}{t(40, 786, "Frag nach einem Möbel …", 14, MUTED)}{r(286, 756, 80, 48, INK, 2, "none", 1, .4)}{t(326, 786, "Senden", 14, BG, 700, SAN, "middle")}')

# 13 3D-Rundgang
S["13-rundgang-3d"] = svg("13 3D-Rundgang",
    f'{close(44, 76, "#F2F2F2", INK)}<g id="Umschalter"><rect x="196" y="56" width="170" height="40" rx="2" fill="#3A3A3A"/><rect x="200" y="60" width="82" height="32" rx="2" fill="#fff"/>{t(241, 82, "Überblick", 13, INK, 700, SAN, "middle")}{t(324, 82, "Rundgang", 13, "#ddd", 600, SAN, "middle")}</g>'
    f'<g id="Raum 3D"><polygon points="60,330 250,250 340,330 150,420" fill="#C9B79A"/><polygon points="60,330 150,420 150,520 60,430" fill="#2B2B2B" opacity=".6"/><polygon points="150,420 340,330 340,430 150,520" fill="#3A3A3A" opacity=".6"/><polygon points="60,330 250,250 250,200 60,270" fill="#2B2B2B" opacity=".4"/>'
    f'<polygon points="120,350 200,316 238,350 160,384" fill="#A8483A" opacity=".85"/><polygon points="170,330 214,312 236,332 192,350" fill="#7B1E2E"/><polygon points="130,300 200,272 236,296 166,324" fill="#8E8E92"/></g>'
    f'{t(30, 700, "Wohnzimmer", 19, "#fff", 700, SAN)}{t(30, 726, "5 Möbel · 355,00 €", 15, "#fff", 400, SAN)}{t(30, 750, "Mit dem Finger drehen, mit zwei Fingern zoomen.", 12, "#bbb", 400, SAN)}'
    f'<rect x="30" y="768" width="330" height="48" rx="2" fill="#F1F1EF"/>{t(195, 798, "Als Video (Umzugs-Pass)", 15, INK, 700, SAN, "middle")}', bg="#111111")

# 14 Testkasse
S["14-testkasse"] = svg("14 Testkasse",
    f'{t(24, 60, "Warenkorb", 33, INK, 700, SER)}<rect width="390" height="844" fill="#000" opacity=".45"/>'
    f'<g id="Sheet">{r(0, 380, 390, 464, BG, 20)}{t(24, 426, "Testkasse", 19, INK, 700, SER)}{close(346, 418)}<line x1="0" y1="450" x2="390" y2="450" stroke="{LINIE}"/>'
    f'{r(24, 470, 342, 56, "#FFF1CC")}{t(40, 495, "Testmodus: Hier gibst du keine Kartendaten ein", 13)}{t(40, 513, "und es wird nichts abgebucht.", 13)}'
    f'<line x1="24" y1="560" x2="366" y2="560" stroke="{INK}"/>{t(24, 590, "Du zahlst", 19, INK, 700, SER)}{t(366, 590, "615,70 €", 19, INK, 700, SER, "end")}'
    f'{t(24, 624, "Echte Zahlungen laufen später über einen Zahlungsdienstleister.", 12, MUTED)}{t(24, 642, "Gebrauchtes Geld bleibt dort, bis die Übergabe bestätigt ist.", 12, MUTED)}'
    + knopf(24, 680, 342, "Mit Testkarte bezahlen") + "</g>")

# 15 Übergabe QR
random.seed(18); n = 25; z = 7; ox, oy = 100, 340
mod = []
for yy in range(n):
    for xx in range(n):
        ecke = (xx < 7 and yy < 7) or (xx >= n - 7 and yy < 7) or (xx < 7 and yy >= n - 7)
        if ecke:
            ring = xx % (n - 7) if xx >= n - 7 else xx
            ry = yy if yy < 7 else yy - (n - 7)
            rx = xx if xx < 7 else xx - (n - 7)
            on = rx in (0, 6) or ry in (0, 6) or (2 <= rx <= 4 and 2 <= ry <= 4)
        else:
            on = random.random() < .5
        if on: mod.append(f"M{ox + xx * z} {oy + yy * z}h{z}v{z}h-{z}z")
S["15-uebergabe-qr"] = svg("15 Uebergabe QR",
    f'{t(24, 60, "Verkaufen", 33, INK, 700, SER)}<rect width="390" height="844" fill="#000" opacity=".45"/>'
    f'<g id="Sheet">{r(0, 150, 390, 694, BG, 20)}{t(24, 196, "Übergabe", 19, INK, 700, SER)}{close(346, 188)}<line x1="0" y1="220" x2="390" y2="220" stroke="{LINIE}"/>'
    f'{t(195, 258, "Zeig dem Käufer diesen Code, wenn er Sofa Lund", 13, INK, 400, SAN, "middle")}{t(195, 278, "abholt. Erst wenn er ihn scannt, bekommst du dein Geld.", 13, INK, 400, SAN, "middle")}'
    f'<g id="QR-Code (Beispiel)">{r(80, 308, 230, 230, "#fff", 12, LINIE)}<path d="{"".join(mod)}" fill="#111"/></g>'
    f'{t(195, 590, "123 456", 28, INK, 700, MONO if False else SAN, "middle")}{t(195, 626, "Bereit. Der Käufer scannt mit seiner Kamera, öffnet den", 12, MUTED, 400, SAN, "middle")}{t(195, 644, "Link und bestätigt. Lass diese Seite offen.", 12, MUTED, 400, SAN, "middle")}'
    f'{r(24, 676, 342, 64, KACHEL)}{t(195, 703, "Ohne zweites Handy testen:", 15, INK, 700, SAN, "middle")}{t(195, 723, "Käufer scannt jetzt", 15, INK, 700, SAN, "middle")}</g>')

# 16 Inserat-Assistent, Schritt 1 (Fotos)
def tipp(x, name, form):
    return f'<g id="Tipp {name}">{r(x, 520, 104, 80, KACHEL)}{form}{t(x + 52, 624, name, 12, MUTED, 400, SAN, "middle")}</g>'
S["16-inserat-fotos"] = svg("16 Inserat Fotos",
    f'{t(24, 60, "Möbel einstellen", 19, INK, 700, SER)}{close(346, 52)}{t(24, 96, "Schritt 1 von 4: Fotos", 13, MUTED)}{r(24, 108, 342, 4, SPUR)}{r(24, 108, 86, 4, INK)}'
    f'{t(24, 170, "Mach Fotos von deinem Möbel", 21, INK, 700, SER)}{t(24, 196, "Das erste Foto ist das Titelbild. Bis zu 4 Fotos.", 13, MUTED)}'
    + knopf(24, 224, 342, "Foto aufnehmen") + knopf(24, 292, 342, "Aus der Galerie wählen", True) +
    f'{r(24, 368, 342, 100, KACHEL)}{t(195, 424, "Hier erscheinen deine Fotos", 13, MUTED, 400, SAN, "middle")}{t(24, 506, "So gelingen gute Fotos", 15, INK, 700, SAN)}'
    + tipp(24, "Ganz", f'<rect x="56" y="544" width="40" height="30" rx="8" fill="{INK}"/><rect x="66" y="574" width="4" height="10" fill="{INK}"/>')
    + tipp(143, "Gutes Licht", f'<circle cx="195" cy="560" r="14" fill="#E8B923"/>')
    + tipp(262, "Details", f'<rect x="290" y="544" width="46" height="30" fill="none" stroke="{INK}" stroke-width="3"/>')
    + knopf(24, 740, 342, "Weiter"))

out = os.path.join(os.path.dirname(__file__), "..", "docs", "figma-import")
os.makedirs(out, exist_ok=True)
for name, s in S.items():
    open(os.path.join(out, name + ".svg"), "w", encoding="utf-8").write(s)
alle = sorted(f for f in os.listdir(out) if f.endswith(".svg"))
imgs = "".join(f'<figure><img src="{f}" width="300"><figcaption>{f[:-4]}</figcaption></figure>' for f in alle)
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(
    '<!doctype html><meta charset="utf-8"><title>Weitere Bildschirme</title><style>body{margin:0;background:#ddd;padding:20px;font-family:system-ui;display:flex;flex-wrap:wrap;gap:24px}figure{margin:0}figcaption{font-weight:700;margin-top:6px}img{border-radius:6px}</style><body>' + imgs)
print(len(S), "neue SVG, insgesamt", len(alle))
