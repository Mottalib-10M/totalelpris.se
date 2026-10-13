/** Mini : elstöd 2026 = min(förbrukning jan + feb, tak) × belopp för elområdet (regeringen, Försäkringskassan). */
import type { MiniSpec } from '../mini-types';
import { T, kr, num, zonOptions, type L } from './_kit';
import { P } from '../engine/params';
import { ZONER } from '../engine/scb';

export default (l: L): MiniSpec => ({
  title: T(l, 'Hur mycket elstöd gav januari och februari 2026?', 'How much support did January and February 2026 give?'),
  cta: T(l, 'Räkna ut ditt totalpris idag', 'Work out your all-in price today'),
  inputs: [
    { id: 'kwh', label: T(l, 'Förbrukning januari + februari 2026', 'Use in January + February 2026'), def: 6400, unit: 'kWh', max: 100000 },
    { id: 'zon', label: T(l, 'Elområde', 'Bidding zone'), def: 2, options: zonOptions() },
  ],
  run: ({ kwh, zon }) => {
    const z = ZONER[zon] ?? 'SE3';
    const ore = (P.elstod.ore_per_kwh as Record<string, number>)[z];
    const raknas = Math.min(Math.max(0, kwh), P.elstod.tak_kwh);
    return {
      head: [T(l, 'Elstöd att få', 'Support payable'), kr((raknas * ore) / 100, l)],
      rows: [
        [T(l, 'Belopp per kWh i ', 'Amount per kWh in ') + z, `${num(ore, l)} öre`],
        [T(l, 'kWh som räknas (tak)', 'kWh counted (cap)'), `${num(raknas, l)} / ${num(P.elstod.tak_kwh, l)}`],
        [T(l, 'Avtal med elnätsföretaget den', 'Grid contract held on'), '2026-02-28'],
      ],
      note: T(l, 'Betalades ut av Försäkringskassan från juni 2026, utan ansökan.', 'Paid by Försäkringskassan from June 2026, with no application.'),
    };
  },
});
