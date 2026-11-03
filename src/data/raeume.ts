import type { Raum } from "../models/types";

// Beispielräume (Raumhöhe jeweils 250 cm)
export const BEISPIELRAEUME: Raum[] = [
  { id: "wg", name: "WG-Zimmer", breiteCm: 300, tiefeCm: 400, hoeheCm: 250, tuerBreiteCm: 80, tuerHoeheCm: 200, treppenhausBreiteCm: 100 },
  { id: "1zi", name: "1-Zimmer-Wohnung", breiteCm: 500, tiefeCm: 500, hoeheCm: 250, tuerBreiteCm: 85, tuerHoeheCm: 205, treppenhausBreiteCm: 110 },
  { id: "wohn", name: "Wohnzimmer", breiteCm: 400, tiefeCm: 500, hoeheCm: 250, tuerBreiteCm: 90, tuerHoeheCm: 210, treppenhausBreiteCm: 120 },
];
