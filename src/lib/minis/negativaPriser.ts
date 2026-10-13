/** Mini : prix final avec un spot négatif saisi, et seuil de spot sous lequel le prix final devient négatif. */
import type { MiniSpec } from '../mini-types';
import { T, ore, type L } from './_kit';
import { P } from '../engine/params';
import { totalpris } from '../engine/pris';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad betalar du när spotpriset är under noll?', 'What do you pay when the spot price is below zero?'),
  cta: T(l, 'Räkna med ditt eget elnät', 'Calculate with your own grid'),
  inputs: [
    { id: 'minus', label: T(l, 'Spotpris under noll, minus öre/kWh', 'Spot price below zero, minus öre/kWh'), def: 10, unit: 'öre', max: 500, decimals: 1 },
    { id: 'nat', label: T(l, 'Överföringsavgift, öre/kWh exkl. moms', 'Transfer fee, öre/kWh excl. VAT'), def: 25, unit: 'öre', max: 200, decimals: 1 },
  ],
  run: ({ minus, nat }) => {
    const d = totalpris({ spot: -minus, natOverforing: nat, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
    return {
      head: [T(l, 'Ditt totalpris per kWh inkl. moms', 'Your all-in price per kWh incl. VAT'), ore(d.total, l)],
      rows: [
        [T(l, 'Spotpris', 'Spot price'), ore(-minus, l)],
        [T(l, 'Energiskatt + nät, exkl. moms', 'Energy tax + grid, excl. VAT'), ore(P.skatt.energiskatt_ore + nat, l)],
        [T(l, 'Spotpris där totalen blir noll', 'Spot price where the total hits zero'), ore(-(P.skatt.energiskatt_ore + nat), l)],
      ],
      note: T(l, 'Utan påslag. Med påslag måste spotpriset gå ännu längre ned.', 'Without mark-up. With a mark-up the spot price must fall further still.'),
    };
  },
});
