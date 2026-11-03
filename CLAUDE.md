# ReRoom – Web-Entwurf (Windows)

> **Plattform-Wechsel:** Auf Windows gibt es kein Xcode, kein RoomPlan und keinen iPhone-Simulator.
> Deshalb gibt es zuerst einen **lauffähigen Web-Entwurf** (Vite, React, TypeScript, Vitest). Er läuft im Browser
> und am Handy (als Webseite). Die Swift-Planung unten bleibt als Ziel für die iPhone-App erhalten (Stufe 4 wird zu „iPhone und Android").
>
> **Ersatz für Apple-Technik im Entwurf:**
> - RoomPlan-Scan → **AR-Kamera-Messung** im Browser (WebXR mit Hit-Test, `src/services/arSitzung.ts`, `src/views/ArMesser.tsx`, Logik `src/logic/arMessung.ts`): geführt durch Raumecken, Raumhöhe, Tür und Treppenhaus, ohne Zollstock. Läuft auf Android mit Chrome, nur über HTTPS (GitHub Pages) oder localhost.
>   - Ohne AR (iPhone-Safari kann kein WebXR): Foto-Messung mit Bankkarte/A4 (`src/views/KameraMesser.tsx`, `src/logic/messen.ts`) oder Eintippen. Beispielräume in `src/data/raeume.ts`.
>   - Vollautomatischer Scan auf iPhones mit LiDAR geht nur als eigene App mit RoomPlan (z. B. Expo + `expo-roomplan`, Build in der Cloud mit EAS). Braucht ein Apple-Entwicklerkonto (99 €/Jahr). Weicht vom Businessplan ab („Web-App, ohne App-Store-Gebühren“), dort als „Ausbaustufe Kamera-Scan“ geplant.
> - SwiftData → `localStorage` (`src/useLokal.ts`)
> - `MoebelRepository` → TypeScript-Interface in `src/data/moebelRepository.ts` (später Supabase)
> - Asset-Katalog mit Dark Mode → `src/styles/tokens.css` + `src/theme.ts` (ein Test prüft, dass beide übereinstimmen und der Kontrast stimmt)
> - Geld wird in ganzen Cent gerechnet statt mit `Decimal`
> - `xcodebuild test` → `npm test`
>
> **Businessplan** (`ReRoom – Businessplan.pdf`) hat Vorrang vor der iPhone-Planung unten. Daraus übernommen: Slogan „Ausmessen, Stil wählen, günstiger einrichten.“, Preisanzeige „649 €, mit ReRoom 623,04 €“, Startseite als geführter Weg.
>
> **Design:** Marktplatz-Stil nach Entwurf `public/design/index.html`: Weiß/Schwarz, Bilder im 2er-Raster, Orange `#FF5B2E` nur als Marken-Akzent, Grün nur für „mit ReRoom“, Schrift Bricolage Grotesque für Titel und Preise, eigene Strich-Icons (`src/views/ui.tsx`). Möbelbilder: Produktfoto des Anbieters (`bildUrl`), sonst Zeichnung je Kategorie. Kein Blau, kein Creme/Serif-Look. Alte Entwürfe unter `public/entwuerfe/` sind verworfen.
>
> **Handy (umgesetzt):** Installierbar als App (`public/manifest.webmanifest`, Symbole in `public/icons/`, erzeugt mit `node scripts/symbole.mjs`), Sicherheitsabstände für Notch und Home-Leiste (`viewport-fit=cover`), Hell/Dunkel-Farbe der Browserleiste. AR-Status mit Erklärung, warum die Kamera ggf. nicht geht (`src/logic/arStatus.ts`). Das AR-Overlay darf nie `display: none` sein, sonst sind Anleitung und Knöpfe in der Kamera unsichtbar. **Die AR-Messung ist noch nicht an einem echten Android-Handy getestet.**
>
> **Messen auf dem iPhone (umgesetzt):** Safari kann kein WebXR, also keine Live-Messung im Browser. Stattdessen führt `src/views/MessAssistent.tsx` durch 6 Maße (ein Maß pro Bildschirm, Skizze, Prüfung in `src/logic/messSchritte.ts`), misst auf Wunsch per Foto mit Bankkarte oder verweist auf die Maßband-App des iPhones (`measure://`). Ein vollautomatischer Scan auf dem iPhone geht nur mit einer eigenen App (RoomPlan, nur iPhone 12 Pro und neuer mit LiDAR, Apple-Entwicklerkonto 99 €/Jahr).
>
> **Chatbot und 3D (umgesetzt, laut Businessplan):**
> - Chatbot als Sheet (`src/views/Chat.tsx`), erreichbar über den runden Knopf rechts unten (nicht oben rechts, dort liegen schon Filter und „Neu messen“). Logik in `src/logic/chatbot.ts`: versteht Möbelart, Farbe, Stil, Preis, Zustand, Entfernung und Nische, fragt bei „Nische“ nach der Breite, lockert Wünsche und sagt was weggelassen wurde, beantwortet „Passt das Sofa Lund durch meine Tür?“. Schlägt nur Möbel vor, die im Passt-Check nicht rot sind. Free-Tarif: 5 Fragen pro Tag (`src/logic/chatLimit.ts`), Umzugs-Pass-Knopf ist eine Demo ohne Zahlung. Später austauschbar gegen die Claude-API über eine Cloud-Funktion (Stufe 2).
> - 3D-Rundgang (`src/views/Rundgang3D.tsx`, `src/services/szene3d.ts`, Berechnung in `src/logic/ausrichtung.ts`): Knopf „3D“ auf der Raumkarte. Überblick (drehen und zoomen) und Rundgang (Kamera geht durch den Raum). three.js wird erst beim Öffnen geladen.
>
> **Erlebnis für neue Kunden (umgesetzt):**
> - Willkommen-Karten beim ersten Besuch (`src/views/Willkommen.tsx`): Messen, Stil finden, Sparen.
> - Möbel im eigenen Grundriss: automatische Platzierung (`src/logic/einrichten.ts`), Startseite zeigt „So könnte es aussehen“, Detailseite hat „Foto / In meinem Raum“ mit Weg durch die Tür. Eigene Auswahl je Raum in `reroom.imRaum`.
> - Stil-Finder zum Wischen (`src/views/StilFinder.tsx`, Karten in `src/data/inspo.ts`, Auswertung und Zimmer-Set in `src/logic/stilAuswertung.ts`) mit Budget fürs ganze Zimmer.
> - Teppiche werden im Passt-Check für Tür und Treppe gerollt gerechnet (`pruefeMoebel`).
>
> **Noch offen (laut Businessplan):** eigene Inspo-Bilder hochladen, Möbel im Grundriss per Finger verschieben, 3D-Rundgang, Verkaufserlös als Guthaben mit 5 % Bonus, QR-Übergabe, Transport-Partner, Free = 1 Raum, Möbel-Detailseite, Möbelbilder.
>
> **Befehle:** `npm install`, `npm run dev` (Entwicklung), `npm test`, `npm run build`.
> **CI:** `.github/workflows/ci.yml` (Typen, Tests, Build bei jedem Push und Pull Request).
> **CD:** `.github/workflows/deploy.yml` (Tests, Build, Veröffentlichung auf GitHub Pages nach Push auf `main`; in den Repo-Einstellungen unter Pages die Quelle „GitHub Actions" wählen).

---

# ReRoom – iPhone-App

Diese Datei beschreibt das Projekt. Halte dich bei allen Aufgaben daran.
Wenn sich etwas an der Idee ändert, passe diese Datei an.

## Arbeitsweise

- Ich bin noch am Lernen: Erkläre nach jedem Schritt kurz, was du gemacht hast und wie ich es in Xcode teste.
- Kommentiere den Code auf Deutsch.
- Arbeite in kleinen Schritten. Baue immer nur den Schritt, um den ich bitte.
- Schreibe für die gesamte Logik Unit-Tests und lass sie mit `xcodebuild test` laufen.
- Mache nach jedem funktionierenden Schritt einen Git-Commit mit einer deutschen Commit-Nachricht.
- Die App soll später wirklich veröffentlicht werden: sauber, erweiterbar und ohne Abkürzungen programmieren.

## Idee

ReRoom ist eine App zum Einrichten. Man scannt seinen Raum, wählt Stil, Budget und Farben, bekommt passende neue und gebrauchte Möbel vorgeschlagen, sieht alles im 3D-Raum und kauft mit 4 % Cashback.

Besonderheiten:
- **Passt-Check:** prüft, ob ein Möbel in den Raum UND durch Tür und Treppenhaus passt.
- **Neu und gebraucht zusammen:** neue Möbel von Shops und gebrauchte Möbel von Privatleuten in einem Raum.
- **Verkaufen:** Nutzer können ihre alten Möbel als Inserat einstellen.

ReRoom ist Vermittler: Es kauft keine Möbel ein und hat kein Lager.

## Technik

- Swift und SwiftUI, iOS 17 oder neuer.
- Architektur MVVM mit klaren Ordnern: `Models`, `ViewModels`, `Views`, `Services`, `Logic`.
- **Raum-Scan mit Apples RoomPlan** (`RoomCaptureView`). Aus dem `CapturedRoom` Wände, Türen und Fenster mit Maßen übernehmen und in unser eigenes Raum-Modell umrechnen (Zentimeter).
  - Mit `RoomCaptureSession.isSupported` prüfen, ob das Gerät LiDAR hat.
  - Ohne LiDAR oder im Simulator: Raum von Hand eingeben oder Beispielraum wählen.
  - Kamera-Begründung (`NSCameraUsageDescription`) auf Deutsch: „ReRoom nutzt die Kamera, um deinen Raum zu vermessen.“
- **3D-Raum mit RealityKit:** Boden und Wände aus den Raummaßen, Möbel als farbige Boxen in echter Größe, per Finger verschiebbar und drehbar.
- **Daten in Stufe 1 lokal:** Möbel als JSON-Datei im App-Bundle (`Codable`). Zugriff nur über das Protokoll `MoebelRepository`, damit später eine Cloud-Datenbank (Supabase) angeschlossen werden kann, ohne die Views zu ändern.
- Eigene Räume, Warenkorb und Verkaufs-Inserate lokal mit **SwiftData** speichern.
- **Chatbot** hinter dem Protokoll `ChatService`. In Stufe 1 ein lokaler Ersatz, der Stichwörter (Farbe, Möbelart, Preis) erkennt und den Katalog filtert.
- Oberfläche komplett auf Deutsch, Dark Mode unterstützen, Bedienungshilfen (VoiceOver-Beschriftungen, Dynamic Type) beachten.

## Sicherheitsregeln

- Niemals API-Schlüssel, Passwörter oder Secrets in den App-Code oder ins Repository schreiben.
- Die Claude API wird nur über eine Cloud-Funktion aufgerufen (Stufe 2), nie direkt aus der App.
- ReRoom bewahrt kein fremdes Geld auf. Zahlungen laufen später über einen Zahlungsdienstleister mit Marktplatz-Funktion.
- Keine echten Marken-, Shop- oder Personennamen in Beispieldaten.

## Daten

### moebel.json (ca. 30 Beispielmöbel, gemischt neu und gebraucht)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | String | eindeutige ID, z. B. `sofa-01` |
| `name` | String | z. B. „Sofa Lund“ |
| `kategorie` | Enum | `sofa`, `bett`, `schrank`, `tisch`, `stuhl`, `regal`, `lampe`, `teppich` |
| `zustand` | Enum | `neu` oder `gebraucht` |
| `preis` | Decimal | in Euro |
| `anbieter` | String | erfundener Shop-Name oder „Privat, Chemnitz-&lt;Stadtteil&gt;“ |
| `entfernungKm` | Double? | nur bei gebrauchten Möbeln |
| `masseCm` | Objekt | `breite`, `tiefe`, `hoehe` |
| `stile` | [Enum] | `skandi`, `modern`, `industrial`, `boho`, `vintage` |
| `farben` | [String] | z. B. `grau`, `weiss`, `holz` |
| `beschreibung` | String | ein bis zwei Sätze |

Beispiel:

```json
{
  "id": "sofa-01",
  "name": "Sofa Lund",
  "kategorie": "sofa",
  "zustand": "gebraucht",
  "preis": 180,
  "anbieter": "Privat, Chemnitz-Kaßberg",
  "entfernungKm": 3,
  "masseCm": { "breite": 200, "tiefe": 85, "hoehe": 80 },
  "stile": ["skandi"],
  "farben": ["grau"],
  "beschreibung": "Gemütliches Zweisitzer-Sofa, kaum benutzt."
}
```

### Beispielräume

| Raum | Fläche | Tür (B × H) | Treppenhaus |
|---|---|---|---|
| WG-Zimmer | 3,0 × 4,0 m | 80 × 200 cm | 100 cm |
| 1-Zimmer-Wohnung | 5,0 × 5,0 m | 85 × 205 cm | 110 cm |
| Wohnzimmer | 4,0 × 5,0 m | 90 × 210 cm | 120 cm |

Raumhöhe jeweils 250 cm.

## Logik (Ordner `Logic`, alles mit Unit-Tests)

### StilFinder
1. Alles entfernen, was über dem Budget liegt.
2. Punkte vergeben: passender Stil +3, passende Farbe +2, gebraucht und unter 10 km entfernt +1.
3. Nach Punkten absteigend sortieren, bei Gleichstand nach Preis aufsteigend.

### PasstCheck
1. **Tür:** Die drei Möbelmaße der Größe nach sortieren. Das Möbel darf gekippt werden, also müssen die zwei kleinsten Maße kleiner sein als Türbreite und Türhöhe. Dasselbe für das Treppenhaus (Breite).
2. **Raum:** Breite und Tiefe des Möbels gegen die freie Raumfläche prüfen (Möbel darf um 90° gedreht werden).
3. Ergebnis als Ampel, maßgeblich ist der kleinste Spielraum:
   - **grün:** mehr als 10 cm Platz
   - **gelb:** 5 bis 10 cm Platz → Hinweis „Bitte nachmessen“
   - **rot:** weniger als 5 cm oder passt nicht
4. Immer eine Begründung als Text liefern, z. B. „Passt nicht durch die Tür: 92 cm Tiefe, Tür nur 80 cm breit.“

### PreisRechner
- Beträge mit `Decimal` rechnen, nie mit `Double`.
- Neue Möbel: Cashback = Preis × 0,04.
- Gebrauchte Möbel: Käuferschutz = Preis × 0,04 + 0,50 €.
- Warenkorb: Zwischensumme, Käuferschutz, Cashback und Endpreis getrennt ausweisen.

## Bildschirme

TabView unten mit: **Start**, **Scannen**, **Entdecken**, **Warenkorb**, **Verkaufen**. Der Chat öffnet sich über einen Knopf oben rechts als Sheet.

1. **Start:** Schriftzug „ReRoom“, Slogan „Scannen, Stil wählen, günstiger einrichten.“, Liste meiner Räume.
2. **Scannen:** RoomPlan-Scan, danach Treppenhausbreite eintippen, Raum benennen und speichern.
3. **Stil-Finder** in 4 Schritten: Stil wählen, Budget per Schieberegler, Farben wählen, Inspo-Karten zum Wischen (farbige Karten mit Stil-Namen statt Fotos: gefällt mir / gefällt mir nicht).
4. **Entdecken:** Ergebnisse als Karten mit Preis, Zustand (neu/gebraucht), Passt-Ampel und Cashback. Filter für neu/gebraucht.
5. **Möbel-Detail:** alle Maße, Passt-Check mit Begründung, Knopf „In meinen Raum stellen“, Knopf „In den Warenkorb“.
6. **3D-Raum:** alle ausgewählten Möbel im gescannten Raum.
7. **Warenkorb:** Zwischensumme, Cashback, Käuferschutz, Endpreis, Knopf „Demo-Kauf“ (ohne echte Zahlung).
8. **Verkaufen:** Inserat anlegen, Maße aus einem Scan oder von Hand, Preisvorschlag (Neupreis-Schätzung × 0,4), Abholung beim Verkäufer.

## Design

- Weiß und Schwarz als Basis, Bilder im Vordergrund (2er-Raster), Ecken 18, keine Deko-Animationen.
- Startseite: Raumkarte mit maßstäblichem Grundriss, Stil-Chips, „Passt in dein …“. Ohne Raum: Aufruf „Raum ausmessen“.
- Möbel-Detail mit Passt-Check als Balken (Tür, Treppenhaus, Raum) und fester Kaufleiste.
- Navigation unten mit Messen als rundem Knopf in der Mitte.
- Farben (jeweils mit Dark-Mode-Variante, Werte in `src/theme.ts`):
  - Hintergrund `#FFFFFF`, Flächen `#F1F1EF`, Text und Knöpfe `#111111`
  - Akzent Orange `#FF5B2E` (Logo-Punkt, aktiver Tab)
  - Grün `#0B7A4B` nur für „mit ReRoom“ und Cashback
  - Ampel: grün, gelb, rot
- SF Symbols für Icons, Systemschrift.

## Bauplan

### Stufe 1: Grundlage (Pitch-Demo)

- [ ] **Schritt 1:** Ordnerstruktur, Datenmodelle, `moebel.json` mit Beispieldaten, Beispielräume, Logik-Dateien (`StilFinder`, `PasstCheck`, `PreisRechner`) mit Tests, einfache Startseite.
- [ ] **Schritt 2:** Raum von Hand anlegen und Beispielräume wählen, Speichern mit SwiftData.
- [ ] **Schritt 3:** RoomPlan-Scan mit Umrechnung in unser Raum-Modell.
- [ ] **Schritt 4:** Stil-Finder, Entdecken und Möbel-Detail mit Passt-Check.
- [ ] **Schritt 5:** 3D-Raum mit RealityKit.
- [ ] **Schritt 6:** Warenkorb und Verkaufen.
- [ ] **Schritt 7:** Lokaler Ersatz-Chatbot.
- [ ] **Schritt 8:** Feinschliff: App-Icon, Ladezustände, Fehlermeldungen, Bedienungshilfen.

### Stufe 2: Cloud und Chatbot

- [ ] Supabase anschließen: Tabellen `moebel`, `inserate`, `raeume`, `profile`; Login mit „Mit Apple anmelden“; Fotos in Supabase Storage; Row Level Security, damit jeder nur seine eigenen Räume sieht. Lokales `MoebelRepository` durch `SupabaseRepository` ersetzen. Mir jeden Schritt erklären, den ich im Supabase-Dashboard selbst machen muss.
- [ ] Supabase Edge Function `chat`, die über die Claude API das Modell `claude-haiku-5-5` aufruft. API-Schlüssel nur als Supabase-Secret. Eingabe: Frage, Raummaße, Katalog-Auszug. Ausgabe: passende Möbel-IDs und ein kurzer deutscher Text. Lokalen `ChatService` dadurch ersetzen.
- [ ] Test mit Freunden über TestFlight.

### Stufe 3: Marktplatz und Start

- [ ] Bezahlen über einen Zahlungsdienstleister mit Marktplatz-Funktion (z. B. Stripe Connect). Geld wird erst freigegeben, wenn der Käufer die Übergabe per QR-Code bestätigt.
- [ ] Partner-Shops: zuerst Links aus Partnerprogrammen, später Produktdaten und 3D-Modelle direkt anbinden.
- [ ] Transport-Partner in Chemnitz per Buchungsformular.
- [ ] Veröffentlichung im App Store mit Datenschutzerklärung und Datenschutz-Angaben.

### Stufe 4: Android

- [ ] Android-Version. Ohne RoomPlan: Raum per Hand oder mit Kamera-Messung über ARCore. Logik (StilFinder, PasstCheck, PreisRechner) übernehmen.
