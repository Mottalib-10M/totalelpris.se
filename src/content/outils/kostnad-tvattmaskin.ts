import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Tvättmaskin : 0,5 à 1 kWh par lavage eco (Energimyndigheten), coût selon zone et réseau. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const a = P.apparater.tvattmaskin;
  const e = M.hittaEnhet('Göteborg Energi')!;
  const t = M.natTariff(e, 'L16')!;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const per = (kwh: number) => M.kostnadKr(kwh, p.total);
  const ar = (kwh: number, ggr: number) => per(kwh) * ggr * 52;
  return { a, p, per, ar, spot };
};

export default defineGuide({
  id: 'kostnad-tvattmaskin',
  group: 'apparat',
  order: 10,
  tool: 'apparat',
  toolProps: { apparat: 'tvattmaskin', nat: 'Göteborg Energi', zon: 'SE3', fall: 'L16' },
  related: ['kostnad-torktumlare', 'kostnad-diskmaskin', 'billigaste-tiden', 'kvartspris', 'elpris-goteborg'],
  sources: ['emSpara', 'scbElpriser', 'eiNat'],
  sv: {
    slug: 'kostnad-tvattmaskin',
    nav: 'Tvättmaskin',
    card: 'Vad en tvätt kostar i el, per gång och per år.',
    title: 'Tvättmaskin elförbrukning 2026: vad en tvätt kostar i el',
    description: 'Vad kostar en tvätt i el 2026? Ecoprogrammet drar 0,5 till 1 kWh enligt Energimyndigheten. Räkna ut kostnaden per tvätt och per år med ditt elpris och nät.',
    h1: 'Tvättmaskinens elförbrukning: vad en tvätt kostar',
    intro: 'En tvätt i ecoprogrammet drar mindre el än många tror. Priset per kWh avgör resten.',
    resume: (h) => {
      const v = V(h);
      return `En tvätt i tvättmaskinens ecoprogram drar 0,5 till 1 kWh, beroende på maskinens ålder och energiklass, enligt Energimyndigheten. Med ett totalpris på ${h.ore(v.p.total)}, som en lägenhet i Göteborg betalar med SCB:s snittpris för rörligt avtal i SE3, Göteborg Energis nätavgift, energiskatt och moms, kostar en tvätt mellan ${h.kr(v.per(v.a.min_kwh), 2)} och ${h.kr(v.per(v.a.max_kwh), 2)} i el. Tvättar du fyra gånger i veckan blir det ${h.kr(v.ar(v.a.max_kwh, 4))} om året med det övre värdet. Energimyndigheten påpekar också att det lönar sig att fylla maskinen. Program med högre temperatur och kortare tid drar mer än eco, men hur mycket står i maskinens bruksanvisning eller på energimärkningen. Ange din maskins förbrukning, hur ofta du tvättar och ditt eget elpris i kalkylatorn, så ser du kostnaden per tvätt och per år.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Var hittar jag hur mycket el min tvättmaskin drar?', a: 'På energimärkningen och i bruksanvisningen. Märkningen anger förbrukningen för ecoprogrammet, ofta som kWh per 100 tvättar; dela då med 100 för att få kWh per tvätt. Andra program drar mer eller mindre beroende på temperatur och tid. Energimyndigheten anger 0,5 till 1 kWh per tvätt i eco.' },
        { q: 'Lönar det sig att tvätta på natten?', a: `Bara om du har kvartsprisavtal. Då betalar du spotpriset för den kvart maskinen går, och skillnaden mellan en dyr och en billig kvart kan vara stor. Men med 1 kWh per tvätt blir även en skillnad på 100 öre i spotpris bara ${h.kr(1.25, 2)} per tvätt. Med rörligt månadspris eller fast pris spelar tiden ingen roll för fakturan.` },
        { q: 'Kostar det mer att tvätta i en lägenhet än i en villa?', a: 'Energin per tvätt är densamma, men priset per kWh kan skilja. Det beror på elområdet, ditt nätföretags överföringsavgift och ditt elavtal, inte på bostadstypen i sig. Välj ditt nätområde i kalkylatorn för att få ditt eget pris per kWh, och därmed kostnaden för just din tvätt.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 2, 4, 7].map((g) => [`${g} ${g === 1 ? 'gång' : 'gånger'}`, h.kr(v.ar(v.a.min_kwh, g)), h.kr(v.ar(v.a.max_kwh, g))]);
      return `<h2>Kostnad per år efter hur ofta du tvättar</h2>
${h.table(['Tvättar per vecka', 'Vid 0,5 kWh per tvätt', 'Vid 1 kWh per tvätt'], rows, `Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE3 lägenhet, Göteborg Energi Nät, energiskatt. Energi per tvätt enligt Energimyndigheten.`, ['l', 'r', 'r'])}
<p>Även för en familj som tvättar varje dag blir elen för tvätten en liten del av räkningen. Det som avgör mest är förbrukningen per tvätt, alltså maskinens energiklass och vilket program du väljer, och om maskinen är full. Två halvfulla tvättar drar ungefär dubbelt så mycket som en full.</p>
<h2>När tvättmaskinen och torktumlaren hör ihop</h2>
<p>Energimyndigheten anger att ett torkprogram i torktumlaren drar två till tre gånger mer energi än tvättmaskinen. Den som torkar varje tvätt i tumlaren betalar alltså mer för torkningen än för tvätten. Se ${h.a('kostnad-torktumlare', 'torktumlarens kostnad')} och ${h.a('kostnad-diskmaskin', 'diskmaskinens')} för samma beräkning.</p>
<h2>Tidpunkten och ditt avtal</h2>
<p>Har du ett ${h.a('kvartspris', 'kvartsprisavtal')} kan du klistra in dagens priser i kalkylatorn och se när tvätten blir billigast att starta. Effekten är liten per tvätt men den finns. Har du rörligt eller fast pris påverkar starttiden inte fakturan, och då är det bättre att bara se till att maskinen är full. Mer om hur du hittar billiga perioder i ${h.a('billigaste-tiden', 'billigaste tiden för el')}.</p>`;
    },
  },
  en: {
    slug: 'washing-machine-running-cost',
    nav: 'Washing machine',
    card: 'What a wash costs in electricity, per load and per year.',
    title: 'Washing Machine Electricity Cost 2026: Price of One Wash',
    description: 'What does a wash cost in electricity in Sweden, 2026? The eco programme uses 0.5 to 1 kWh per the Swedish Energy Agency. Cost per load and per year, your price.',
    h1: 'Washing machine electricity use: what one wash costs',
    intro: 'A wash on the eco programme uses less power than many think. The price per kWh decides the rest.',
    resume: (h) => {
      const v = V(h);
      return `A wash on a washing machine’s eco programme uses 0.5 to 1 kWh depending on the machine’s age and energy class, according to the Swedish Energy Agency (Energimyndigheten). At an all-in price of ${h.ore(v.p.total)}, which a flat in Gothenburg pays at the Statistics Sweden average variable price for SE3 with Göteborg Energi’s grid fee, energy tax and VAT, one wash costs between ${h.kr(v.per(v.a.min_kwh), 2)} and ${h.kr(v.per(v.a.max_kwh), 2)} in electricity. Washing four times a week comes to ${h.kr(v.ar(v.a.max_kwh, 4))} a year at the upper figure. The agency also points out that filling the drum pays off. Hotter, shorter programmes use more than eco, but how much is in the manual or on the energy label. Enter your machine’s use, how often you wash and your own price per kWh to see the cost per wash and per year.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Where do I find how much power my washing machine uses?', a: 'On the energy label and in the manual. The label states eco-programme consumption, often as kWh per 100 cycles; divide by 100 for kWh per wash. Other programmes use more or less depending on temperature and duration. The Swedish Energy Agency gives 0.5 to 1 kWh per wash on eco.' },
        { q: 'Does washing at night save money in Sweden?', a: `Only on a quarter-hour contract, where you pay the spot price for the quarters the machine runs, and the gap between expensive and cheap quarters can be large. But at 1 kWh per wash even a 100 öre spot gap is just ${h.kr(1.25, 2)} per wash. On a variable monthly or fixed price, timing does not change the bill.` },
        { q: 'Does washing cost more in a flat than in a house?', a: 'The energy per wash is the same, but the price per kWh can differ. That depends on your bidding zone, your grid company’s transfer fee and your contract, not on the type of home as such. Choose your grid area in the calculator to get your own price per kWh, and so the cost of your own wash.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 2, 4, 7].map((g) => [`${g} ${g === 1 ? 'wash' : 'washes'}`, h.kr(v.ar(v.a.min_kwh, g)), h.kr(v.ar(v.a.max_kwh, g))]);
      return `<h2>Cost per year by how often you wash</h2>
${h.table(['Washes per week', 'At 0.5 kWh per wash', 'At 1 kWh per wash'], rows, `All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE3 flat, Göteborg Energi Nät, energy tax. Energy per wash per the Swedish Energy Agency.`, ['l', 'r', 'r'])}
<p>Even for a family washing every day, electricity for laundry is a small part of the bill. What matters most is the energy per wash, meaning the machine’s energy class, the programme you choose and whether the drum is full. Two half loads use roughly twice as much as one full load.</p>
<h2>When the washer and the dryer go together</h2>
<p>The Swedish Energy Agency says a tumble-dryer cycle uses two to three times more energy than the washing machine. If you tumble-dry every load, drying costs more than washing. See the ${h.a('kostnad-torktumlare', 'tumble dryer cost')} and the ${h.a('kostnad-diskmaskin', 'dishwasher’s')} for the same calculation.</p>
<h2>Timing and your contract</h2>
<p>On a ${h.a('kvartspris', 'quarter-hour contract')} you can paste today’s prices into the calculator and see when a wash is cheapest to start. The gain per wash is small but real. On a variable or fixed price the start time does not change the bill, so making sure the drum is full matters more. More on finding cheap periods in ${h.a('billigaste-tiden', 'the cheapest time for electricity')}.</p>`;
    },
  },
});
