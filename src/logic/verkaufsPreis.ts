/** Preisvorschlag für gebrauchte Möbel: Neupreis-Schätzung × 0,4 (auf ganze Euro gerundet). */
export function preisVorschlag(neupreisEuro: number): number {
  if (!Number.isFinite(neupreisEuro) || neupreisEuro <= 0) return 0;
  return Math.round((neupreisEuro * 4) / 10);
}
