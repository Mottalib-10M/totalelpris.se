/** Mini : ce que l'energiskatt et la moms coûtent par an pour une consommation donnée, taux normal ou réduit. */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Hur mycket energiskatt betalar du på ett år?', 'How much energy tax do you pay in a year?'),
  cta: T(l, 'Räkna ut hela totalpriset', 'Work out the full all-in price'),
  inputs: [
    { id: 'kwh', label: T(l, 'Förbrukning per år', 'Consumption per year'), def: 5000, unit: 'kWh', max: 100000 },
    { id: 'sankt', label: T(l, 'Kommun med sänkt skatt?', 'Municipality with reduced tax?'), def: 0, options: [{ value: '0', label: T(l, 'Nej', 'No') }, { value: '1', label: T(l, 'Ja', 'Yes') }] },
  ],
  run: ({ kwh, sankt }) => {
    const sats = sankt ? P.skatt.energiskatt_sankt_ore : P.skatt.energiskatt_ore;
    const skatt = (kwh * sats) / 100;
    const moms = skatt * P.skatt.moms;
    const forr = (kwh * (P.skatt.energiskatt_2025_ore - (sankt ? P.skatt.norrlandsavdrag_ore : 0)) * (1 + P.skatt.moms)) / 100;
    return {
      head: [T(l, 'Energiskatt med moms per år', 'Energy tax with VAT per year'), kr(skatt + moms, l)],
      rows: [
        [T(l, 'Skattesats exkl. moms', 'Rate before VAT'), ore(sats, l)],
        [T(l, 'Varav moms på skatten', 'Of which VAT on the tax'), kr(moms, l)],
        [T(l, 'Samma förbrukning med 2025 års skatt', 'Same use at the 2025 rate'), kr(forr, l)],
        [T(l, 'Sänkningen ger dig', 'The cut saves you'), kr(forr - skatt - moms, l)],
      ],
    };
  },
});
