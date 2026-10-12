/**
 * Prix au quart d'heure collés par l'utilisateur (depuis l'application de son fournisseur, sa facture
 * ou la plateforme de transparence ENTSO-E) : lecture, statistiques et meilleure fenêtre.
 * Le site ne télécharge aucun prix spot : il ne fait que lire ce que l'utilisateur colle.
 */
export interface Serie { priser: number[]; minuter: number; enhet: 'ore' | 'kr' | 'eur-mwh'; avvisade: number }

const TID = /\b\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\b/g;
const DATUM = /\b\d{4}-\d{2}-\d{2}(?:T[\d:+.Z-]*)?\b/g;
/** Premier nombre d'une ligne, une fois heures et dates retirées : « 00:15–00:30 42,1 öre » → 42,1. */
function talPaRad(rad: string): number | null {
  const ren = rad.replace(DATUM, ' ').replace(TID, ' ').replace(/[–—]/g, ' ');
  const m = ren.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Lit une liste collée. Une valeur par ligne, ou séparées par des points-virgules ou tabulations.
 * Unité : « €/MWh » ou « EUR » dans le texte → €/MWh ; sinon toutes les valeurs absolues < 10 → kr/kWh,
 * sinon öre/kWh. 24 valeurs = heures, 96 = quarts d'heure (92 et 100 les jours de changement d'heure).
 */
export function lasSerie(text: string): Serie {
  const rader = text.split(/\r?\n|;/).map((r) => r.trim()).filter(Boolean);
  const tal: number[] = [];
  let avvisade = 0;
  for (const r of rader) { const n = talPaRad(r); if (n === null) avvisade++; else tal.push(n); }
  const enhet: Serie['enhet'] = /€\s*\/?\s*MWh|EUR/i.test(text) ? 'eur-mwh' : tal.length && tal.every((x) => Math.abs(x) < 10) ? 'kr' : 'ore';
  const minuter = tal.length >= 90 ? 15 : 60;
  return { priser: tal, minuter, enhet, avvisade };
}

/** Série en öre/kWh. Les €/MWh se convertissent avec le cours saisi (SEK pour 1 €) : 1 €/MWh = 0,1 cent/kWh. */
export function tillOre(s: Serie, sekPerEur = 0): number[] {
  if (s.enhet === 'kr') return s.priser.map((x) => x * 100);
  if (s.enhet === 'eur-mwh') return s.priser.map((x) => (x * sekPerEur) / 10);
  return s.priser;
}

export interface Statistik { min: number; minIdx: number; max: number; maxIdx: number; snitt: number }
/** Minimum, maximum et moyenne d'une même série : min ≤ snitt ≤ max par construction (testé). */
export function statistik(p: number[]): Statistik {
  if (!p.length) return { min: 0, minIdx: -1, max: 0, maxIdx: -1, snitt: 0 };
  let minIdx = 0, maxIdx = 0;
  p.forEach((x, i) => { if (x < p[minIdx]) minIdx = i; if (x > p[maxIdx]) maxIdx = i; });
  return { min: p[minIdx], minIdx, max: p[maxIdx], maxIdx, snitt: p.reduce((a, b) => a + b, 0) / p.length };
}

/** Fenêtre contiguë la moins chère pour `langdMin` minutes : indice de départ et moyenne. */
export function billigasteFonster(p: number[], minuter: number, langdMin: number) {
  const n = Math.max(1, Math.round(langdMin / minuter));
  if (p.length < n) return { start: -1, snitt: 0, platser: n };
  let sum = 0;
  for (let i = 0; i < n; i++) sum += p[i];
  let best = sum, start = 0;
  for (let i = n; i < p.length; i++) { sum += p[i] - p[i - n]; if (sum < best) { best = sum; start = i - n + 1; } }
  return { start, snitt: best / n, platser: n };
}

/** « 00:00 », « 13:45 » pour un indice de créneau. */
export function klockslag(idx: number, minuter: number): string {
  const t = idx * minuter;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
