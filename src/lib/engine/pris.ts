/**
 * Moteur du prix final de l'électricité (fonctions pures, RECETTE §4). Tous les montants en öre/kWh
 * HORS moms à l'entrée ; la moms s'applique à la fin sur chaque composante (spot, påslag, nät,
 * energiskatt), comme sur la facture. Taux et barèmes : data/params-2026.json, jamais en dur.
 */
export interface PrisDelar {
  spot: number; paslag: number; natOverforing: number; energiskatt: number;
  /** Moms sur l'ensemble, en öre/kWh. */
  moms: number;
  /** Prix variable total TTC, öre/kWh. */
  total: number;
}

/** Prix variable payé par kWh, TTC. `momsSats` = 0,25. Un spot négatif reste négatif (la moms aussi). */
export function totalpris(o: { spot: number; paslag?: number; natOverforing?: number; energiskatt: number; momsSats: number }): PrisDelar {
  const paslag = o.paslag ?? 0, nat = o.natOverforing ?? 0;
  const exkl = o.spot + paslag + nat + o.energiskatt;
  const moms = exkl * o.momsSats;
  return { spot: o.spot, paslag, natOverforing: nat, energiskatt: o.energiskatt, moms, total: exkl + moms };
}

/** Un prix TTC publié par un gestionnaire (« inkl. moms ») ramené hors moms. */
export const exklMoms = (inkl: number, momsSats: number) => inkl / (1 + momsSats);
export const inklMoms = (exkl: number, momsSats: number) => exkl * (1 + momsSats);

/** Coût en couronnes d'une quantité d'énergie à un prix TTC en öre/kWh. */
export const kostnadKr = (kwh: number, orePerKwh: number) => (kwh * orePerKwh) / 100;

export interface Manad {
  /** Partie variable (handel + nät + skatt + moms), kr. */
  rorlig: number;
  /** Abonnements (nät + handel), kr par mois, TTC. */
  fast: number;
  /** Redevance de puissance, kr par mois, TTC. */
  effekt: number;
  total: number;
  /** Prix moyen tout compris, öre/kWh. */
  snittOre: number;
}

/** Facture d'un mois : kWh × prix variable TTC + abonnements TTC + éventuelle redevance de puissance. */
export function manadskostnad(o: { kwh: number; prisTotalOre: number; natFastKrPerAr: number; handelFastKrPerManad?: number; effektKw?: number; effektKrPerKw?: number }): Manad {
  const rorlig = kostnadKr(o.kwh, o.prisTotalOre);
  const fast = o.natFastKrPerAr / 12 + (o.handelFastKrPerManad ?? 0);
  const effekt = (o.effektKw ?? 0) * (o.effektKrPerKw ?? 0);
  const total = rorlig + fast + effekt;
  return { rorlig, fast, effekt, total, snittOre: o.kwh > 0 ? (total / o.kwh) * 100 : 0 };
}

/** Énergie prise au réseau pour recharger une batterie de `fran` à `till` % (pertes de charge comprises). */
export function laddning(o: { batteriKwh: number; franPct: number; tillPct: number; laddeffektKw: number; forlustPct: number }) {
  const delta = Math.max(0, Math.min(100, o.tillPct) - Math.max(0, o.franPct));
  const iBatteriet = (o.batteriKwh * delta) / 100;
  const franNatet = o.forlustPct >= 100 ? 0 : iBatteriet / (1 - o.forlustPct / 100);
  const timmar = o.laddeffektKw > 0 ? franNatet / o.laddeffektKw : 0;
  return { iBatteriet, franNatet, timmar };
}
