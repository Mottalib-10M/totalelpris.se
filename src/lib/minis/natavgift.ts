/** Mini : coût annuel du réseau = fixe + transfert × kWh, avec la moms ; montants saisis depuis sa propre facture. */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad kostar ditt elnät på ett år?', 'What does your grid cost in a year?'),
  cta: T(l, 'Jämför med alla nätområden', 'Compare with every grid area'),
  inputs: [
    { id: 'kwh', label: T(l, 'Förbrukning per år', 'Consumption per year'), def: 5000, unit: 'kWh', max: 200000 },
    { id: 'fast', label: T(l, 'Fast avgift per år, exkl. moms', 'Fixed fee per year, excl. VAT'), def: 2500, unit: 'kr', max: 100000 },
    { id: 'over', label: T(l, 'Överföringsavgift, öre/kWh exkl. moms', 'Transfer fee, öre/kWh excl. VAT'), def: 25, unit: 'öre', max: 300, decimals: 1 },
  ],
  run: ({ kwh, fast, over }) => {
    const mo = 1 + P.skatt.moms;
    const ar = (fast + (over * kwh) / 100) * mo;
    return {
      head: [T(l, 'Nätavgift per år inkl. moms', 'Grid fee per year incl. VAT'), kr(ar, l)],
      rows: [
        [T(l, 'Per månad', 'Per month'), kr(ar / 12, l)],
        [T(l, 'Snitt per kWh, bara nätet', 'Average per kWh, grid only'), kwh > 0 ? ore((ar * 100) / kwh, l) : '–'],
        [T(l, 'Varav fast del', 'Of which fixed part'), kr(fast * mo, l)],
      ],
      note: T(l, 'Energiskatten tillkommer på nätfakturan.', 'Energy tax comes on top on the grid bill.'),
    };
  },
});
