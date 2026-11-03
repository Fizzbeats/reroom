import type { Moebel, Raum } from "../models/types";
import { pruefeMoebel } from "../logic/passtCheck";
import { MAX_TREFFER, type ChatAntwort } from "../logic/chatbot";

// Chatbot mit echter KI über eine Cloud-Funktion (siehe cloud/chat-worker.js). Der API-Schlüssel liegt nur dort, nie in der App.
// Ist keine Adresse eingetragen (VITE_CHAT_URL) oder ist die Funktion nicht erreichbar, antwortet der lokale Chatbot.

export const chatAdresse = (): string | undefined => {
  const a = import.meta.env.VITE_CHAT_URL as string | undefined;
  return a && /^https:\/\//.test(a) ? a : undefined;
};

/** Nur das Nötige geht an die Cloud: Möbel-Daten und Raummaße, nichts Persönliches. */
export function auszug(katalog: Moebel[]) {
  return katalog.map((m) => ({
    id: m.id, name: m.name, kategorie: m.kategorie, zustand: m.zustand, preis: m.preis,
    masse: m.masseCm, stile: m.stile, farben: m.farben, km: m.entfernungKm,
  }));
}

/** Fragt die KI. Gibt undefined zurück, wenn etwas nicht klappt, dann nimmt der Aufrufer den lokalen Chatbot. */
export async function frageKi(
  adresse: string, frage: string, katalog: Moebel[], raum: Raum | undefined,
  abruf: typeof fetch = fetch,
): Promise<ChatAntwort | undefined> {
  try {
    const r = await abruf(adresse, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ frage, raum, katalog: auszug(katalog) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return undefined;
    const d = (await r.json()) as { text?: unknown; moebelIds?: unknown };
    if (typeof d.text !== "string" || !Array.isArray(d.moebelIds)) return undefined;
    // Nur Möbel, die es gibt und die im Passt-Check nicht rot sind, egal was die KI vorschlägt
    const treffer = d.moebelIds
      .map((id) => katalog.find((m) => m.id === id))
      .filter((m): m is Moebel => Boolean(m))
      .filter((m) => !raum || pruefeMoebel(m, raum).ampel !== "rot")
      .slice(0, MAX_TREFFER);
    return { text: d.text.slice(0, 800), treffer };
  } catch {
    return undefined;
  }
}
