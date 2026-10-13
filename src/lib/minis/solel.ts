/** Mini : valeur d'un kWh solaire autoconsommé (prix final évité) contre un kWh vendu (prix d'achat saisi), sans réduction d'impôt depuis 2026. */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';
import { totalpris } from '../engine/pris';

export default (l: L): MiniSpec => ({
  title: T(l, 'Använda solelen själv eller sälja den?', 'Use your solar power or sell it?'),
  cta: T(l, 'Räkna ut ditt totalpris per kWh', 'Work out your all-in price per kWh'),
  inputs: [
    { id: 'spot', label: T(l, 'Spotpris när solen lyser, öre/kWh', 'Spot price when the sun shines, öre/kWh'), def: 50, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'salj', label: T(l, 'Vad köparen betalar dig, öre/kWh', 'What the buyer pays you, öre/kWh'), def: 45, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'kwh', label: T(l, 'Överskott per år', 'Surplus per year'), def: 3000, unit: 'kWh', max: 100000 },
  ],
  run: ({ spot, salj, kwh }) => {
    const sparad = totalpris({ spot, natOverforing: 25, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms }).total;
    return {
      head: [T(l, 'Mer värt att använda själv, per år', 'Extra value of using it yourself, per year'), kr(((sparad - salj) * kwh) / 100, l)],
      rows: [
        [T(l, 'Värde av egen kWh (undvikt totalpris)', 'Value of a kWh used (all-in price avoided)'), ore(sparad, l)],
        [T(l, 'Värde av såld kWh', 'Value of a kWh sold'), ore(salj, l)],
        [T(l, 'Skattereduktion 2026', 'Tax reduction 2026'), T(l, 'slopad', 'abolished')],
      ],
      note: T(l, 'Egen förbrukning räknad med 25 öre överföring, energiskatt och moms. Ersättningen för såld el står i ditt avtal.', 'Own use valued with a 25 öre transfer fee, energy tax and VAT. Payment for sold power is in your contract.'),
    };
  },
});
