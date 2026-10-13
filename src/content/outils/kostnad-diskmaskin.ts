import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Diskmaskin : programme eco 0,5 à 1 kWh et environ 10 litres d'eau (Energimyndigheten) ; exemple en SE2, Sundsvall Elnät. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const a = P.apparater.diskmaskin;
  const e = M.hittaEnhet('Sundsvall Elnät')!;
  const t = M.natTariff(e, 'V16')!;
  const spot = M.varde('rorligt', 'SE2', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const per = (kwh: number) => M.kostnadKr(kwh, p.total);
  return { a, p, per, t };
};

export default defineGuide({
  id: 'kostnad-diskmaskin',
  group: 'apparat',
  order: 30,
  tool: 'apparat',
  toolProps: { apparat: 'diskmaskin', nat: 'Sundsvall Elnät', zon: 'SE2', fall: 'V16' },
  related: ['kostnad-tvattmaskin', 'elpris-sundsvall', 'billigaste-tiden', 'elpris-se2', 'kvartspris'],
  sources: ['emSpara', 'scbElpriser', 'eiNat'],
  sv: {
    slug: 'kostnad-diskmaskin',
    nav: 'Diskmaskin',
    card: 'Vad en disk kostar i el med ecoprogrammet.',
    title: 'Diskmaskin elförbrukning 2026: vad en disk kostar i el',
    description: 'Diskmaskin och el 2026: ecoprogrammet drar 0,5 till 1 kWh och cirka 10 liter vatten per disk enligt Energimyndigheten. Räkna ut din kostnad per disk och per år.',
    h1: 'Diskmaskinens elförbrukning: vad en disk kostar',
    intro: 'Ecoprogrammet tar lång tid men drar lite el. Här ser du vad det betyder i kronor.',
    resume: (h) => {
      const v = V(h);
      return `Ecoprogrammet i en diskmaskin använder ungefär 0,5 till 1 kWh och cirka 10 liter vatten per disk, beroende på maskinens ålder och energiklass, enligt Energimyndigheten. I en villa i Sundsvall med Sundsvall Elnäts nätavgift, energiskatt och moms och SCB:s snittpris för rörligt avtal i SE2 kostar elen ${h.ore(v.p.total)} per kWh. En disk kostar då mellan ${h.kr(v.per(v.a.min_kwh), 2)} och ${h.kr(v.per(v.a.max_kwh), 2)}. Diskar du fem gånger i veckan med det övre värdet blir det ${h.kr(v.per(v.a.max_kwh) * 5 * 52)} om året. Siffrorna gäller ecoprogrammet; maskinens andra program kan dra både mer och mindre, och det står i bruksanvisningen hur mycket. Kalkylatorn räknar med din maskins förbrukning, hur ofta du diskar och ditt eget elpris; klistrar du in dagens priser föreslår den också den billigaste starttiden.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Drar ett snabbprogram mer el än eco?', a: 'Det beror på maskinen. Energimyndighetens värde på 0,5 till 1 kWh gäller ecoprogrammet, och hur mycket de andra programmen drar står i bruksanvisningen eller på energimärkningen. Skriv in det värdet i kalkylatorn om du oftast använder ett annat program, så blir kostnaden per disk rätt för ditt sätt att diska.' },
        { q: 'Är det billigare att diska i maskin än för hand?', a: 'Energimyndigheten anger att ecoprogrammet använder cirka 10 liter vatten per disk. Hur mycket varmt vatten du använder vid handdisk beror på dig, och om varmvattnet värms med el, fjärrvärme eller annat. Vi har ingen officiell jämförelse att räkna med, så kalkylatorn visar bara maskinens el.' },
        { q: 'Lönar det sig att starta diskmaskinen med timer?', a: `Med kvartsprisavtal kan en timer flytta disken till en billig period. Med ${h.num(v.a.max_kwh)} kWh per disk ger en skillnad på 100 öre i spotpris ${h.kr(v.a.max_kwh * 1.25, 2)} per gång, alltså några hundralappar om året om du diskar ofta. Med rörligt eller fast pris spelar timern ingen roll för fakturan.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [3, 5, 7, 10].map((g) => [`${g}`, h.kr(v.per(v.a.min_kwh) * g * 52), h.kr(v.per(v.a.max_kwh) * g * 52)]);
      return `<h2>Diskar per vecka och kostnad per år</h2>
${h.table(['Diskar per vecka', 'Vid 0,5 kWh', 'Vid 1 kWh'], rows, `Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE2 villa utan elvärme, Sundsvall Elnät, energiskatt. Energi per disk enligt Energimyndigheten.`, ['l', 'r', 'r'])}
<p>För de flesta hushåll är diskmaskinens el en liten post: några hundra kronor om året. Den stora skillnaden ligger mellan en äldre maskin nära det övre värdet och en nyare nära det undre, och mellan att köra full eller halvfull maskin. Två halvfulla diskar kostar dubbelt så mycket el som en full.</p>
<h2>Varmvatten och diskmaskin</h2>
<p>Kalkylatorn räknar hela maskinens förbrukning som el, eftersom diskmaskinen värmer vattnet själv om den är ansluten till kallvatten. Är din maskin ansluten till varmvatten står det i installationsanvisningen, och då kan en del av energin komma från din varmvattenberedare eller fjärrvärmen i stället.</p>
<h2>Billigaste tiden för disken</h2>
<p>Ecoprogrammet är långt, och med ${h.a('kvartspris', 'kvartsprisavtal')} spelar det roll när det börjar. Klistra in dagens priser och ange programmets längd; kalkylatorn hittar det billigaste sammanhängande fönstret. Läs mer i ${h.a('billigaste-tiden', 'billigaste tiden för el')}, och jämför med ${h.a('kostnad-tvattmaskin', 'tvättmaskinens kostnad')}.</p>`;
    },
  },
  en: {
    slug: 'dishwasher-running-cost',
    nav: 'Dishwasher',
    card: 'What one load costs in electricity on the eco programme.',
    title: 'Dishwasher Electricity Cost 2026: What One Load Costs You',
    description: 'Dishwasher running cost in Sweden, 2026: eco programme uses 0.5 to 1 kWh and about 10 litres of water per load, per the Energy Agency. Cost per load and year.',
    h1: 'Dishwasher electricity use: what one load costs',
    intro: 'The eco programme takes long but uses little power. Here is what that means in kronor.',
    resume: (h) => {
      const v = V(h);
      return `A dishwasher’s eco programme uses about 0.5 to 1 kWh and around 10 litres of water per load, depending on the machine’s age and energy class, according to the Swedish Energy Agency. In a house in Sundsvall with Sundsvall Elnät’s grid fee, energy tax and VAT, at the Statistics Sweden average variable price for SE2, power costs ${h.ore(v.p.total)} per kWh. One load then costs between ${h.kr(v.per(v.a.min_kwh), 2)} and ${h.kr(v.per(v.a.max_kwh), 2)}. Five loads a week at the upper figure come to ${h.kr(v.per(v.a.max_kwh) * 5 * 52)} a year. The figures apply to the eco programme; other programmes may use more or less, as the manual will show. The calculator uses your machine’s consumption, how often you run it and your own power price; paste today’s prices and it also suggests the cheapest start time.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Does a quick programme use more power than eco?', a: 'It depends on the machine. The Swedish Energy Agency’s 0.5 to 1 kWh applies to the eco programme, and what other programmes use is in the manual or on the energy label. Enter that figure in the calculator if you usually run another programme, so the cost per load matches the way you wash.' },
        { q: 'Is a dishwasher cheaper than washing up by hand?', a: 'The Swedish Energy Agency says the eco programme uses about 10 litres of water per load. How much hot water you use washing by hand depends on you, and on whether your hot water is heated by electricity, district heating or something else. There is no official comparison to calculate with, so the calculator shows only the machine’s electricity.' },
        { q: 'Is it worth running the dishwasher on a timer?', a: `On a quarter-hour contract a timer can move the load to a cheap period. At ${h.num(v.a.max_kwh)} kWh per load, a 100 öre spot gap is worth ${h.kr(v.a.max_kwh * 1.25, 2)} each time, a few hundred kronor a year if you run it often. On a variable or fixed price the timer does not change the bill.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [3, 5, 7, 10].map((g) => [`${g}`, h.kr(v.per(v.a.min_kwh) * g * 52), h.kr(v.per(v.a.max_kwh) * g * 52)]);
      return `<h2>Loads per week and cost per year</h2>
${h.table(['Loads per week', 'At 0.5 kWh', 'At 1 kWh'], rows, `All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE2 house without electric heating, Sundsvall Elnät, energy tax. Energy per load per the Swedish Energy Agency.`, ['l', 'r', 'r'])}
<p>For most households the dishwasher’s electricity is a small item, a few hundred kronor a year. The big difference lies between an older machine near the upper figure and a newer one near the lower, and between running it full or half empty. Two half loads cost twice the electricity of one full load.</p>
<h2>Hot water and the dishwasher</h2>
<p>The calculator counts the machine’s whole consumption as electricity, since a dishwasher on the cold supply heats its own water. If your machine is connected to the hot-water supply, the installation instructions say so, and part of the energy may then come from your water heater or the district heating instead.</p>
<h2>The cheapest time for the dishes</h2>
<p>The eco programme is long, and on a ${h.a('kvartspris', 'quarter-hour contract')} its start time matters. Paste today’s prices and enter the programme length; the calculator finds the cheapest continuous window. More in ${h.a('billigaste-tiden', 'the cheapest time for electricity')}, and compare with the ${h.a('kostnad-tvattmaskin', 'washing machine’s cost')}.</p>`;
    },
  },
});
