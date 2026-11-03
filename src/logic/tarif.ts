// Tarife aus dem Businessplan (Kapitel 3, „Preise und Varianten“). Bezahlt wird hier nur zum Anschauen (Demo).

export type TarifId = "free" | "pass" | "premium" | "business-starter" | "business-pro";

export interface Tarif {
  id: TarifId;
  name: string;
  /** Preis als Text, z. B. „7,99 € einmalig für 3 Monate“ */
  preis: string;
  preisCent: number;
  /** Laufzeit in Monaten, 0 = unbegrenzt */
  monate: number;
  features: string[];
  maxRaeume: number;
  chatUnbegrenzt: boolean;
  video: boolean;
  preisalarm: boolean;
  fuerMakler?: boolean;
}

export const TARIFE: Tarif[] = [
  {
    id: "free", name: "ReRoom Free", preis: "0 €", preisCent: 0, monate: 0,
    features: ["1 Raum", "Stil-Finder", "5 Chatbot-Fragen pro Tag", "Kaufen und verkaufen"],
    maxRaeume: 1, chatUnbegrenzt: false, video: false, preisalarm: false,
  },
  {
    id: "pass", name: "Umzugs-Pass", preis: "7,99 € einmalig für 3 Monate", preisCent: 799, monate: 3,
    features: ["Unbegrenzt Räume und Chatbot", "3D-Rundgang als Video"],
    maxRaeume: Infinity, chatUnbegrenzt: true, video: true, preisalarm: false,
  },
  {
    id: "premium", name: "Premium", preis: "24,99 € im Jahr", preisCent: 2499, monate: 12,
    features: ["Wie der Umzugs-Pass, aber ganzjährig", "Preisalarm für Möbel"],
    maxRaeume: Infinity, chatUnbegrenzt: true, video: true, preisalarm: true,
  },
  {
    id: "business-starter", name: "Business Starter", preis: "19 € im Monat", preisCent: 1900, monate: 1,
    features: ["Für Makler und Vermieter", "Bis zu 5 Wohnungen", "Wohnung virtuell einrichten und zeigen"],
    maxRaeume: 5, chatUnbegrenzt: true, video: true, preisalarm: false, fuerMakler: true,
  },
  {
    id: "business-pro", name: "Business Pro", preis: "59 € im Monat", preisCent: 5900, monate: 1,
    features: ["Für Makler und Vermieter", "Unbegrenzt Wohnungen", "Wohnung virtuell einrichten und zeigen"],
    maxRaeume: Infinity, chatUnbegrenzt: true, video: true, preisalarm: false, fuerMakler: true,
  },
];

export const tarifVon = (id: TarifId): Tarif => TARIFE.find((t) => t.id === id)!;

export interface Konto {
  /** Demo-Profil: nur ein Name, keine Anmeldung */
  name?: string;
  tarif: TarifId;
  /** Ende der Laufzeit als ISO-Datum, leer bei Free */
  bis?: string;
  einladungsCode: string;
  /** Wie viele Freunde über den Code beigetreten sind (Demo) */
  freunde: number;
  /** Möbel-IDs mit Preisalarm (Premium) */
  preisalarm: string[];
}

const BUCHSTABEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I, O, 0, 1 wegen Verwechslung

export function neuesKonto(zufall: () => number = Math.random): Konto {
  const code = Array.from({ length: 5 }, () => BUCHSTABEN[Math.floor(zufall() * BUCHSTABEN.length)]).join("");
  return { tarif: "free", einladungsCode: `RR-${code}`, freunde: 0, preisalarm: [] };
}

/** Addiert Monate und bleibt am Monatsende (31. Januar + 1 Monat = 28. Februar). */
export function plusMonate(datum: Date, monate: number): Date {
  const ziel = new Date(datum.getFullYear(), datum.getMonth() + monate, 1, datum.getHours(), datum.getMinutes());
  const letzterTag = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate();
  ziel.setDate(Math.min(datum.getDate(), letzterTag));
  return ziel;
}

/** Der Tarif, der jetzt gilt: nach Ablauf der Laufzeit fällt man auf Free zurück. */
export function aktiverTarif(konto: Konto, jetzt: Date): Tarif {
  const t = tarifVon(konto.tarif);
  if (t.id === "free") return t;
  return konto.bis && jetzt.getTime() > new Date(konto.bis).getTime() ? tarifVon("free") : t;
}

/** Schaltet einen Tarif frei (Demo, ohne Zahlung). Läuft ein Tarif noch, beginnt der neue erst danach nicht, er ersetzt ihn. */
export function abonnieren(konto: Konto, id: TarifId, jetzt: Date): Konto {
  const t = tarifVon(id);
  if (t.id === "free") return { ...konto, tarif: "free", bis: undefined };
  return { ...konto, tarif: id, bis: plusMonate(jetzt, t.monate).toISOString() };
}

export function darfRaumSpeichern(eigeneRaeume: number, tarif: Tarif): boolean {
  return eigeneRaeume < tarif.maxRaeume;
}

/** Ein Freund tritt über den Code bei (Demo). Der erste Freund schenkt dem Einladenden den Umzugs-Pass, wenn er noch Free hat. */
export function freundBeigetreten(konto: Konto, jetzt: Date): Konto {
  const neu = { ...konto, freunde: konto.freunde + 1 };
  return konto.freunde === 0 && aktiverTarif(konto, jetzt).id === "free" ? abonnieren(neu, "pass", jetzt) : neu;
}

export function preisalarmUmschalten(konto: Konto, moebelId: string): Konto {
  const an = konto.preisalarm.includes(moebelId);
  return { ...konto, preisalarm: an ? konto.preisalarm.filter((x) => x !== moebelId) : [...konto.preisalarm, moebelId] };
}

const DATUM = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

export function gueltigBisText(konto: Konto, jetzt: Date): string {
  const t = aktiverTarif(konto, jetzt);
  if (t.id === "free") return "Gratis, ohne Laufzeit";
  return `gültig bis ${DATUM.format(new Date(konto.bis!))}`;
}
