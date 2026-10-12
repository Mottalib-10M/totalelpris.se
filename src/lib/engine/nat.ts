/**
 * Tarifs des réseaux locaux selon le relevé d'Energimarknadsinspektionen (Ei), « Elnätsföretagens
 * avgifter för hushållskunder », cas types d'Ei, valeurs HORS moms au 1er janvier (data/ei-nat.json,
 * produit par scripts/data/build-ei.py). Un cas absent ou à zéro chez Ei (tarif à redevance de
 * puissance que le cas type ne calcule pas, ou réseau sans abonnés de ce type) est renvoyé `null` :
 * on ne l'estime pas.
 */
import raw from '../../data/ei-nat.json';
import { P } from './params';

export type Fall = 'L16' | 'V16' | 'V20a' | 'V20' | 'V25' | 'V25b';
export const FALL: Fall[] = ['L16', 'V16', 'V20', 'V25'];
/** Consommation annuelle de chaque cas type d'Ei, kWh. */
export const FALL_KWH = raw.kwh as Record<Fall, number>;
export const FALL_SAKRING: Record<Fall, number> = { L16: 16, V16: 16, V20a: 20, V20: 20, V25: 25, V25b: 25 };

interface Cas { myndighet: number | null; fast: number | null; rorlig: number[]; total: number; punkter: number | null }
interface Enhet { rel: string; foretag: string; grupp: string; cas: Partial<Record<Fall, Record<string, Cas>>> }
export const ENHETER = (raw.enheter as unknown as Enhet[]).map((e, i) => ({ ...e, id: i, namn: e.grupp ? `${e.foretag}, ${e.grupp}` : e.foretag }));
export type NatEnhet = (typeof ENHETER)[number];

export interface NatTariff {
  /** Redevances d'autorités + abonnement, kr/an hors moms. */
  fastKrPerAr: number;
  /** Prix variable effectif, öre/kWh hors moms : (total − fixes) / kWh du cas, donc pondéré si deux prix. */
  rorligOre: number;
  /** Total annuel du cas type, kr hors moms. */
  totalKrPerAr: number;
  /** Prix variables publiés (un ou deux), öre/kWh hors moms. */
  priser: number[];
  myndighet: number;
  ar: number;
}

/** Tarif d'une zone de réseau pour un cas type et une année (2026 par défaut), ou null si Ei ne le donne pas. */
export function natTariff(e: NatEnhet, fall: Fall, ar = 2026): NatTariff | null {
  const c = e.cas[fall]?.[String(ar)];
  if (!c || !c.total || c.fast === null) return null;
  // Ei avertit que pour 2026 certains réseaux ont déclaré les anciennes redevances d'autorités (105,45 kr)
  // et d'autres les nouvelles (139,89 kr, décision du 29 janvier 2026 rétroactive au 1er janvier) : on
  // remplace la valeur déclarée par la redevance en vigueur de l'année, pour comparer à égalité.
  const deklarerad = c.myndighet ?? 0;
  const myndighet = (P.nat.myndighetsavgifter_kr as Record<string, number>)[String(ar)] ?? deklarerad;
  const kwh = FALL_KWH[fall];
  const rorligOre = ((c.total - deklarerad - c.fast) / kwh) * 100;
  const fastKrPerAr = myndighet + c.fast;
  return { fastKrPerAr, rorligOre, totalKrPerAr: fastKrPerAr + (rorligOre * kwh) / 100, priser: c.rorlig, myndighet, ar };
}

/** Coût annuel du réseau pour une consommation donnée, kr hors moms (fixe + variable effectif × kWh). */
export const natKostnad = (t: NatTariff, kwhPerAr: number) => t.fastKrPerAr + (t.rorligOre * kwhPerAr) / 100;

/** Zones qui ont un tarif 2026 pour ce cas, triées par coût total annuel croissant. */
export function rangordna(fall: Fall, ar = 2026) {
  return ENHETER.map((e) => ({ e, t: natTariff(e, fall, ar) })).filter((x): x is { e: NatEnhet; t: NatTariff } => !!x.t).sort((a, b) => a.t.totalKrPerAr - b.t.totalKrPerAr);
}
export function median(xs: number[]) { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; }
/** Place d'une zone dans le classement (1 = la moins chère) et taille du classement. */
export function placering(e: NatEnhet, fall: Fall) {
  const r = rangordna(fall);
  return { plats: r.findIndex((x) => x.e.id === e.id) + 1, av: r.length, median: median(r.map((x) => x.t.totalKrPerAr)) };
}
/** Recherche d'une zone par nom d'entreprise et, si donné, de groupe (insensible à la casse). */
export function hittaEnhet(foretag: string, grupp = ''): NatEnhet | undefined {
  const f = foretag.toLowerCase(), g = grupp.toLowerCase();
  return ENHETER.find((e) => e.foretag.toLowerCase().includes(f) && (!g || e.grupp.toLowerCase().includes(g)) && Object.values(e.cas).some((c) => c && c['2026']?.total));
}
