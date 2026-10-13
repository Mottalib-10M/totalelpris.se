import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Torktumlare : 1,5 à 3 kWh par cycle, deux à trois fois le lave-linge (Energimyndigheten) ; exemple en SE4, Öresundskraft. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const a = P.apparater.torktumlare, tv = P.apparater.tvattmaskin;
  const e = M.hittaEnhet('Öresundskraft')!;
  const t = M.natTariff(e, 'V16')!;
  const spot = M.varde('rorligt', 'SE4', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const per = (kwh: number) => M.kostnadKr(kwh, p.total);
  const spot1 = M.varde('rorligt', 'SE1', '2')!;
  const p1 = M.totalpris({ spot: spot1, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const per1 = (kwh: number) => M.kostnadKr(kwh, p1.total);
  return { a, tv, p, per, p1, per1, ggr: a.ggr_vecka };
};

export default defineGuide({
  id: 'kostnad-torktumlare',
  group: 'apparat',
  order: 20,
  tool: 'apparat',
  toolProps: { apparat: 'torktumlare', nat: 'Öresundskraft', zon: 'SE4', fall: 'V16' },
  related: ['kostnad-tvattmaskin', 'elpris-helsingborg', 'effektavgift', 'kvartspris', 'elpris-se4'],
  sources: ['emSpara', 'scbElpriser', 'eiNat'],
  sv: {
    slug: 'kostnad-torktumlare',
    nav: 'Torktumlare',
    card: 'Vad en torkning kostar och varför tumlaren drar mer än tvätten.',
    title: 'Torktumlare elförbrukning 2026: vad en torkning kostar',
    description: 'Torktumlare och el 2026: ett torkprogram drar 1,5 till 3 kWh, två till tre gånger mer än tvätten, enligt Energimyndigheten. Räkna ut kostnaden per gång och år.',
    h1: 'Torktumlarens elförbrukning: vad en torkning kostar',
    intro: 'Torktumlaren är ofta den tvättapparat som drar mest el. Så mycket kostar den med ditt elpris.',
    resume: (h) => {
      const v = V(h);
      return `Ett torkprogram i torktumlaren drar 1,5 till 3 kWh beroende på maskinens ålder och energiklass, och tumlaren använder två till tre gånger mer energi än tvättmaskinen, enligt Energimyndigheten. I en villa i Helsingborg med Öresundskrafts elnät och SCB:s snittpris för rörligt avtal i SE4 kostar varje kilowattimme ${h.ore(v.p.total)} med skatt och moms. En torkning kostar då mellan ${h.kr(v.per(v.a.min_kwh), 2)} och ${h.kr(v.per(v.a.max_kwh), 2)}. Torkar familjen tre gånger i veckan med det övre värdet blir det ${h.kr(v.per(v.a.max_kwh) * v.ggr * 52)} om året. Samma torkning i SE1 hade kostat ${h.kr(v.per1(v.a.max_kwh), 2)} med samma nätavgift, så elområdet spelar roll. Kalkylatorn räknar med din egen tumlare, hur ofta du torkar och ditt nätområde, och kan visa den billigaste starttiden om du klistrar in dagens priser från elhandlaren.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Varför drar torktumlaren så mycket mer än tvättmaskinen?', a: `Tumlaren ska förånga vattnet i tvätten med värme, medan tvättmaskinen främst värmer vattnet till tvättemperaturen. Energimyndigheten anger ${h.num(v.a.min_kwh, 1)} till ${h.num(v.a.max_kwh)} kWh per torkprogram mot ${h.num(v.tv.min_kwh, 1)} till ${h.num(v.tv.max_kwh)} kWh per tvätt i eco, alltså två till tre gånger så mycket. Hög centrifugering i tvättmaskinen ger mindre vatten kvar att torka.` },
        { q: 'Påverkar torktumlaren min effektavgift?', a: 'Den kan göra det, om ditt nätföretag tar betalt för den högsta effekten under månaden och tumlaren går samtidigt som andra stora apparater, till exempel spisen eller laddningen av elbilen. Sprid ut användningen. Hur effekten mäts står i nätföretagets prislista; läs mer i vår guide om effektavgift.' },
        { q: 'Är det billigare att torka tvätten på natten?', a: `Med kvartsprisavtal kan det vara det, om nattens kvartar är billigare den dagen; klistra in priserna och se. Med ${h.num(v.a.max_kwh)} kWh per torkning ger en skillnad på 100 öre i spotpris ${h.kr(v.a.max_kwh * 1.25, 2)} per gång. Med rörligt månadspris eller fast pris påverkar tiden inte fakturan.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 3, 5].map((g) => [`${g} ${g === 1 ? 'gång' : 'gånger'}`, h.kr(v.per(v.a.min_kwh) * g * 52), h.kr(v.per(v.a.max_kwh) * g * 52)]);
      return `<h2>Årskostnad för torkningen i Helsingborg</h2>
${h.table(['Torkningar per vecka', 'Vid 1,5 kWh', 'Vid 3 kWh'], rows, `Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE4 villa utan elvärme, Öresundskraft Elnät, energiskatt. Energi per torkning enligt Energimyndigheten.`, ['l', 'r', 'r'])}
<p>Skillnaden mellan det låga och det höga värdet är en faktor två, och den kommer från maskinen: en äldre tumlare i lägre energiklass ligger nära det övre värdet. Byter du maskin syns det på elräkningen, särskilt om du torkar ofta. Står förbrukningen på energimärkningen, skriv in den i kalkylatorn i stället för standardvärdet.</p>
<h2>Tumlaren i en elvärmd villa</h2>
<p>I en villa som värms med el går en del av tumlarens värme ut i rummet. På vintern ersätter den då en del av uppvärmningen, men den värme som går ut genom ventilationen är förlorad. Hur stor nettokostnaden blir beror på huset och syns inte i en enkel kalkyl. Räkna därför med hela tumlarens förbrukning som kostnad, så blir uppskattningen hellre för hög än för låg.</p>
<h2>Kvartspris, effekt och timer</h2>
<p>Med ${h.a('kvartspris', 'kvartsprisavtal')} kan du klistra in dagens priser och se när torkningen blir billigast att starta, med programmets längd som tidsfönster. Med ${h.a('effektavgift', 'effektavgift')} är det klokt att inte låta tumlaren gå samtidigt som andra stora laster. Jämför med ${h.a('kostnad-tvattmaskin', 'tvättmaskinens kostnad')} för samma tvätt.</p>`;
    },
  },
  en: {
    slug: 'tumble-dryer-running-cost',
    nav: 'Tumble dryer',
    card: 'What one drying cycle costs, and why the dryer uses more than the washer.',
    title: 'Tumble Dryer Electricity Cost 2026: Price of One Cycle',
    description: 'Tumble dryer running cost in Sweden, 2026: a cycle uses 1.5 to 3 kWh, two to three times the washer, per the Swedish Energy Agency. Cost per cycle and year.',
    h1: 'Tumble dryer electricity use: what one cycle costs',
    intro: 'The tumble dryer is often the laundry appliance that uses the most power. Here is what it costs at your price.',
    resume: (h) => {
      const v = V(h);
      return `A tumble-dryer cycle uses 1.5 to 3 kWh depending on the machine’s age and energy class, and the dryer uses two to three times more energy than the washing machine, according to the Swedish Energy Agency. In a house in Helsingborg on Öresundskraft’s grid, at the Statistics Sweden average variable price for SE4, each kilowatt-hour costs ${h.ore(v.p.total)} with tax and VAT. One cycle then costs between ${h.kr(v.per(v.a.min_kwh), 2)} and ${h.kr(v.per(v.a.max_kwh), 2)}. Drying three times a week at the upper figure comes to ${h.kr(v.per(v.a.max_kwh) * v.ggr * 52)} a year. The same cycle in SE1 would have cost ${h.kr(v.per1(v.a.max_kwh), 2)} on the same grid fee, so the bidding zone matters. The calculator works with your own dryer, how often you dry and your grid area, and can show the cheapest start time if you paste today’s prices.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Why does the dryer use so much more than the washer?', a: `The dryer has to evaporate the water in the laundry with heat, while the washer mainly heats water to the wash temperature. The Swedish Energy Agency gives ${h.num(v.a.min_kwh, 1)} to ${h.num(v.a.max_kwh)} kWh per drying cycle against ${h.num(v.tv.min_kwh, 1)} to ${h.num(v.tv.max_kwh)} kWh per eco wash, two to three times as much. A high spin speed leaves less water to dry.` },
        { q: 'Does the tumble dryer affect my power charge?', a: 'It can, if your grid company bills your highest load in the month and the dryer runs alongside other large appliances such as the hob or the car charger. Spread the use out. How the load is measured is in your grid company’s price list; more in our guide to power charges.' },
        { q: 'Is it cheaper to dry laundry at night?', a: `On a quarter-hour contract it can be, if that night’s quarters are cheaper; paste the prices and see. At ${h.num(v.a.max_kwh)} kWh per cycle, a 100 öre spot gap is worth ${h.kr(v.a.max_kwh * 1.25, 2)} per cycle. On a variable monthly or fixed price, timing does not change the bill.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 3, 5].map((g) => [`${g} ${g === 1 ? 'cycle' : 'cycles'}`, h.kr(v.per(v.a.min_kwh) * g * 52), h.kr(v.per(v.a.max_kwh) * g * 52)]);
      return `<h2>Yearly drying cost in Helsingborg</h2>
${h.table(['Cycles per week', 'At 1.5 kWh', 'At 3 kWh'], rows, `All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE4 house without electric heating, Öresundskraft Elnät, energy tax. Energy per cycle per the Swedish Energy Agency.`, ['l', 'r', 'r'])}
<p>The low and high figures differ by a factor of two, and the difference comes from the machine: an older dryer in a lower energy class sits near the upper value. Replacing it shows on the bill, especially if you dry often. If the energy label gives the consumption, enter it in the calculator instead of the default.</p>
<h2>The dryer in an electrically heated house</h2>
<p>In a house heated by electricity, part of the dryer’s heat escapes into the room. In winter it then replaces some heating, but heat leaving through the ventilation is lost. How large the net cost is depends on the house and does not show in a simple calculation, so count the dryer’s full consumption as a cost; the estimate is then on the high side rather than the low.</p>
<h2>Quarter-hour prices, power and timers</h2>
<p>On a ${h.a('kvartspris', 'quarter-hour contract')} you can paste today’s prices and see when drying is cheapest to start, using the programme length as the window. With a ${h.a('effektavgift', 'power charge')} it is wise not to run the dryer alongside other large loads. Compare with the ${h.a('kostnad-tvattmaskin', 'washing machine’s cost')} for the same load.</p>`;
    },
  },
});

