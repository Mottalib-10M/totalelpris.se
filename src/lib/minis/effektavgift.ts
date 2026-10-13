/** Mini : redevance de puissance du mois = pointe (kW) × prix (kr/kW), plus la moms ; valeurs de sa propre liste de prix. */
import type { MiniSpec } from '../mini-types';
import { T, kr, num, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad kostar effekttoppen en månad?', 'What does the monthly peak cost?'),
  cta: T(l, 'Räkna ut hela elräkningen', 'Work out the whole bill'),
  inputs: [
    { id: 'kw', label: T(l, 'Din högsta effekt (enligt nätföretaget)', 'Your peak load (per your grid company)'), def: 5, unit: 'kW', max: 100, decimals: 1 },
    { id: 'pris', label: T(l, 'Effektavgift, kr per kW exkl. moms', 'Power charge, SEK per kW excl. VAT'), def: 50, unit: 'kr', max: 2000, decimals: 1 },
  ],
  run: ({ kw, pris }) => {
    const mo = 1 + P.skatt.moms;
    const man = kw * pris * mo;
    return {
      head: [T(l, 'Effektavgift för månaden inkl. moms', 'Power charge for the month incl. VAT'), kr(man, l)],
      rows: [
        [T(l, 'En kW lägre topp sparar', 'One kW lower peak saves'), kr(pris * mo, l)],
        [T(l, 'Tolv sådana månader', 'Twelve such months'), kr(man * 12, l)],
        [T(l, 'Topp i kW', 'Peak in kW'), num(kw, l, 1)],
      ],
      note: T(l, 'Pris och mätmetod står i ditt nätföretags prislista; värdena här är exempel.', 'Price and measuring method are in your grid company’s price list; the values here are examples.'),
    };
  },
});
