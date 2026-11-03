// Tageslimit für den Chatbot im Gratis-Tarif (laut Businessplan: 5 Fragen pro Tag).
// Wer den Umzugs-Pass hat, fragt unbegrenzt.

export const FRAGEN_PRO_TAG = 5;

export interface Verbrauch {
  /** Tag im Format JJJJ-MM-TT, an dem `anzahl` gezählt wurde */
  tag: string;
  anzahl: number;
  pass: boolean;
}

export const NEU: Verbrauch = { tag: "", anzahl: 0, pass: false };

/** Tag in der Ortszeit des Geräts, damit „heute“ um Mitternacht wechselt. */
export function tagVon(datum: Date): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${datum.getFullYear()}-${z(datum.getMonth() + 1)}-${z(datum.getDate())}`;
}

/** Noch freie Fragen heute. Mit Pass unendlich. */
export function verbleibend(v: Verbrauch, heute: string): number {
  if (v.pass) return Infinity;
  const gezaehlt = v.tag === heute ? v.anzahl : 0;
  return Math.max(0, FRAGEN_PRO_TAG - gezaehlt);
}

/** Zählt eine Frage. Ein neuer Tag beginnt wieder bei null. */
export function verbrauche(v: Verbrauch, heute: string): Verbrauch {
  if (v.pass) return v;
  const gezaehlt = v.tag === heute ? v.anzahl : 0;
  return { ...v, tag: heute, anzahl: gezaehlt + 1 };
}

export function mitPass(v: Verbrauch): Verbrauch {
  return { ...v, pass: true };
}
