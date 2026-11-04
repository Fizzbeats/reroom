// Start-Aktion aus dem Businessplan: In den ersten 3 Monaten gibt es 6 % Cashback statt 4 %.
// Die Daten sind einstellbar, bis der echte Starttermin feststeht.

export const NORMAL_PROZENT = 4;
export const AKTION_PROZENT = 6;
export const AKTION_VON = new Date(2026, 10, 1); // 1. November 2026
export const AKTION_BIS = new Date(2027, 1, 1); // bis 31. Januar 2027 (drei Monate)

export function aktionAktiv(jetzt: Date = new Date()): boolean {
  return jetzt.getTime() >= AKTION_VON.getTime() && jetzt.getTime() < AKTION_BIS.getTime();
}

/** Cashback in Prozent, der heute gilt. */
export function cashbackProzent(jetzt: Date = new Date()): number {
  return aktionAktiv(jetzt) ? AKTION_PROZENT : NORMAL_PROZENT;
}

const DATUM = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

/** Kurzfassung für schmale Bildschirme: „6 % Cashback bis 31. Januar“ (ohne Jahr). */
export function aktionKurz(jetzt: Date = new Date()): string | undefined {
  if (!aktionAktiv(jetzt)) return undefined;
  const letzterTag = new Date(AKTION_BIS.getTime() - 24 * 60 * 60 * 1000);
  const tag = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long" }).format(letzterTag);
  return `${AKTION_PROZENT}\u00a0% Cashback bis ${tag}`;
}

export function aktionText(jetzt: Date = new Date()): string | undefined {
  if (!aktionAktiv(jetzt)) return undefined;
  const letzterTag = new Date(AKTION_BIS.getTime() - 24 * 60 * 60 * 1000);
  return `Start-Aktion: ${AKTION_PROZENT} % Cashback statt ${NORMAL_PROZENT} % bis ${DATUM.format(letzterTag)}`;
}
