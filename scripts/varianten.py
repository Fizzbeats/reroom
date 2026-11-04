# Erzeugt 20 Design-Varianten als SVG (je Einstieg, Startseite, Möbel-Detail) und eine Übersicht.
# Aufruf: python scripts/varianten.py   (schreibt nach docs/varianten/)
# Jede SVG lässt sich in Figma hineinziehen: Flächen, Linien und Texte bleiben einzeln bearbeitbar.
import os
from html import escape

SANS = "Inter, Arial, Helvetica, sans-serif"
SERIF = "Georgia, 'Times New Roman', serif"
MONO = "'Roboto Mono', Consolas, 'Courier New', monospace"
HEAVY = "'Arial Black', Impact, Arial, sans-serif"
ROUND = "Nunito, 'Trebuchet MS', Arial, sans-serif"

W, H, GAP = 360, 740, 40

def fit(text, size, font, maxw):
    if font == MONO:
        return min(size, round(maxw / (len(text) * 0.62), 1))
    return size

def T(x, y, s, size=15, fill="#000", weight=400, font=SANS, anchor="start", ls=0, op=1):
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}" opacity="{op}">{escape(s)}</text>')

def R(x, y, w, h, fill="none", rx=0, stroke="none", sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'

def Ln(x1, y1, x2, y2, stroke, sw=1):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"/>'

def sofa(x, y, s, c1, c2):
    return (f'<g transform="translate({x} {y}) scale({s})"><rect x="14" y="0" width="112" height="46" rx="16" fill="{c1}"/>'
            f'<rect x="0" y="22" width="30" height="46" rx="12" fill="{c2}"/><rect x="110" y="22" width="30" height="46" rx="12" fill="{c2}"/>'
            f'<rect x="24" y="26" width="92" height="30" rx="10" fill="{c2}" opacity=".8"/><rect x="14" y="66" width="7" height="12" fill="{c1}"/><rect x="119" y="66" width="7" height="12" fill="{c1}"/></g>')

def chair(x, y, c1, c2):
    return (f'<g transform="translate({x} {y})"><rect x="12" y="0" width="32" height="22" rx="6" fill="{c1}"/><rect x="6" y="18" width="44" height="12" rx="4" fill="{c2}"/>'
            f'<rect x="12" y="30" width="4" height="12" fill="{c1}"/><rect x="40" y="30" width="4" height="12" fill="{c1}"/></g>')

def plan(x, y, w, t, hero_label=True):
    """Grundriss 4 x 5 m: Wand, Sofa, Teppich mit Tisch, Tür mit Schwenk."""
    h = w * 1.18
    ox = x + (w - w * .62) / 2
    rw, rh = w * .62, h * .92
    g = [R(ox, y, rw, rh, t["floor"], 0, t["wall"], 2.6)]
    g.append(R(ox + rw * .12, y + 6, rw * .76, rh * .15, t["f1"], 3))
    g.append(R(ox + rw * .16, y + rh * .38, rw * .68, rh * .36, t["f2"], 3))
    g.append(R(ox + rw * .34, y + rh * .5, rw * .32, rh * .12, t["f3"], 2))
    g.append(R(ox + rw * .6, y + rh - 12, rw * .26, 7, t["f1"], 2))
    g.append(f'<path d="M{ox} {y+rh} v-{rw*.32} a{rw*.32} {rw*.32} 0 0 1 {rw*.32} {rw*.32}" fill="none" stroke="{t["door"]}" stroke-width="1.4" stroke-dasharray="3 3"/>')
    g.append(T(ox + rw / 2, y + rh + 18, "4,00 m", 10, t["muted"], 400, t["body"], "middle"))
    g.append(T(ox + rw + 8, y + rh / 2, "5,00 m", 10, t["muted"], 400, t["body"]))
    return "".join(g), h

def logo(x, y, col):
    return R(x, y, 132, 40, "none", 6, col, 1, "4 3") + T(x + 66, y + 25, "LOGO", 11, col, 600, SANS, "middle", 1.5)

def tabbar(t):
    y = H - 62
    s = [Ln(0, y, W, y, t["line"]), R(0, y + 1, W, 61, t["bg"])]
    for i, n in enumerate(["Start", "Entdecken", "Messen", "Korb", "Verkaufen"]):
        s.append(T(36 + i * 72, y + 36, n, 11, t["ink"] if i == 0 else t["muted"], 700 if i == 0 else 500, t["body"], "middle"))
    return "".join(s)

def btn(x, y, w, h, label, t, style=None, arrow=False):
    st = style or t["btn"]
    fill, col = t["acc"], t["on_acc"]
    out = []
    if st == "hard":
        out.append(R(x + 4, y + 4, w, h, t["ink"], t["r_btn"]))
        out.append(R(x, y, w, h, fill, t["r_btn"], t["ink"], 1.5))
    elif st == "outline":
        out.append(R(x, y, w, h, "none", t["r_btn"], fill, 2))
        col = fill
    else:
        out.append(R(x, y, w, h, fill, t["r_btn"]))
    if arrow:
        out.append(T(x + 22, y + h / 2 + 5, label, 16, col, 700, t["body"]))
        out.append(T(x + w - 22, y + h / 2 + 5, "→", 18, col, 700, t["body"], "end"))
    else:
        out.append(T(x + w / 2, y + h / 2 + 5, label, 16, col, 700, t["body"], "middle"))
    return "".join(out)

ROWS = [("Passt-Check", "Tür, Treppe, Raum"), ("Stil finden", "Bilder wischen"), ("6 % Cashback", "auf neue Möbel")]

def rows(x, y, w, t, col=None, sub=None, line=None):
    col = col or t["ink"]; sub = sub or t["muted"]; line = line or t["line"]
    s = [Ln(x, y, x + w, y, line)]
    for i, (a, b) in enumerate(ROWS):
        yy = y + 30 + i * 42
        s.append(T(x, yy, a, 15, col, 700, t["body"]))
        s.append(T(x + w, yy, b, 13, sub, 400, t["body"], "end"))
        s.append(Ln(x, yy + 14, x + w, yy + 14, line))
    return "".join(s)

def head(lines, x, y, size, t, fill=None, lh=1.0):
    return "".join(T(x, y + i * size * lh, l, size, fill or t["ink"], t["h_weight"], t["head"], "start", t["h_ls"]) for i, l in enumerate(lines))

# ---------- Einstieg in fünf Aufbauten ----------
def einstieg(t):
    L = t["layout"]; s = []
    if L == 1:  # Plakat: große Farbfläche oben
        s += [R(0, 0, W, 300, t["hero"]), logo(24, 24, t["on_hero"]), head(["Möbel, die", "wirklich", "passen."], 24, 150, 50, t, t["on_hero"], 1.04)]
        s += [T(24, 340, "Ausmessen, Stil wählen, günstiger einrichten.", fit("Ausmessen, Stil wählen, günstiger einrichten.", 14, t["body"], 312), t["muted"], 400, t["body"]), btn(24, 366, 312, 56, "Raum ausmessen", t), rows(24, 452, 312, t)]
    elif L == 2:  # Grundriss als Hauptbild
        p, h = plan(30, 84, 300, t)
        s += [logo(24, 24, t["ink"]), p, head(["Möbel, die", "wirklich passen."], 24, 84 + h + 50, 33, t), T(24, 84 + h + 118, "Ausmessen, Stil wählen, günstiger einrichten.", fit("Ausmessen, Stil wählen, günstiger einrichten.", 13.5, t["body"], 312), t["muted"], 400, t["body"])]
        s += [btn(24, 84 + h + 138, 312, 54, "Raum ausmessen", t), rows(24, 84 + h + 214, 312, t)]
    elif L == 3:  # Schild unten
        s += [logo(24, 24, t["ink"]), head(["Möbel, die", "wirklich", "passen."], 24, 134, 46, t), R(0, 300, W, 440, t["hero"], 28)]
        s += [R(0, 330, W, 410, t["hero"]), T(24, 346, "Ausmessen, Stil wählen, günstiger einrichten.", fit("Ausmessen, Stil wählen, günstiger einrichten.", 14, t["body"], 312), t["on_hero"], 400, t["body"], op=.92)]
        s += [R(24, 366, 312, 56, t["bg"], t["r_btn"]), T(180, 400, "Raum ausmessen", 16, t.get("l3label", t["hero"]), 700, t["body"], "middle"), rows(24, 450, 312, t, t["on_hero"], t["on_hero"], t["on_hero"] + "55" if t["on_hero"].startswith("#") and len(t["on_hero"]) == 7 else t["line"])]
    elif L == 4:  # Raster mit harten Linien
        s += [logo(24, 24, t["ink"]), T(24, 112, "REROOM · RAUM MESSEN", 10.5, t["ink"], 700, MONO, ls=1.5), head(["Möbel, die", "wirklich", "passen."], 24, 156, 46, t, lh=.98)]
        s += [T(24, 306, "Ausmessen, Stil wählen, günstiger einrichten.", fit("Ausmessen, Stil wählen, günstiger einrichten.", 13.5, t["body"], 312), t["muted"], 400, t["body"]), btn(24, 328, 304, 56, "Raum ausmessen", t, "hard", True)]
        gx, gy, gw, gh = 24, 420, 312, 130
        s += [R(gx, gy, gw, gh, "none", 0, t["ink"], 1.5), Ln(gx + gw / 2, gy, gx + gw / 2, gy + gh, t["ink"], 1.5), Ln(gx, gy + gh / 2, gx + gw, gy + gh / 2, t["ink"], 1.5)]
        for i, (a, b) in enumerate([("Passt-Check", "Tür, Treppe, Raum"), ("Stil finden", "Bilder wischen"), ("6 %", "Cashback"), ("3D", "Rundgang")]):
            cx, cy = gx + (i % 2) * gw / 2 + 14, gy + (i // 2) * gh / 2 + 30
            s += [T(cx, cy, a, 15, t["ink"], 700, t["body"]), T(cx, cy + 20, b, 12, t["muted"], 400, t["body"])]
    else:  # Maßband oben
        s += [logo(24, 24, t["ink"]), R(0, 96, W, 44, t["hero"])]
        for i in range(0, 31):
            x = i * 12
            hh = 16 if i % 5 == 0 else 8
            s.append(Ln(x, 96, x, 96 + hh, t["on_hero"], 1.5))
            if i % 5 == 0 and i < 30:
                s.append(T(x + 3, 130, str(i * 10), 10, t["on_hero"], 600, MONO))
        s += [head(["Möbel, die", "wirklich passen."], 24, 210, 35, t), T(24, 296, "Ausmessen, Stil wählen, günstiger einrichten.", fit("Ausmessen, Stil wählen, günstiger einrichten.", 13.5, t["body"], 312), t["muted"], 400, t["body"]), btn(24, 322, 312, 56, "Raum ausmessen", t), rows(24, 412, 312, t)]
    return "".join(s)

# ---------- Startseite ----------
def start(t):
    s = [T(24, 52, "ReRoom", 24, t["ink"], 800, t["head"], ls=-.5), T(336, 50, "Konto", 13, t["ink"], 500, t["body"], "end")]
    s += [R(24, 74, 312, 38, t["band"], t["r_card"] * .5), T(40, 98, "Start-Aktion: 6 % Cashback bis 31. Januar", fit("Start-Aktion: 6 % Cashback bis 31. Januar", 13, t["body"], 280), t["on_band"], 700, t["body"])]
    surf = t["surf"]
    s.append(R(24, 130, 312, 364, surf, t["r_card"], t["line"] if t["card_line"] else "none", 1.2))
    s += [T(42, 158, "Wohnzimmer", 12, t["on_surf"], 400, t["body"], op=.75), T(42, 180, "4,00 × 5,00 m", 19, t["on_surf"], 700, t["head"], ls=t["h_ls"] / 2), T(318, 180, "5 passen", 13, t["on_surf"], 700, t["body"], "end")]
    p, h = plan(95, 192, 170, {**t, "muted": t["on_surf"]})
    s += [p, Ln(42, 426, 318, 426, t["on_surf"], 1), T(42, 452, "Zusammen", 13, t["on_surf"], 400, t["body"]), T(318, 454, "355,00 €", 21, t["on_surf"], 800, t["head"], "end")]
    s += [T(42, 478, "3D", 13, t["on_surf"], 700, t["body"]), T(82, 478, "Teilen", 13, t["on_surf"], 700, t["body"]), T(142, 478, "Alle in den Korb", 13, t["on_surf"], 700, t["body"])]
    for i, (nm, pr, sub) in enumerate([("20,00 €", "", "Stuhl Schule"), ("90,00 €", "", "Sideboard Wiese")]):
        x = 24 + i * 162
        s.append(R(x, 512, 150, 100, t["tile"], t["r_card"] * .5))
        s.append(T(x + 10, 530, "Passt", 11, t["ok"], 800, t["body"]))
        if i == 0:
            s.append(chair(x + 47, 546, t.get("s1", t["f1"]), t.get("s2", t["f2"])))
        else:
            s.append(R(x + 52, 538, 46, 54, t.get("s2", t["f2"]))); s.append(Ln(x + 75, 538, x + 75, 592, t.get("s1", t["f1"]), 2))
        s += [T(x, 634, nm, 17, t["ink"], 800, t["head"]), T(x, 652, sub, 12, t["muted"], 400, t["body"])]
    s.append(tabbar(t))
    return "".join(s)

# ---------- Möbel-Detail ----------
def detail(t):
    s = [R(0, 0, W, 230, t["tile"]), R(24, 24, 40, 40, t["bg"], 20), T(44, 50, "‹", 22, t["ink"], 700, t["body"], "middle")]
    s.append(sofa(110, 96, 1.0, t.get("s1", t["f1"]), t.get("s2", t["f2"])))
    s.append(f'<ellipse cx="180" cy="190" rx="90" ry="8" fill="{t["ink"]}" opacity=".08"/>')
    s += [T(24, 268, "Gebraucht · grau · 1 km", 12, t["muted"], 400, t["body"]), T(24, 304, "Sofa Lund", 30, t["ink"], t["h_weight"], t["head"], ls=t["h_ls"])]
    s += [T(24, 350, "Passt-Check", 16, t["ink"], 800, t["head"]), T(336, 350, "Knapp", 13, t["warn"], 800, t["body"], "end")]
    for i, (n, v, c, wv) in enumerate([("Tür", "10 cm", t["warn"], .2), ("Treppenhaus", "35 cm", t["ok"], .6), ("Raum", "170 cm", t["ok"], .95)]):
        y = 386 + i * 38
        s += [T(24, y + 4, n, 14, t["ink"], 400, t["body"]), R(124, y - 5, 150, 8, t["track"], t["r_card"] * .3), R(124, y - 5, 150 * wv, 8, c, t["r_card"] * .3), T(336, y + 4, v, 14, t["ink"], 700, t["body"], "end")]
    s += [T(24, 520, "Passt durch die Tür, aber knapp. Bitte nachmessen.", fit("Passt durch die Tür, aber knapp. Bitte nachmessen.", 13, t["body"], 312), t["muted"], 400, t["body"])]
    s += [Ln(0, H - 92, W, H - 92, t["line"]), R(0, H - 91, W, 91, t["bg"]), T(24, H - 50, "180,00 €", 24, t["ink"], 800, t["head"]), T(24, H - 30, "+ 7,70 € Käuferschutz", 11, t["muted"], 400, t["body"])]
    s += [btn(176, H - 76, 160, 48, "In den Warenkorb", {**t, "acc": t.get("dacc", t["acc"]), "on_acc": t.get("on_dacc", t["on_acc"])}, None)]
    return "".join(s)

def frame(inner, ox, t, label):
    cid = f"c{ox}"
    return (f'<g id="{escape(label)}" transform="translate({ox} 0)"><clipPath id="{cid}"><rect width="{W}" height="{H}" rx="34"/></clipPath>'
            f'<g clip-path="url(#{cid})">{R(0, 0, W, H, t["bg"])}{inner}</g>{R(0, 0, W, H, "none", 34, "#00000022", 1)}</g>')

def build(t):
    body = frame(einstieg(t), 0, t, "Einstieg") + frame(start(t), W + GAP, t, "Startseite") + frame(detail(t), 2 * (W + GAP), t, "Moebel-Detail")
    total = 3 * W + 2 * GAP
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{total}" height="{H}" viewBox="0 0 {total} {H}">'
            f'<title>{escape(t["name"])}</title>{body}</svg>')

def base(**k):
    d = dict(body=SANS, head=SANS, h_weight=800, h_ls=-1.2, r_btn=10, r_card=12, btn="fill", card_line=False, layout=1, floor="#fff",
             ok="#2E7D4F", warn="#8A5F00", track="#00000018", line="#00000022", door="#FF5B2E", hero="#000", on_hero="#fff",
             band="#000", on_band="#fff", tile="#F1F1EF", f1="#B58A58", f2="#C9A06E", f3="#8A6A44", wall="#111")
    d.update(k); return d

V = [
 base(name="01 Signal-Orange", layout=1, bg="#fff", ink="#111", muted="#5E5E5E", acc="#111", on_acc="#fff", hero="#FF5B2E", on_hero="#111", surf="#FF5B2E", on_surf="#111", band="#FF5B2E", on_band="#111", floor="#fff", wall="#111", f1="#111", f2="#FFD3C4", f3="#fff", head=HEAVY, h_weight=400, h_ls=-1.5),
 base(name="02 Waldgrün dunkel", layout=2, bg="#14382A", ink="#F1F7F2", muted="#B9D3C4", acc="#CDEBDA", on_acc="#0B3A24", surf="#1E4A39", on_surf="#F1F7F2", band="#CDEBDA", on_band="#0B3A24", floor="#14382A", wall="#F1F7F2", f1="#CDEBDA", f2="#2B5C48", f3="#9FD3B7", tile="#1E4A39", ok="#CDEBDA", warn="#F2C94C", line="#F1F7F244", track="#F1F7F233", door="#CDEBDA"),
 base(name="03 Terrakotta Schild", layout=3, bg="#FAF5EF", ink="#2A1A14", muted="#6E5A50", acc="#2A1A14", on_acc="#FAF5EF", hero="#B04A2E", on_hero="#FFF8F2", surf="#B04A2E", on_surf="#FFF8F2", band="#2A1A14", on_band="#FAF5EF", floor="#FAF5EF", wall="#2A1A14", f1="#2A1A14", f2="#EFC3B2", f3="#B04A2E", tile="#EFE3D6", ok="#6B7A2E", warn="#8E3A24", r_btn=10),
 base(name="04 Beton und Limette", layout=4, bg="#E7E7E3", ink="#151515", muted="#555", acc="#D4F53C", on_acc="#151515", btn="hard", r_btn=0, r_card=0, card_line=True, surf="#F4F4F1", on_surf="#151515", band="#151515", on_band="#D4F53C", floor="#fff", wall="#151515", f1="#D4F53C", f2="#E7E7E3", f3="#B8B8B2", tile="#F4F4F1", ok="#151515", warn="#151515", line="#151515", body=MONO, h_ls=-1.5, door="#151515"),
 base(name="05 Bauplan", layout=2, s1="#B9B8B2", s2="#8E8D87", bg="#fff", ink="#111", muted="#5E5E5E", acc="#111", on_acc="#fff", r_btn=4, r_card=4, card_line=True, surf="#fff", on_surf="#111", band="#E3F3EA", on_band="#0B5A38", floor="#fff", wall="#111", f1="#F1F1EF", f2="#F1F1EF", f3="#fff", ok="#0B5A38", line="#D9D8D3"),
 base(name="06 Senf und Tinte", layout=1, bg="#FFFBEF", ink="#1B1B1B", muted="#615C4B", acc="#1B1B1B", on_acc="#FFFBEF", hero="#E8B923", on_hero="#1B1B1B", surf="#E8B923", on_surf="#1B1B1B", band="#1B1B1B", on_band="#E8B923", floor="#FFFBEF", wall="#1B1B1B", f1="#1B1B1B", f2="#F6DE8A", f3="#fff", tile="#F4ECD0", r_btn=2, r_card=2, head=SERIF, h_weight=700, h_ls=-.5),
 base(name="07 Pflaume und Rosé", dacc="#5A1F4A", on_dacc="#FBF1F1", layout=3, bg="#FBF1F1", ink="#3B1730", muted="#7A5A70", acc="#FBF1F1", on_acc="#5A1F4A", hero="#5A1F4A", on_hero="#FBF1F1", surf="#F3D9DE", on_surf="#3B1730", band="#5A1F4A", on_band="#FBF1F1", floor="#FBF1F1", wall="#3B1730", f1="#5A1F4A", f2="#E8B4C0", f3="#3B1730", tile="#F3DCE0", ok="#5A7A3A", warn="#8A4B00", r_btn=26, r_card=22, body=ROUND, head=ROUND),
 base(name="08 Salbei hell (CI-Pastell)", layout=2, bg="#EEF6F0", ink="#0F2B1D", muted="#4A6558", acc="#0B5A38", on_acc="#fff", surf="#CDEBDA", on_surf="#0F2B1D", band="#CDEBDA", on_band="#0B5A38", floor="#EEF6F0", wall="#0F2B1D", f1="#0B5A38", f2="#B5DCC6", f3="#0F2B1D", tile="#DCEEE3", ok="#0B5A38", r_btn=14, r_card=20),
 base(name="09 Schwarz und Mint", layout=4, bg="#0F0F0F", ink="#F2F2F2", muted="#A6A6A6", acc="#7CE3B0", on_acc="#0F0F0F", btn="hard", r_btn=6, r_card=6, card_line=True, surf="#1A1A1A", on_surf="#F2F2F2", band="#7CE3B0", on_band="#0F0F0F", floor="#0F0F0F", wall="#F2F2F2", f1="#7CE3B0", f2="#2A2A2A", f3="#444", tile="#1A1A1A", ok="#7CE3B0", warn="#F2C94C", line="#F2F2F244", track="#F2F2F233", door="#7CE3B0", body=MONO, h_ls=-1.2),
 base(name="10 Kupfer auf Anthrazit", dacc="#C27B4E", on_dacc="#1E2022", layout=3, bg="#1E2022", ink="#F0EBE4", muted="#A7A29A", acc="#1E2022", on_acc="#F0EBE4", hero="#C27B4E", on_hero="#1E2022", surf="#2A2D30", on_surf="#F0EBE4", band="#C27B4E", on_band="#1E2022", floor="#1E2022", wall="#F0EBE4", f1="#C27B4E", f2="#3A3E42", f3="#F0EBE4", tile="#2A2D30", ok="#9ED08A", warn="#E8B84C", line="#F0EBE444", track="#F0EBE433", door="#C27B4E", r_btn=6),
 base(name="11 Papier und Rot", layout=5, bg="#F4F1EA", ink="#1C1C1C", muted="#5C5A52", acc="#C8281E", on_acc="#fff", hero="#C8281E", on_hero="#fff", surf="#EAE5D8", on_surf="#1C1C1C", band="#1C1C1C", on_band="#F4F1EA", floor="#F4F1EA", wall="#1C1C1C", f1="#C8281E", f2="#E0D8C4", f3="#1C1C1C", tile="#EAE5D8", ok="#2F6B3A", warn="#8A5F00", r_btn=0, r_card=0, head=SERIF, h_weight=700, h_ls=-.5),
 base(name="12 Olive und Sand", layout=1, bg="#F2EEE3", ink="#272A17", muted="#5F6245", acc="#272A17", on_acc="#F2EEE3", hero="#6B7330", on_hero="#F5F2E4", surf="#6B7330", on_surf="#F5F2E4", band="#272A17", on_band="#F2EEE3", floor="#F2EEE3", wall="#272A17", f1="#272A17", f2="#D3CCA6", f3="#6B7330", tile="#E7E1CA", ok="#4F5A1E", r_btn=8),
 base(name="13 Koralle und Braun", layout=2, bg="#FFF6F1", ink="#3A2018", muted="#7A5D52", acc="#F26B4F", on_acc="#3A2018", surf="#FFE1D6", on_surf="#3A2018", band="#3A2018", on_band="#FFF6F1", floor="#FFF6F1", wall="#3A2018", f1="#F26B4F", f2="#FFC3B0", f3="#3A2018", tile="#FFE9E0", ok="#4C7A3C", warn="#8F4A00", r_btn=30, r_card=24, body=ROUND, head=ROUND),
 base(name="14 Pfirsich", l3label="#B5532B", dacc="#B5532B", on_dacc="#fff", layout=3, bg="#FFFFFF", ink="#46291C", muted="#86695A", acc="#fff", on_acc="#B5532B", hero="#FFC9A8", on_hero="#46291C", surf="#FFE3D0", on_surf="#46291C", band="#FFC9A8", on_band="#46291C", floor="#fff", wall="#46291C", f1="#E88A5D", f2="#FFD9C0", f3="#46291C", tile="#FFEFE4", ok="#4C7A3C", warn="#8F4A00", r_btn=14, r_card=22),
 base(name="15 Graphit und Orange", layout=5, bg="#2B2B2D", ink="#F5F5F5", muted="#B0B0B4", acc="#FF7A2E", on_acc="#1A1A1A", hero="#FF7A2E", on_hero="#1A1A1A", surf="#38383B", on_surf="#F5F5F5", band="#FF7A2E", on_band="#1A1A1A", floor="#2B2B2D", wall="#F5F5F5", f1="#FF7A2E", f2="#4A4A4E", f3="#F5F5F5", tile="#38383B", ok="#8EE0A0", warn="#FFC857", line="#F5F5F544", track="#F5F5F533", door="#FF7A2E", r_btn=6, r_card=8),
 base(name="16 Mint-Fläche (CI)", layout=1, bg="#fff", ink="#0F2B1D", muted="#4A6558", acc="#0F2B1D", on_acc="#fff", hero="#CDEBDA", on_hero="#0F2B1D", surf="#E3F3EA", on_surf="#0F2B1D", band="#CDEBDA", on_band="#0B5A38", floor="#fff", wall="#0F2B1D", f1="#0B5A38", f2="#B5DCC6", f3="#fff", tile="#EEF7F1", ok="#0B5A38", r_btn=12, r_card=16),
 base(name="17 Zitrone und Schwarz", layout=4, bg="#FFF35C", ink="#111", muted="#4B4A2E", acc="#111", on_acc="#FFF35C", btn="hard", r_btn=0, r_card=0, card_line=True, surf="#fff", on_surf="#111", band="#111", on_band="#FFF35C", floor="#fff", wall="#111", f1="#111", f2="#FFF35C", f3="#fff", tile="#fff", ok="#111", warn="#111", line="#111", body=MONO, head=HEAVY, h_weight=400, h_ls=-1.5, door="#111"),
 base(name="18 Weinrot und Creme", layout=1, bg="#FFF8EE", ink="#3A0F18", muted="#7A5058", acc="#3A0F18", on_acc="#FFF8EE", hero="#7B1E2E", on_hero="#FFF1E4", surf="#7B1E2E", on_surf="#FFF1E4", band="#3A0F18", on_band="#FFF8EE", floor="#FFF8EE", wall="#3A0F18", f1="#3A0F18", f2="#E7C3C0", f3="#7B1E2E", tile="#F6E6DA", ok="#4C6B2E", r_btn=2, r_card=2, head=SERIF, h_weight=700, h_ls=-.6),
 base(name="19 Moos", layout=5, bg="#fff", ink="#16301F", muted="#587061", acc="#2E6B3F", on_acc="#fff", hero="#2E6B3F", on_hero="#fff", surf="#E4EFE6", on_surf="#16301F", band="#16301F", on_band="#E4EFE6", floor="#fff", wall="#16301F", f1="#2E6B3F", f2="#BCD8C3", f3="#16301F", tile="#EEF4EF", ok="#2E6B3F", r_btn=8, r_card=10),
 base(name="20 Lavendel und Anthrazit", layout=2, bg="#F3F0F8", ink="#25213A", muted="#6A6580", acc="#25213A", on_acc="#F3F0F8", surf="#DCD4EE", on_surf="#25213A", band="#25213A", on_band="#F3F0F8", floor="#F3F0F8", wall="#25213A", f1="#6C5CA8", f2="#C7BCE3", f3="#25213A", tile="#E7E1F3", ok="#3E7A4A", warn="#8A5000", r_btn=14, r_card=18, body=ROUND, head=ROUND),
]

def main():
    out = os.path.join(os.path.dirname(__file__), "..", "docs", "varianten")
    os.makedirs(out, exist_ok=True)
    karten = []
    for t in V:
        slug = t["name"].lower().replace(" ", "-").replace("ü", "ue").replace("é", "e").replace("ä", "ae").replace("ö", "oe").replace("ß", "ss").replace("(", "").replace(")", "")
        fn = f"{slug}.svg"
        open(os.path.join(out, fn), "w", encoding="utf-8").write(build(t))
        karten.append((t["name"], fn))
    cards = "".join(f'<figure><img src="{fn}" alt="{escape(n)}"><figcaption>{escape(n)}</figcaption></figure>' for n, fn in karten)
    html = ('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ReRoom 20 Varianten</title>'
            '<style>body{margin:0;background:#DDD;font-family:system-ui,sans-serif;padding:24px}h1{margin:0 0 6px}p{margin:0 0 20px;max-width:80ch}'
            'figure{margin:0 0 26px}img{width:100%;max-width:1160px;display:block;border-radius:6px}figcaption{font-weight:700;margin:6px 0 0}</style>'
            '<h1>20 Varianten</h1><p>Je Variante: Einstieg, Startseite, Möbel-Detail. Die SVG-Dateien lassen sich in Figma ziehen, alle Flächen und Texte bleiben einzeln bearbeitbar.</p>'
            + cards + '</html>')
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print(len(karten), "Varianten geschrieben nach", os.path.abspath(out))

if __name__ == "__main__":
    main()
