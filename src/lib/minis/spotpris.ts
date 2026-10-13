/** Mini : du spot (öre/kWh exkl. moms) au prix final, avec un transfert réseau saisi, energiskatt et moms. */
import type { MiniSpec } from '../mini-types';
import { T, ore, pct, type L } from './_kit';
import { P } from '../engine/params';
import { totalpris } from '../engine/pris';

export default (l: L): MiniSpec => ({
  title: T(l, 'Från spotpris till det du betalar', 'From spot price to what you pay'),
  cta: T(l, 'Räkna med ditt eget elnät', 'Calculate with your own grid'),
  inputs: [
    { id: 'spot', label: T(l, 'Spotpris, öre/kWh exkl. moms', 'Spot price, öre/kWh excl. VAT'), def: 80, unit: 'öre', max: 1000, decimals: 1 },
    { id: 'nat', label: T(l, 'Överföringsavgift, öre/kWh exkl. moms', 'Transfer fee, öre/kWh excl. VAT'), def: 25, unit: 'öre', max: 200, decimals: 1 },
  ],
  run: ({ spot, nat }) => {
    const d = totalpris({ spot, natOverforing: nat, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
    return {
      head: [T(l, 'Totalpris per kWh inkl. moms', 'All-in price per kWh incl. VAT'), ore(d.total, l)],
      rows: [
        [T(l, 'Energiskatt', 'Energy tax'), ore(P.skatt.energiskatt_ore, l)],
        [T(l, 'Moms 25 %', 'VAT 25%'), ore(d.moms, l)],
        [T(l, 'Spotpriset med moms, andel av totalen', 'Spot with VAT, share of the total'), d.total > 0 ? pct((spot * (1 + P.skatt.moms)) / d.total, l, 0) : '–'],
      ],
    };
  },
});
