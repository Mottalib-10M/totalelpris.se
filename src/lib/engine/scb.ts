/**
 * Statistiques officielles SCB « Elpriser och elavtal » (licence CC0), téléchargées par
 * scripts/data/build-scb.mjs dans data/scb-elpriser.json. Aucune donnée de prix spot : ce sont les prix
 * moyens réellement facturés par les fournisseurs (elhandelspris, hors elskatt, moms et nät), par mois.
 */
import raw from '../../data/scb-elpriser.json';

export type Avtal = 'anvisat' | 'rorligt' | 'avtal1ar' | 'avtal3ar';
export type Zon = 'SE1' | 'SE2' | 'SE3' | 'SE4';
/** 1 = lägenhet, 2 = villa utan elvärme, 3 = villa med elvärme (catégories SCB). */
export type Kategori = '1' | '2' | '3';
export const ZONER: Zon[] = ['SE1', 'SE2', 'SE3', 'SE4'];
export const AVTAL: Avtal[] = ['rorligt', 'avtal1ar', 'avtal3ar', 'anvisat'];
export const SCB_HAMTAT = raw.retrieved_at;

type Rad = [string, string, string, string, number];
const H = raw.handel as unknown as Rad[];

/** Série mensuelle [mois « 2026M08 », öre/kWh] d'un contrat, d'une zone, d'un type de logement. */
export function serie(avtal: Avtal, zon: Zon, kat: Kategori): Array<[string, number]> {
  return H.filter((r) => r[0] === avtal && r[1] === zon && r[2] === kat).map((r) => [r[3], r[4]] as [string, number]).sort((a, b) => a[0].localeCompare(b[0]));
}
/** Dernier mois publié par SCB (« 2026M08 »). */
export const SENASTE_MANAD = H.reduce((m, r) => (r[3] > m ? r[3] : m), '');
export function varde(avtal: Avtal, zon: Zon, kat: Kategori, manad = SENASTE_MANAD): number | null {
  const r = H.find((x) => x[0] === avtal && x[1] === zon && x[2] === kat && x[3] === manad);
  return r ? r[4] : null;
}
/** Moyenne simple des mois publiés d'une année civile, ou null s'il n'y a aucun mois. */
export function arssnitt(avtal: Avtal, zon: Zon, kat: Kategori, ar: number): { snitt: number; manader: number } | null {
  const s = serie(avtal, zon, kat).filter(([m]) => m.startsWith(String(ar)));
  if (!s.length) return null;
  return { snitt: s.reduce((a, [, v]) => a + v, 0) / s.length, manader: s.length };
}
/** Les `n` derniers mois publiés, du plus ancien au plus récent. */
export function senaste(avtal: Avtal, zon: Zon, kat: Kategori, n = 12) { return serie(avtal, zon, kat).slice(-n); }
/** « 2026M08 » → { ar: 2026, man: 8 }. */
export const manadDelar = (m: string) => ({ ar: Number(m.slice(0, 4)), man: Number(m.slice(5)) });

/**
 * Ce qu'aurait coûté l'énergie (partie elhandel seulement, hors moms) sur les `n` derniers mois avec un
 * même volume mensuel, pour chaque type de contrat. Le contrat fixe est pris au prix des contrats SCB du
 * mois (contrats signés ou renouvelés ce mois-là), ce qui le rend comparable mois par mois.
 */
export function jamforAvtal(zon: Zon, kat: Kategori, kwhPerManad: number, n = 12) {
  return AVTAL.map((a) => {
    const s = senaste(a, zon, kat, n);
    const kr = s.reduce((sum, [, ore]) => sum + (ore * kwhPerManad) / 100, 0);
    return { avtal: a, manader: s.length, kr, snittOre: s.length ? s.reduce((x, [, v]) => x + v, 0) / s.length : 0 };
  });
}

type Hus = [string, string, number[]];
/** Prix total moyen des ménages par semestre (handel, nät, elskatt, nät+elskatt, moms, total), öre/kWh. */
export function husPris(kat: 'DB' | 'DC' | 'DD' | 'DE') {
  return (raw.hus as unknown as Hus[]).filter((r) => r[0] === kat).map((r) => ({ halvar: r[1], handel: r[2][0], nat: r[2][1], elskatt: r[2][2], moms: r[2][4], total: r[2][5] })).sort((a, b) => a.halvar.localeCompare(b.halvar));
}
type Nat = [string, string, string, number];
/** Prix moyen pondéré du réseau au 1er janvier (öre/kWh hors taxes, fixe compris), par catégorie. */
export function natSnitt(kat: Kategori) {
  return (raw.nat as unknown as Nat[]).filter((r) => r[0] === kat).map((r) => ({ ar: Number(r[2]), ore: r[3] })).sort((a, b) => a.ar - b.ar);
}
