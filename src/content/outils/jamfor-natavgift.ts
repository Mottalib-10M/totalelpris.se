import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Jämför nätavgift : classement des zones de réseau du relevé Ei, quatre cas types, médiane et écarts. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const fall = ['L16', 'V16', 'V20', 'V25'] as const;
  const rad = fall.map((f) => {
    const r = M.rangordna(f);
    return { f, n: r.length, min: r[0], max: r[r.length - 1], med: M.median(r.map((x) => x.t.totalKrPerAr)) };
  });
  const v20 = rad[2];
  const okn = M.ENHETER.map((e) => { const a = M.natTariff(e, 'V20', 2025), b = M.natTariff(e, 'V20'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const hojde = okn.filter((x) => x > 0).length;
  const medOkn = M.median(okn);
  const vf = M.natTariff(M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!, 'V20')!;
  const vfPl = M.placering(M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!, 'V20');
  return { mo, rad, v20, okn: okn.length, hojde, medOkn, vf, vfPl, antal: M.rangordna('L16').length };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };

export default defineGuide({
  id: 'jamfor-natavgift',
  group: 'nat',
  order: 10,
  tool: 'nat',
  toolProps: { nat: 'Vattenfall Eldistribution|Syd', fall: 'V20' },
  related: ['natavgift', 'effektavgift', 'ellevio', 'vattenfall-eldistribution', 'eon-energidistribution'],
  sources: ['eiNat', 'eiOppna', 'natomraden'],
  sv: {
    slug: 'jamfor-natavgift',
    nav: 'Jämför nätavgift',
    card: 'Alla nätområden i Energimarknadsinspektionens sammanställning, rangordnade.',
    title: 'Jämför nätavgift 2026: alla elnät rangordnade efter pris',
    description: 'Jämför nätavgift 2026: Energimarknadsinspektionens priser för över 130 nätområden, lägenhet och villa, billigast till dyrast med moms. Se var ditt elnät hamnar.',
    h1: 'Jämför nätavgiften: var ditt elnät hamnar bland alla nätområden',
    intro: 'Nätföretaget kan du inte välja, men du kan se om ditt nät är dyrt. Energimarknadsinspektionen samlar alla priser.',
    resume: (h) => {
      const v = V(h);
      return `Nätavgiften för en elvärmd villa med 20 ampere och 20 000 kWh om året kostar mellan ${h.kr(v.v20.min.t.totalKrPerAr * v.mo)} och ${h.kr(v.v20.max.t.totalKrPerAr * v.mo)} med moms, beroende på var i Sverige huset står. Det visar Energimarknadsinspektionens sammanställning av nätföretagens avgifter per den 1 januari ${h.P.year}, där ${h.num(v.v20.n)} nätområden har ett pris för det typfallet. Medianen är ${h.kr(v.v20.med * v.mo)}. För en lägenhet finns pris för ${h.num(v.antal)} nätområden. Skillnaderna beror inte på elområdet utan på nätföretaget: två grannkommuner kan ha helt olika nätavgift. Välj ditt nätföretag i verktyget, välj typfall och ange din förbrukning, så ser du årskostnaden, priset per kWh, din plats i rangordningen och hur mycket avgiften ändrats sedan 2025. Energiskatten ingår inte, eftersom den är densamma i alla nät utom i kommunerna med avdrag i norr.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Kan jag byta elnätsföretag om mitt är dyrt?', a: 'Nej. Elnätet är ett naturligt monopol: det finns bara ett nät där du bor, och nätföretaget har ensamrätt i sitt område. Därför granskar Energimarknadsinspektionen nätföretagens intäkter. Det du kan välja är elhandlaren och avtalet, samt säkringsstorleken om din förbrukning tillåter en mindre säkring.' },
        { q: 'Hur många nätföretag höjde avgiften till 2026?', a: `Av de ${h.num(v.okn)} nätområden som har ett pris för villa med 20 ampere både 2025 och ${h.P.year} hade ${h.num(v.hojde)} en högre årskostnad ${h.P.year}. Medianändringen var ${h.pct(v.medOkn)}. En del av höjningen är myndighetsavgifterna, som gick från ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms.` },
        { q: 'Varför saknas mitt nätföretag för villa?', a: 'Energimarknadsinspektionens typfall räknar en årskostnad bara när tariffen går att räkna på det sättet. För flera nätföretag, bland dem Ellevio och Göteborg Energi, saknas totalbeloppet för villa i tabellen. Det gäller ofta nät med effektavgift, men orsaken framgår inte av tabellen. Vi visar då inget i stället för att gissa; lägenhetsfallet finns ofta kvar.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rad.map((r) => [NAMN.sv[r.f], h.num(r.n), `${h.kr(r.min.t.totalKrPerAr * v.mo)}`, h.kr(r.med * v.mo), h.kr(r.max.t.totalKrPerAr * v.mo)]);
      return `<h2>Spännvidden för fyra typfall</h2>
${h.table(['Typfall', 'Nätområden', 'Billigast', 'Median', 'Dyrast'], rows, `Energimarknadsinspektionen, nätföretagens avgifter för hushållskunder ${h.P.year}, kr per år inkl. moms. Myndighetsavgifter ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exkl. moms för alla.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Det dyraste nätet kostar ungefär tre gånger så mycket som det billigaste, eller mer, i alla fyra typfallen. ${v.v20.min.e.namn} har den lägsta avgiften för en elvärmd villa med 20 ampere och ${v.v20.max.e.namn} den högsta. Vattenfall Eldistributions lokalnät, ett av de största, hamnar på plats ${h.num(v.vfPl.plats)} av ${h.num(v.vfPl.av)} med ${h.kr(v.vf.totalKrPerAr * v.mo)} om året.</p>
<h2>Så läser du rangordningen</h2>
<p>Energimarknadsinspektionen samlar varje år in avgifterna från alla nätföretag för samma typkunder, så att de går att jämföra. Totalbeloppet är fast avgift plus myndighetsavgifter plus rörlig avgift gånger typfallets förbrukning. Vi lägger på moms och ersätter myndighetsavgifterna med det belopp som gäller ${h.P.year}, eftersom en del företag hann rapportera det gamla beloppet.</p>
<p>Ett nät som är billigt för lägenheter kan vara dyrt för villor, och tvärtom, eftersom företagen fördelar kostnaderna olika mellan säkringsstorlekarna. Byt typfall i verktyget för att se det.</p>
<h2>Det som inte syns i jämförelsen</h2>
<p>Typfallen beskriver inte alla tariffer. En effektavgift, där du betalar för den högsta effekten under månaden, ingår bara om den finns i typfallet; läs mer i ${h.a('effektavgift', 'guiden om effektavgift')}. Nätföretag kan också ändra priset under året. Grunderna för hur avgiften är uppbyggd står i ${h.a('natavgift', 'nätavgiften förklarad')}, och de tre största nätföretagen har egna sidor: ${h.a('ellevio', 'Ellevio')}, ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution')} och ${h.a('eon-energidistribution', 'E.ON Energidistribution')}.</p>`;
    },
  },
  en: {
    slug: 'compare-grid-fees',
    nav: 'Compare grid fees',
    card: 'Every grid area in the Energy Markets Inspectorate’s data, ranked.',
    title: 'Compare Grid Fees Sweden 2026: Every Grid Ranked by Price',
    description: 'Compare grid fees in Sweden, 2026: regulator prices for over 130 grid areas, flat and house, cheapest to dearest with VAT. See where your own grid ranks.',
    h1: 'Compare grid fees: where your grid ranks among all areas',
    intro: 'You cannot choose your grid company, but you can see whether it is expensive. The regulator collects every price.',
    resume: (h) => {
      const v = V(h);
      return `The grid fee (nätavgift) for an electrically heated 20 A house using 20,000 kWh a year ranges from ${h.kr(v.v20.min.t.totalKrPerAr * v.mo)} to ${h.kr(v.v20.max.t.totalKrPerAr * v.mo)} with VAT, depending on where in Sweden the house stands. That is the Energy Markets Inspectorate’s (Ei) compilation of grid companies’ charges on 1 January ${h.P.year}, in which ${h.num(v.v20.n)} grid areas have a price for that case. The median is ${h.kr(v.v20.med * v.mo)}. For a flat, ${h.num(v.antal)} grid areas have a price. The differences come from the grid company, not the bidding zone: two neighbouring towns can have very different fees. Pick your grid company in the tool, choose a standard case and enter your consumption to see the yearly cost, the price per kWh, your rank and how much the fee changed since 2025. Energy tax is left out, since it is the same on every grid except in the northern municipalities with a deduction.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Can I switch grid company if mine is expensive?', a: 'No. The grid is a natural monopoly: there is only one network where you live, and the grid company has the sole right to operate in its area, which is why the Energy Markets Inspectorate oversees its revenue. What you can choose is the retailer and the contract, and your main fuse size if your use allows a smaller one.' },
        { q: 'How many grid companies raised their fees for 2026?', a: `Of the ${h.num(v.okn)} grid areas with a price for a 20 A house in both 2025 and ${h.P.year}, ${h.num(v.hojde)} had a higher annual cost in ${h.P.year}. The median change was ${h.pct(v.medOkn)}. Part of the rise is the authority charges, up from ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT.` },
        { q: 'Why is my grid company missing for houses?', a: 'The regulator’s standard cases only give an annual total where the tariff can be computed that way. For several grid companies, Ellevio and Göteborg Energi among them, the house total is missing from the table. That often concerns grids with a power charge, but the table does not give the reason. We then show nothing rather than guess; the flat case is often still there.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rad.map((r) => [NAMN.en[r.f], h.num(r.n), h.kr(r.min.t.totalKrPerAr * v.mo), h.kr(r.med * v.mo), h.kr(r.max.t.totalKrPerAr * v.mo)]);
      return `<h2>The spread for four standard cases</h2>
${h.table(['Standard case', 'Grid areas', 'Cheapest', 'Median', 'Dearest'], rows, `Energy Markets Inspectorate, grid companies’ household charges ${h.P.year}, SEK a year incl. VAT. Authority charges ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT for all.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The dearest grid costs roughly three times the cheapest, or more, in all four cases. ${v.v20.min.e.namn} has the lowest fee for an electrically heated 20 A house and ${v.v20.max.e.namn} the highest. Vattenfall Eldistribution’s local grid, one of the largest, ranks ${h.num(v.vfPl.plats)} of ${h.num(v.vfPl.av)} at ${h.kr(v.vf.totalKrPerAr * v.mo)} a year.</p>
<h2>How to read the ranking</h2>
<p>Every year the regulator collects every grid company’s charges for the same standard customers so they can be compared. The total is the fixed fee plus authority charges plus the variable fee times the case’s consumption. We add VAT and replace the authority charges with the ${h.P.year} amount, because some companies reported the old figure.</p>
<p>A grid that is cheap for flats can be dear for houses, and the reverse, because companies spread their costs differently across fuse sizes. Switch the standard case in the tool to see it.</p>
<h2>What the comparison does not show</h2>
<p>Standard cases do not describe every tariff. A power charge (effektavgift), where you pay for your highest load in the month, is included only if it is in the case; see the guide to ${h.a('effektavgift', 'power charges')}. Grid companies may also change prices during the year. How the fee is built is explained in ${h.a('natavgift', 'the grid fee explained')}, and the three largest grid companies have their own pages: ${h.a('ellevio', 'Ellevio')}, ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution')} and ${h.a('eon-energidistribution', 'E.ON Energidistribution')}.</p>`;
    },
  },
});
