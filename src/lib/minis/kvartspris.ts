/** Mini : économie d'un déplacement de consommation d'un quart d'heure cher vers un quart d'heure bon marché (prix saisis). */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad sparar du på att flytta förbrukning?', 'What do you save by shifting use?'),
  cta: T(l, 'Klistra in dagens priser i kalkylatorn', 'Paste today’s prices into the calculator'),
  inputs: [
    { id: 'dyr', label: T(l, 'Dyr kvart, spotpris öre/kWh', 'Expensive quarter, spot öre/kWh'), def: 150, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'billig', label: T(l, 'Billig kvart, spotpris öre/kWh', 'Cheap quarter, spot öre/kWh'), def: 30, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'kwh', label: T(l, 'kWh som flyttas per vecka', 'kWh moved per week'), def: 20, unit: 'kWh', max: 2000 },
  ],
  run: ({ dyr, billig, kwh }) => {
    const diff = (dyr - billig) * (1 + P.skatt.moms);
    return {
      head: [T(l, 'Besparing per år, med moms', 'Saving per year, with VAT'), kr((diff * kwh * 52) / 100, l)],
      rows: [
        [T(l, 'Skillnad per kWh med moms', 'Difference per kWh with VAT'), ore(diff, l)],
        [T(l, 'Per vecka', 'Per week'), kr((diff * kwh) / 100, l, 2)],
        [T(l, 'Skatt och nät per kWh', 'Tax and grid per kWh'), T(l, 'oförändrade', 'unchanged')],
      ],
      note: T(l, 'Gäller bara med kvartsprisavtal. Med rörligt månadspris eller fast pris ändras inte fakturan.', 'Only on a quarter-hour contract. On a monthly variable or fixed price the bill does not change.'),
    };
  },
});
