import { useEffect } from "react";
import { Icon } from "./ui";

export type RechtlichesSeite = "datenschutz" | "impressum";

/** Datenschutz und Impressum. Für das Schulprojekt ehrlich beschrieben, später durch die geprüften Texte ersetzen. */
export default function Rechtliches({ seite, onSchliessen }: { seite: RechtlichesSeite; onSchliessen: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onSchliessen();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onSchliessen]);

  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label={seite === "datenschutz" ? "Datenschutz" : "Impressum"}>
      <div className="vollbild-innen">
        <div className="reihe">
          <h1 style={{ margin: 0 }}>{seite === "datenschutz" ? "Datenschutz" : "Impressum"}</h1>
          <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>
        <p className="hinweis" role="note">Schulprojekt ohne echte Firma. Die Texte beschreiben, was dieser Entwurf wirklich tut. Vor einem Start prüft eine externe Firma sie, wie im Businessplan vorgesehen.</p>

        {seite === "datenschutz" ? (
          <>
            <h2>Was ReRoom speichert</h2>
            <p>Alles, was du eingibst, bleibt in deinem Browser auf diesem Gerät: Räume, Warenkorb, Inserate, Guthaben, Tarif und dein Demo-Name. Es gibt keinen Server und kein Konto. ReRoom sieht deine Daten nicht.</p>
            <h2>Fotos und Kamera</h2>
            <p>Die Kamera startet nur, wenn du sie antippst und dein Browser es erlaubt. Fotos werden auf deinem Gerät verkleinert und dort gespeichert. Sie werden nicht hochgeladen.</p>
            <h2>Teilen</h2>
            <p>Wenn du eine Wohnung teilst, stehen Raummaße, Möbel-Nummern und Positionen im Link selbst. Wer den Link hat, kann sie sehen. Teile ihn nur mit Menschen, denen du das zeigen willst.</p>
            <h2>Übergabe mit zwei Handys</h2>
            <p>Beim QR-Code der Übergabe verbinden sich die beiden Handys direkt miteinander. Zum Verbindungsaufbau nutzt die App den kostenlosen öffentlichen Vermittler von PeerJS. Dieser sieht dabei die Internetadressen (IP) der beiden Handys, aber nicht den Inhalt. Gesendet werden nur Inserat-Nummer und Code. Beim Öffnen des QR-Codes wird die Verbindung aufgebaut, beim Schließen beendet.</p>
            <h2>Chatbot</h2>
            <p>Ohne eingerichtete Cloud-Funktion läuft der Chatbot nur auf deinem Gerät. Mit Cloud-Funktion gehen deine Frage, die Raummaße und der Möbelkatalog an die KI-Schnittstelle. Persönliche Daten sind nicht dabei.</p>
            <h2>Später mit echten Konten</h2>
            <p>Mit Anmeldung, Zahlung und Marktplatz kommen Daten dazu, die ein Server speichert. Dann braucht es eine Einwilligung, Löschung auf Wunsch und eine geprüfte Datenschutzerklärung.</p>
            <h2>Löschen</h2>
            <p>Browserdaten dieser Seite löschen oder die App vom Startbildschirm entfernen, dann ist alles weg.</p>
          </>
        ) : (
          <>
            <h2>Angaben</h2>
            <p>ReRoom ist ein Schulprojekt im Fach Wirtschaftskunde, Klasse Mediengestaltung, 2. Ausbildungsjahr, Chemnitz. Es gibt keine Firma, keinen Verkauf und keine echten Angebote.</p>
            <h2>Verantwortlich</h2>
            <p>[Name 1], [Name 2], [Name 3] (Gründerteam laut Businessplan, Namen vor der Abgabe eintragen)</p>
            <h2>Beispieldaten</h2>
            <p>Möbel, Shops, Preise, Verkäufer und Bewertungen sind erfunden. Zahlungen, Auszahlungen und Transporte sind Demos.</p>
          </>
        )}
      </div>
    </div>
  );
}
