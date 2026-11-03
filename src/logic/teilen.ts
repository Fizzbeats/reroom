import type { Raum } from "../models/types";
import type { FestePlatz } from "./einrichten";

// Eine eingerichtete Wohnung als Link teilen (z. B. für Makler oder Freunde). Alles steckt im Link,
// es gibt keinen Server. Der Empfänger sieht Raum, Möbel und Preise aus seinem eigenen Katalog.

export interface Teilen {
  raum: Raum;
  moebelIds: string[];
  feste: Record<string, FestePlatz>;
}

const VORSATZ = "#wohnung=";

function nachBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function vonBase64Url(text: string): string {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0)));
}

export function teilLink(daten: Teilen, basis: string): string {
  return `${basis}${VORSATZ}${nachBase64Url(JSON.stringify(daten))}`;
}

const zahl = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v > 0 && v < 5000;

/** Liest den Teil-Link zurück. Alles, was nicht stimmt, ergibt undefined (nie ein Absturz). */
export function leseTeilLink(hash: string): Teilen | undefined {
  if (!hash.startsWith(VORSATZ)) return undefined;
  try {
    const d = JSON.parse(vonBase64Url(hash.slice(VORSATZ.length))) as Teilen;
    const r = d.raum;
    const raumOk =
      typeof r?.name === "string" && [r.breiteCm, r.tiefeCm, r.hoeheCm, r.tuerBreiteCm, r.tuerHoeheCm, r.treppenhausBreiteCm].every(zahl);
    if (!raumOk || !Array.isArray(d.moebelIds) || d.moebelIds.length > 40 || !d.moebelIds.every((i) => typeof i === "string")) return undefined;
    const feste: Record<string, FestePlatz> = {};
    for (const [id, f] of Object.entries(d.feste ?? {})) {
      if (typeof f?.x === "number" && typeof f?.y === "number") feste[id] = { x: f.x, y: f.y, gedreht: Boolean(f.gedreht) };
    }
    return { raum: { ...r, id: "geteilt", name: r.name.slice(0, 60) }, moebelIds: d.moebelIds, feste };
  } catch {
    return undefined;
  }
}
