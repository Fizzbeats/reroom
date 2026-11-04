# Figma: Animationen für Variante 18 (vorbereitet, noch nicht ausgeführt)

Datei: https://www.figma.com/design/Zlv5q7ddf1vt2rkvomybQN

Das Limit der Figma-Anbindung im Starter-Tarif war erreicht, bevor die Animationen gesetzt werden konnten.
Der Plan steht hier, damit er schnell nachgeholt werden kann, entweder von Hand (unten) oder wieder mit Claude.

## 1. Knopf-Zustände (Seite „Komponenten“, Komponente „Knopf“)

| Stil | Zustand | Füllung | Auslöser im Prototyp |
|---|---|---|---|
| Primaer | Normal | `farbe/knopf` | Maus darüber → Hover, Drücken → Gedrueckt |
| Primaer | Hover | `farbe/weinrot` | Drücken → Gedrueckt |
| Primaer | Gedrueckt | `farbe/weinrot`, Deckkraft 85 % | – |
| Hell | Normal | `farbe/hintergrund` | wie oben |
| Hell | Hover | `farbe/kachel` | wie oben |
| Hell | Gedrueckt | `farbe/moebel-hell` | – |

Übergang überall: **Smart animate**, 0,15 s, Ease out.

Von Hand in Figma: Komponente „Knopf“ auswählen, in der Variantenleiste einen Zustand hinzufügen (Eigenschaft `Zustand` mit Normal, Hover, Gedrueckt). Dann im Reiter **Prototype** bei „Normal“ eine Interaktion **While hovering → Change to → Hover** und **While pressing → Change to → Gedrueckt** anlegen, Animation Smart animate, 150 ms.

## 2. Wege zwischen den Bildschirmen (Seite „Bildschirme“)

| Von | Element | Nach |
|---|---|---|
| 1 Einstieg | Knopf „Raum ausmessen“ | 2 Startseite |
| 2 Startseite | Text „Konto“ | 7 Konto |
| 2 Startseite | erste Produktkarte | 4 Möbel-Detail |
| 2 Startseite, 3, 5, 6 | Tab „Start“, „Entdecken“, „Korb“, „Verkaufen“ in der Tab-Leiste | 2, 3, 5, 6 |
| 3 Entdecken | erste Produktkarte | 4 Möbel-Detail |
| 4 Möbel-Detail | Pfeil zurück | zurück |
| 4 Möbel-Detail | Knopf „In den Warenkorb“ | 5 Warenkorb |
| 7 Konto | Schließen (×) | 2 Startseite |

Übergang: **Smart animate**, 0,3 s, Ease in and out. Startpunkte für den Prototyp: „1 Einstieg“ und „2 Startseite“.

Von Hand: Element auswählen, im Reiter **Prototype** auf das Plus neben „Interactions“, **On click → Navigate to** und den Bildschirm wählen.
