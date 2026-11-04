# Figma-Bauplan für ReRoom (Variante 18, Weinrot und Creme)

Zweck: Eine neue Claude-Sitzung (zum Beispiel auf dem Mac mit Figma Pro) kann damit die **ganze App** in Figma bauen, mit Komponenten, Bildschirmen, Wegen und Animationen. Reihenfolge einhalten, nach jedem Schritt prüfen.

Quellen im Repository (nichts davon neu erfinden):
- App-Code: `src/views/*.tsx`, Farben `src/styles/tokens.css` und `src/theme.ts`, Texte `src/logic/texte.ts`
- Klickbarer Prototyp mit allen Bildschirmen und Inhalten: `public/vorschau/index.html` (live: https://fizzbeats.github.io/reroom/vorschau/)
- Gezeichnete Bildschirme als SVG (Maße 390 × 844): `docs/figma-import/*.svg`, Varianten: `docs/varianten/`
- Animationen und Wege: `docs/figma-animationen.md`
- Bebilderte Anleitung: `docs/figma-anleitung.html`

## 0. Regeln (aus der ersten Runde gelernt)
1. Erst `whoami`, dann den **Tarif prüfen** (Pro oder höher, Full seat). Datei in diesem Konto neu anlegen.
2. Schriften: Titel **Source Serif 4 Bold**, Text **Inter**. Georgia gibt es in Figma nicht.
3. Pfeile in `vectorPaths` gehen nicht mit dem Befehl `A`. Kurven mit `C` zeichnen.
4. Größen von Ebenen **innerhalb einer Instanz** lassen sich nicht überschreiben. Für den Passt-Check-Balken deshalb Varianten `Status` (ok, knapp) × `Anteil` (20, 40, 60, 80, 100) bauen.
5. Textfelder von Komponenten über Eigenschaften (`addComponentProperty`) steuern. **Nach dem Setzen mit Screenshot prüfen**, ob wirklich jede Instanz ihren eigenen Text zeigt (in der ersten Datei zeigten im Browser alle Produktkarten „20,00 €“).
6. Skripte pro Aufruf klein halten, Seitenwechsel nur einmal pro Aufruf, IDs zurückgeben.

## 1. Variablen
**Farben** (Collection „Farben“, Modi „Hell“ und „Dunkel“, Namen `farbe/…`, Gültigkeit `ALL_FILLS` und `STROKE_COLOR`):

| Name | Hell | Dunkel |
|---|---|---|
| hintergrund | #FFF8EE | #1E0E12 |
| karte (Kachel) | #F6E6DA | #2C171C |
| text | #3A0F18 | #FFF1E4 |
| text-gedaempft | #7A5058 | #C9ABB0 |
| primaer (Knopf) | #3A0F18 | #FFF1E4 |
| auf-primaer | #FFF8EE | #3A0F18 |
| wein (große Flächen) | #7B1E2E | #5E1A2A |
| auf-wein | #FFF1E4 | #FFF1E4 |
| akzent / orange | #FF5B2E | #FF6B3D |
| ampel-gruen | #4C6B2E | #A9D17F |
| ampel-gelb | #8A5F00 | #F2C94C |
| ampel-rot | #A8321F | #FF8A78 |
| linie | #E2D8CE | #3D2A2E |
| pastell (warme Kachel) | #F6E6DA | #3A1E24 |
| pastell-stark | #EBD3C3 | #4A2830 |
| auf-pastell | #7B1E2E | #FFD9DC |

**Zahlen** (Collection „Abstaende und Radien“, Gültigkeit `GAP` bzw. `CORNER_RADIUS`): abstand/xs 4, s 8, m 12, l 16, xl 24, xxl 32, xxxl 48, seitenrand 24, radius/knopf 2, radius/karte 2, radius/rund 999.

## 2. Textstile
Titel/XL 46/46 (−1,2), Titel/L 33/36, Titel/M 24/28, Titel/S 19/24, Preis/L 24/28, Preis/M 17/22 (alle Source Serif 4 Bold), Text/Standard 15/22, Text/Fett 15/22 Bold, Text/Klein 13/18, Text/Klein-Fett 13/18 Bold, Text/Mini 11/14, Knopf 16/20 Bold, Tab 11/14 Medium, Tab/Aktiv 11/14 Bold (alle Inter).

## 3. Komponenten (Seite „Komponenten“)
Logo-Platzhalter (132 × 40, gestrichelt) · Knopf (`Stil` Primaer/Hell × `Zustand` Normal/Hover/Gedrueckt, Text-Eigenschaft Beschriftung) · Zeile (Titel, Zusatz) · Aktionsband · Balken (Status × Anteil, Texte Name und Wert) · Chip (Normal/Aktiv) · Produktkarte (Motiv Stuhl/Sideboard/Sofa, Texte Preis, Name, Passt) · Tab-Leiste (Aktiv: Start, Entdecken, Messen, Korb, Verkaufen, **Messen als runder Mittelknopf wie in der App**) · Grundriss · Warenkorb-Position · Kachel · Inserat · Tarifkarte (Aktiv Ja/Nein) · Eingabefeld · Sprechblase (Bot/Nutzer) · Sheet-Kopf · Bildschirm-Titel.

## 4. Bildschirme (390 × 844, Seite „Bildschirme“, Reihenfolge und Namen)
1 Einstieg · 2 Startseite · 3 Entdecken · 4 Möbel-Detail · 5 Warenkorb · 6 Verkaufen · 7 Konto · 8 Messen · 9 Kamera · 10 Stil-Finder Farben · 11 Stil-Finder Wischen · 12 Stil-Finder Ergebnis · 13 Chat · 14 3D-Rundgang · 15 Testkasse · 16 Übergabe QR · 17 Inserat Fotos · 18 Inserat Angaben · 19 Geteilte Wohnung. Dazu je ein Dunkelmodus-Bildschirm für 1, 2 und 4.
Inhalte und Texte stehen im Prototyp `public/vorschau/index.html` und in `src/views`. Tab-Leiste unten (62 hoch) bei 1 bis 8, 10 bis 13 und 17 bis 18, nicht bei 9, 14 bis 16.
Auto-Layout: Bildschirm vertikal, Inhaltsblock mit `layoutGrow = 1`, damit die Tab-Leiste unten sitzt.

## 5. Prototyp (Wege und Animationen)
- Übergang Bildschirme: Smart animate, Ease in/out, 0,3 s. Knopf-Zustände: Smart animate, Ease out, 0,15 s.
- Knopf: Normal → While hovering → Hover, While pressing → Gedrueckt.
- Einstieg: Knopf → 8 Messen, „Überspringen“ → 2, Zeile „Stil finden“ → 10.
- Startseite: „Konto“ → 7, Produktkarte → 4, „3D“ → 14, „Alle in den Korb“ → 5.
- Tab-Leiste in jedem Bildschirm: Start → 2, Entdecken → 3, Messen → 8, Korb → 5, Verkaufen → 6.
- Entdecken: Karte → 4. Detail: Zurück → zurück, „In den Warenkorb“ → 5. Warenkorb: „Zur Testkasse“ → 15 (Sheet über dem Bildschirm).
- Verkaufen: „Möbel einstellen“ → 17, Inserat „Zur Übergabe“ → 16. Konto: Schließen → zurück.
- Messen: „Mit Foto messen“ → 9, Kamera: Schließen → zurück, Auslöser → 8.
- Stil-Finder: 10 → 11 → 12, Ergebnis „Alles in den Korb“ → 5. Chat-Knopf (rund, rechts unten) → 13.
- Startpunkte: „1 Einstieg“ und „2 Startseite“.

## 6. Prüfen
Screenshot jedes Bildschirms (Texte, Abschneiden, Überlappungen), Konto-Bildschirm auf Höhe „Hug“, im Prototyp-Modus alle Wege einmal klicken, Dunkelmodus der Variablen testen.
