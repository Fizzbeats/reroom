# ReRoom

**Ausmessen, Stil wählen, günstiger einrichten.**

Mit ReRoom findest du neue und gebrauchte Möbel in deinem Stil und Budget, siehst vorher, ob alles passt, und bekommst 4 % Cashback.

**App öffnen:** https://fizzbeats.github.io/reroom/

## Raum messen

- **Android mit Chrome:** Unter „Messen“ auf „Kamera starten“ tippen. Die App führt durch Raumecken, Raumhöhe, Tür und Treppenhaus und schätzt daraus die Maße. Bei knappen Ergebnissen sagt der Passt-Check, dass du nachmessen sollst.
- **iPhone:** Safari unterstützt keine AR-Messung im Browser. Ein Assistent führt durch sechs Maße, eines pro Bildschirm. Du misst mit der Maßband-App deines iPhones oder mit einem Foto und einer Bankkarte und trägst die Werte ein.

## Entwickeln

```bash
npm install
npm run dev      # App lokal starten
npm test         # Unit-Tests
npm run build    # Produktions-Build
```

Bei jedem Push prüft die CI Typen, Tests und Build. Nach einem Push auf `main` veröffentlicht die CD die App auf GitHub Pages.

**Hinweis:** ReRoom ist ein Schulprojekt (Mediengestaltung, Chemnitz). Alle Möbel, Shops, Anbieter und Preise in den Beispieldaten sind erfunden. Bezahlung, Auszahlung und der Chatbot (noch ohne KI) sind eine Demo.
