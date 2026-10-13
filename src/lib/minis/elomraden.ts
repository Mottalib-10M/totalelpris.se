/** Mini : la même consommation dans deux elområden, au prix SCB « rörligt » du dernier mois (villa sans chauffage électrique). */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, zonOptions, type L } from './_kit';
import { P } from '../engine/params';
import { varde, ZONER, type Zon } from '../engine/scb';

export default (l: L): MiniSpec => ({
  title: T(l, 'Samma förbrukning i två elområden', 'The same use in two bidding zones'),
  cta: T(l, 'Se elpriset per månad', 'See prices by month'),
  inputs: [
    { id: 'kwh', label: T(l, 'Förbrukning per år', 'Consumption per year'), def: 5000, unit: 'kWh', max: 100000 },
    { id: 'a', label: T(l, 'Elområde A', 'Zone A'), def: 0, options: zonOptions() },
    { id: 'b', label: T(l, 'Elområde B', 'Zone B'), def: 3, options: zonOptions() },
  ],
  run: ({ kwh, a, b }) => {
    const za = (ZONER[a] ?? 'SE1') as Zon, zb = (ZONER[b] ?? 'SE4') as Zon;
    const pa = varde('rorligt', za, '2') ?? 0, pb = varde('rorligt', zb, '2') ?? 0;
    const mo = 1 + P.skatt.moms;
    return {
      head: [T(l, `Skillnad per år, ${zb} mot ${za}`, `Difference per year, ${zb} vs ${za}`), kr(((pb - pa) * mo * kwh) / 100, l)],
      rows: [
        [`${za}, ${T(l, 'rörligt inkl. moms', 'variable incl. VAT')}`, ore(pa * mo, l)],
        [`${zb}, ${T(l, 'rörligt inkl. moms', 'variable incl. VAT')}`, ore(pb * mo, l)],
      ],
      note: T(l, 'SCB:s senaste månadspris för villa utan elvärme. Skatt och nät räknas inte, de beror inte på elområdet.', 'Statistics Sweden’s latest monthly price, house without electric heating. Tax and grid are left out: they do not depend on the zone.'),
    };
  },
});
