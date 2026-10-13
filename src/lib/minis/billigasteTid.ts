/** Mini : valeur annuelle d'un déplacement régulier de consommation (prix moyen de la fenêtre habituelle contre fenêtre la moins chère). */
import type { MiniSpec } from '../mini-types';
import { T, kr, ore, type L } from './_kit';
import { P } from '../engine/params';

export default (l: L): MiniSpec => ({
  title: T(l, 'Vad är det värt att välja billigaste tiden varje dag?', 'What is choosing the cheapest time every day worth?'),
  cta: T(l, 'Hitta billigaste starttiden imorgon', 'Find tomorrow’s cheapest start time'),
  inputs: [
    { id: 'vanlig', label: T(l, 'Snittpris när du brukar köra, öre/kWh', 'Average price when you usually run, öre/kWh'), def: 120, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'billig', label: T(l, 'Snittpris i billigaste fönstret, öre/kWh', 'Average in the cheapest window, öre/kWh'), def: 60, unit: 'öre', max: 2000, decimals: 1 },
    { id: 'kwh', label: T(l, 'kWh per dag som kan flyttas', 'kWh a day that can move'), def: 5, unit: 'kWh', max: 500, decimals: 1 },
  ],
  run: ({ vanlig, billig, kwh }) => {
    const diff = Math.max(0, vanlig - billig) * (1 + P.skatt.moms);
    return {
      head: [T(l, 'Värde per år, med moms', 'Value per year, with VAT'), kr((diff * kwh * 365) / 100, l)],
      rows: [
        [T(l, 'Skillnad per kWh med moms', 'Gap per kWh with VAT'), ore(diff, l)],
        [T(l, 'Per dag', 'Per day'), kr((diff * kwh) / 100, l, 2)],
        [T(l, 'Per månad', 'Per month'), kr((diff * kwh * 365) / 1200, l)],
      ],
      note: T(l, 'Spotpriser exkl. moms som du själv anger. Gäller bara med kvartsprisavtal.', 'Spot prices before VAT that you enter. Only applies on a quarter-hour contract.'),
    };
  },
});
