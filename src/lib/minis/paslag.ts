/** Mini : ce que coûtent par an un påslag (öre/kWh) et une redevance mensuelle de l'elhandlare, moms comprise. */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad kostar påslaget och månadsavgiften per år?', 'What do the mark-up and monthly fee cost per year?'),
  cta: T(l, 'Lägg in påslaget i elpriskalkylen', 'Add the mark-up in the price calculator'),
  inputs: [
    { id: 'kwh', label: T(l, 'Förbrukning per år', 'Consumption per year'), def: 5000, unit: 'kWh', max: 200000 },
    { id: 'paslag', label: T(l, 'Påslag, öre/kWh exkl. moms', 'Mark-up, öre/kWh excl. VAT'), def: 5, unit: 'öre', max: 100, decimals: 1 },
    { id: 'man', label: T(l, 'Månadsavgift, kr inkl. moms', 'Monthly fee, SEK incl. VAT'), def: 39, unit: 'kr', max: 1000 },
  ],
  run: ({ kwh, paslag, man }) => {
    const p = (kwh * paslag * (1 + P.skatt.moms)) / 100;
    return {
      head: [T(l, 'Påslag och avgift per år', 'Mark-up and fee per year'), kr(p + man * 12, l)],
      rows: [
        [T(l, 'Påslag inkl. moms', 'Mark-up incl. VAT'), kr(p, l)],
        [T(l, 'Månadsavgifter', 'Monthly fees'), kr(man * 12, l)],
        [T(l, 'Per kWh allt inräknat', 'Per kWh all in'), kwh > 0 ? ore(((p + man * 12) * 100) / kwh, l) : '–'],
      ],
    };
  },
});
