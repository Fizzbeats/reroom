import { useEffect, useState } from "react";

/** useState, der den Wert im Browser (localStorage) speichert. */
export function useLokal<T>(schluessel: string, start: T): [T, (neu: T) => void] {
  const [wert, setWert] = useState<T>(() => {
    try {
      const roh = localStorage.getItem(schluessel);
      return roh ? (JSON.parse(roh) as T) : start;
    } catch {
      return start;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(schluessel, JSON.stringify(wert));
    } catch {
      // Speicher voll oder gesperrt: App läuft ohne Speichern weiter
    }
  }, [schluessel, wert]);
  return [wert, setWert];
}
