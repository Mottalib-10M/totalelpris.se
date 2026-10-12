import { describe, expect, it } from 'vitest';
import { totalpris, manadskostnad, laddning, exklMoms, inklMoms, kostnadKr } from './pris';
import { lasSerie, tillOre, statistik, billigasteFonster, klockslag } from './kvart';
import { natTariff, hittaEnhet, rangordna, FALL_KWH, ENHETER } from './nat';
import { serie, varde, jamforAvtal, SENASTE_MANAD, husPris } from './scb';
import { P } from './params';

describe('prix final', () => {
  it('moms sur toutes les composantes', () => {
    const d = totalpris({ spot: 80, paslag: 5, natOverforing: 20, energiskatt: 36, momsSats: 0.25 });
    expect(d.moms).toBeCloseTo(35.25, 6);
    expect(d.total).toBeCloseTo(176.25, 6);
  });
  it('spot négatif : le total baisse, la taxe reste', () => {
    const d = totalpris({ spot: -10, energiskatt: 36, momsSats: 0.25 });
    expect(d.total).toBeCloseTo(32.5, 6);
  });
  it('conversions de moms aller-retour', () => { expect(exklMoms(inklMoms(42, 0.25), 0.25)).toBeCloseTo(42, 9); });
  it('facture du mois', () => {
    const m = manadskostnad({ kwh: 1000, prisTotalOre: 200, natFastKrPerAr: 3600 });
    expect(m.rorlig).toBe(2000); expect(m.fast).toBe(300); expect(m.total).toBe(2300); expect(m.snittOre).toBeCloseTo(230, 9);
  });
  it('recharge : pertes et durée', () => {
    const l = laddning({ batteriKwh: 60, franPct: 20, tillPct: 80, laddeffektKw: 11, forlustPct: 10 });
    expect(l.iBatteriet).toBe(36); expect(l.franNatet).toBeCloseTo(40, 6); expect(l.timmar).toBeCloseTo(40 / 11, 6);
    expect(laddning({ batteriKwh: 60, franPct: 90, tillPct: 20, laddeffektKw: 11, forlustPct: 10 }).franNatet).toBe(0);
  });
  it('coût en couronnes', () => { expect(kostnadKr(2, 150)).toBe(3); });
});

describe('liste collée', () => {
  it('lit les heures et les décimales à virgule, ignore les en-têtes', () => {
    const s = lasSerie('Tid\tPris\n00:00 - 00:15\t42,1\n00:15 - 00:30\t40,8\n2026-10-12T00:30 39');
    expect(s.priser).toEqual([42.1, 40.8, 39]); expect(s.enhet).toBe('ore'); expect(s.avvisade).toBe(1);
  });
  it('détecte les kronor et les €/MWh', () => {
    expect(lasSerie('0,42\n0,39').enhet).toBe('kr');
    expect(tillOre(lasSerie('0,42\n0,39'))).toEqual([42, 39]);
    const e = lasSerie('Price €/MWh\n50\n-3');
    expect(e.enhet).toBe('eur-mwh'); expect(tillOre(e, 11)).toEqual([55, -3.3]);
  });
  it('96 valeurs = quarts d’heure', () => { expect(lasSerie(Array.from({ length: 96 }, (_, i) => String(i)).join('\n')).minuter).toBe(15); });
  it('min ≤ moyenne ≤ max, jamais inversés', () => {
    const p = [5, 3, 9, 1, 7];
    const s = statistik(p);
    expect(s.min).toBe(1); expect(s.minIdx).toBe(3); expect(s.max).toBe(9); expect(s.maxIdx).toBe(2);
    expect(s.min).toBeLessThanOrEqual(s.snitt); expect(s.snitt).toBeLessThanOrEqual(s.max);
  });
  it('meilleure fenêtre contiguë', () => {
    const w = billigasteFonster([10, 2, 3, 9, 1, 1, 8], 60, 120);
    expect(w.start).toBe(4); expect(w.snitt).toBe(1);
    expect(billigasteFonster([1, 2], 60, 300).start).toBe(-1);
    expect(billigasteFonster(Array(96).fill(5), 15, 60).platser).toBe(4);
  });
  it('heures affichées', () => { expect(klockslag(0, 15)).toBe('00:00'); expect(klockslag(55, 15)).toBe('13:45'); expect(klockslag(23, 60)).toBe('23:00'); });
});

describe('relevé Ei des réseaux', () => {
  it('lit plus de 130 zones de réseau avec un tarif 2026', () => { expect(rangordna('L16').length).toBeGreaterThan(130); });
  it('Umeå Energi Elnät 2026, villa 16 A 5 000 kWh : 2 189 kr et 18,1 öre (Ei), redevances 2026 de 139,89 kr', () => {
    const t = natTariff(hittaEnhet('Umeå Energi')!, 'V16')!;
    expect(t.fastKrPerAr).toBeCloseTo(139.89 + 2189, 2);
    expect(t.rorligOre).toBeCloseTo(18.1, 2);
    expect(t.totalKrPerAr).toBeCloseTo(139.89 + 2189 + 905, 2);
  });
  it('2025 : redevances de 105,45 kr', () => { expect(natTariff(hittaEnhet('Umeå Energi')!, 'V16', 2025)!.myndighet).toBe(105.45); });
  it('un cas à zéro chez Ei n’est pas estimé', () => {
    const e = ENHETER.find((x) => Object.values(x.cas).some((c) => c && c['2026'] && c['2026'].total === 0));
    if (e) { const f = (Object.keys(e.cas) as Array<keyof typeof e.cas>).find((k) => e.cas[k]?.['2026']?.total === 0)!; expect(natTariff(e, f as 'L16')).toBeNull(); }
  });
  it('les cas types ont leur consommation Ei', () => { expect(FALL_KWH.L16).toBe(2000); expect(FALL_KWH.V20).toBe(20000); });
});

describe('statistiques SCB', () => {
  it('séries mensuelles complètes depuis 2022 pour les 4 zones', () => {
    for (const z of ['SE1', 'SE2', 'SE3', 'SE4'] as const) expect(serie('rorligt', z, '2').length).toBeGreaterThan(40);
    expect(SENASTE_MANAD).toMatch(/^20\d\dM\d\d$/);
  });
  it('valeur publiée : SE3, villa sans chauffage électrique, rörligt, août 2026 = 86,9 öre (SCB, lu le 2026-10-12)', () => {
    expect(varde('rorligt', 'SE3', '2', '2026M08')).toBe(86.9);
  });
  it('la comparaison des contrats couvre 12 mois', () => { for (const x of jamforAvtal('SE3', '2', 1000)) expect(x.manader).toBe(12); });
  it('SCB 2026H1 : elskatt 36 öre pour les ménages, égale au paramètre', () => {
    expect(husPris('DC').find((x) => x.halvar === '2026H1')!.elskatt).toBe(P.skatt.energiskatt_ore);
  });
});
