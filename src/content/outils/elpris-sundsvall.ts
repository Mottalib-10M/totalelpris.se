import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Sundsvall : nätområde SUV « Sundsvall tätort » (Sundsvall Elnät AB, SE2, Nätområden.se). Västernorrland : avdrag
 *  seulement à Sollefteå, Ånge, Örnsköldsvik (LSE 11 kap. 4 §), donc taux normal. Angle : prix par fusible, lägenhet vs villa. */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const S = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Sundsvall Elnät')!;
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, f: M.natTariff(e, k, 2025)!, pl: M.placering(e, k) }));
  const r = Object.fromEntries(rader.map((x) => [x.k, x])) as Record<(typeof FALLEN)[number], (typeof rader)[number]>;
  const t = r.V16.t;
  const spot = M.varde('rorligt', 'SE2', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 5000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const overMedian = rader.filter((x) => x.t.totalKrPerAr > x.pl.median).length;
  const hojn = M.ENHETER.map((x) => { const a = M.natTariff(x, 'V16', 2025), b = M.natTariff(x, 'V16'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const okV16 = r.V16.t.totalKrPerAr / r.V16.f.totalKrPerAr - 1;
  const okL16 = r.L16.t.totalKrPerAr / r.L16.f.totalKrPerAr - 1;
  const medHojn = M.median(hojn);
  const s = M.senaste('rorligt', 'SE2', '2', 12);
  const lag = s.reduce((a, b) => (b[1] < a[1] ? b : a)), hog = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lagKr = (2000 * (r.L16.t.rorligOre - t.rorligOre) * mo) / 100;
  return { mo, e, rader, r, t, spot, p, man, overMedian, okV16, okL16, medHojn, nHojn: hojn.length, lag, hog, lagKr, pl: r.V16.pl };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A', V16: 'Villa 16 A', V20: 'Villa 20 A', V25: 'Villa 25 A' }, en: { L16: 'Flat 16 A', V16: 'House 16 A', V20: 'House 20 A', V25: 'House 25 A' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-sundsvall',
  group: 'stad',
  order: 110,
  tool: 'pris',
  toolProps: { nat: 'Sundsvall Elnät', zon: 'SE2', fall: 'V16' },
  related: ['elpris-se2', 'jamfor-natavgift', 'elpris-umea', 'elpris-gavle', 'natavgift'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse'],
  sv: {
    slug: 'elpris-sundsvall',
    nav: 'Sundsvall',
    card: 'Elpriset i Sundsvall, där säkringen styr nätkostnaden mer än förbrukningen.',
    title: 'Elpris Sundsvall 2026: Sundsvall Elnät och pris per säkring',
    description: 'Elpris i Sundsvall 2026: SE2, full energiskatt och Sundsvall Elnät, dyrare än medianen i alla typfall. Se vad 16, 20 och 25 ampere kostar och ditt pris per kWh.',
    h1: 'Elpris i Sundsvall med Sundsvall Elnäts avgifter',
    intro: 'Sundsvalls tätort ligger i elområde SE2 och nätet ägs av Sundsvall Elnät AB.',
    resume: (h) => {
      const v = S(h);
      return `${h.ore(v.p.total)} kostar varje kilowattimme, moms inräknad, för en villa i Sundsvall med 16 ampere och rörligt avtal, räknat med SCB:s snitt för SE2 i ${mn(h, h.M.SENASTE_MANAD)}: ${h.ore(v.spot)} före moms för en villa utan elvärme. Nätområdet Sundsvall tätort ägs av Sundsvall Elnät AB och hör till SE2 enligt Svenska kraftnäts Nätområden.se. I Energimarknadsinspektionens jämförelse ligger nätet över medianen i ${v.overMedian === 4 ? 'alla fyra' : `${v.overMedian} av fyra`} typfall: villan med 16 ampere kostar ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, plats ${v.pl.plats} av ${v.pl.av}, mot en median på ${h.kr(v.pl.median * v.mo)}. Tabellen nedan visar ett särdrag. Lägenheterna betalar ${h.ore(v.r.L16.t.priser[0])} i överföringsavgift före moms, villorna ${h.ore(v.t.priser[0])}, medan abonnemanget stiger brant med säkringen. Sundsvall ligger i Västernorrlands län utan det norrländska skatteavdraget, så energiskatten är ${h.ore(h.P.skatt.energiskatt_ore)}. Med 5 000 kWh om året blir räkningen omkring ${h.kr(v.man.total)} i månaden. Skriv in dagens spotpris för att räkna om.`;
    },
    faqs: (h) => {
      const v = S(h);
      return [
        { q: 'Varför betalar lägenheter i Sundsvall mer per kWh i nätet än villor?', a: `Sundsvall Elnät redovisar ${h.ore(v.r.L16.t.priser[0])} i överföringsavgift för lägenheten och ${h.ore(v.t.priser[0])} för villorna, före moms, i Energimarknadsinspektionens data för ${h.P.year}. Skälet till uppdelningen framgår inte där. För en lägenhet med 2 000 kWh om året gör skillnaden ${h.kr(v.lagKr)} med moms, men abonnemanget är å andra sidan mycket lägre än villans.` },
        { q: 'Vad kostar det att gå från 16 till 20 ampere i Sundsvall?', a: `Den fasta nätavgiften är ${h.kr(v.r.V16.t.fastKrPerAr * v.mo)} om året med moms för 16 ampere och ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} för 20 ampere, alltså ${h.kr((v.r.V20.t.fastKrPerAr - v.r.V16.t.fastKrPerAr) * v.mo)} mer. Steget till 25 ampere kostar ytterligare ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)}. Överföringsavgiften per kWh är densamma för alla tre säkringarna, så det är bara abonnemanget som ändras.` },
        { q: 'Hur mycket höjde Sundsvall Elnät avgiften till 2026?', a: `För villan med 16 ampere steg årskostnaden från ${h.kr(v.r.V16.f.totalKrPerAr * v.mo)} till ${h.kr(v.r.V16.t.totalKrPerAr * v.mo)} med moms, ${h.pct(v.okV16)}. Lägenheten fick ${h.pct(v.okL16)}. Bland de ${v.nHojn} nät som har villapris båda åren var medianhöjningen ${h.pct(v.medHojn)}. Både abonnemanget och överföringsavgiften gick upp, och de statliga myndighetsavgifterna steg för alla nät.` },
        { q: 'Hur mycket svängde det rörliga elpriset i Sundsvall det senaste året?', a: `I SCB:s serie för villor utan elvärme i SE2 var det rörliga priset lägst i ${mn(h, v.lag[0])} med ${h.ore(v.lag[1])} och högst i ${mn(h, v.hog[0])} med ${h.ore(v.hog[1])}, före moms och med påslag. Nätavgiften och energiskatten ligger fast under året, så det är elhandeln som får räkningen att gå upp och ner mellan månaderna.` },
      ];
    },
    body: (h) => {
      const v = S(h);
      return `<h2>Sundsvall Elnät, typfall för typfall</h2>
${h.table(['Typfall', 'Fast per år inkl. moms', 'Överföring exkl. moms', 'Totalt per år inkl. moms', 'Median alla nät', 'Plats'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0]), h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.pl.median * v.mo), `${x.pl.plats} av ${x.pl.av}`]), `Sundsvall Elnät AB, Energimarknadsinspektionen ${h.P.year}. Villa 20 A och 25 A räknas med 20 000 kWh, villa 16 A med 5 000 kWh och lägenheten med 2 000 kWh. Plats 1 = billigast.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Avståndet till medianen växer med säkringen. För villan med 25 ampere är Sundsvall Elnät ${h.kr((v.r.V25.t.totalKrPerAr - v.r.V25.pl.median) * v.mo)} dyrare om året än mitten av fältet, för lägenheten ${h.kr((v.r.L16.t.totalKrPerAr - v.r.L16.pl.median) * v.mo)}. Den som har en elvärmd villa här har därför mest att vinna på att se över säkringen; en villa som klarar sig med 20 ampere slipper ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)} om året jämfört med 25.</p>
<h2>Varför lägenheten ändå betalar minst</h2>
<p>Överföringsavgiften är högre för lägenheter, men abonnemanget är ${h.kr(v.r.L16.t.fastKrPerAr * v.mo)} mot villans ${h.kr(v.r.V16.t.fastKrPerAr * v.mo)}. Med lägenhetens 2 000 kWh väger den fasta delen fortfarande tyngst, ${h.pct(v.r.L16.t.fastKrPerAr / v.r.L16.t.totalKrPerAr)} av nätkostnaden. Hur abonnemang och överföring hänger ihop förklaras under ${h.a('natavgift', 'nätavgiften')}.</p>
<h2>Sundsvall bland grannarna</h2>
<p>Spotpriset är detsamma i hela ${h.a('elpris-se2', 'SE2')}, från Sundsvall till ${h.a('elpris-umea', 'Umeå')}. Söderut ligger ${h.a('elpris-gavle', 'Gävle')} i SE3, med ett annat elområde och därmed ett annat spotpris. Alla nät finns i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}, där du kan se var just ditt nät hamnar för din säkring.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-sundsvall',
    nav: 'Sundsvall',
    card: 'Electricity price in Sundsvall, where the fuse drives the grid cost more than usage.',
    title: 'Electricity Price Sundsvall 2026: Grid Cost by Fuse Size',
    description: 'Electricity price in Sundsvall 2026: SE2, full energy tax and Sundsvall Elnät, above the median in every case. What 16, 20 and 25 A cost and your price per kWh.',
    h1: 'Electricity price in Sundsvall on Sundsvall Elnät’s grid',
    intro: 'Central Sundsvall is in bidding zone SE2, and its grid belongs to Sundsvall Elnät AB.',
    resume: (h) => {
      const v = S(h);
      return `${h.ore(v.p.total)}, VAT included, is the cost of each kilowatt-hour for a 16 A house in Sundsvall on a variable contract, using the Statistics Sweden (SCB) average for SE2 in ${mn(h, h.M.SENASTE_MANAD)}: ${h.ore(v.spot)} before VAT for a house without electric heating. The Sundsvall tätort grid area (the urban area) is owned by Sundsvall Elnät AB and lies in SE2, according to Svenska kraftnät’s Nätområden.se. In the Energy Markets Inspectorate’s comparison the grid sits above the median in ${v.overMedian === 4 ? 'all four' : `${v.overMedian} of four`} standard cases: the 16 A house costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, rank ${v.pl.plats} of ${v.pl.av}, against a median of ${h.kr(v.pl.median * v.mo)}. One quirk shows in the table below: flats pay a transfer fee of ${h.ore(v.r.L16.t.priser[0])} before VAT, houses ${h.ore(v.t.priser[0])}, while the subscription climbs steeply with the main fuse. Sundsvall is in Västernorrland county without the northern tax deduction, so energy tax is ${h.ore(h.P.skatt.energiskatt_ore)}. At 5,000 kWh a year the bill is about ${h.kr(v.man.total)} a month.`;
    },
    faqs: (h) => {
      const v = S(h);
      return [
        { q: 'Why do Sundsvall flats pay more per kWh for the grid than houses?', a: `Sundsvall Elnät reports a transfer fee of ${h.ore(v.r.L16.t.priser[0])} for the flat and ${h.ore(v.t.priser[0])} for houses, before VAT, in the regulator’s ${h.P.year} data. The reason for the split is not stated there. For a flat using 2,000 kWh a year the gap is worth ${h.kr(v.lagKr)} with VAT, but the flat’s subscription is far lower than a house’s.` },
        { q: 'What does moving from a 16 A to a 20 A fuse cost in Sundsvall?', a: `The fixed grid fee is ${h.kr(v.r.V16.t.fastKrPerAr * v.mo)} a year with VAT on 16 A and ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} on 20 A, so ${h.kr((v.r.V20.t.fastKrPerAr - v.r.V16.t.fastKrPerAr) * v.mo)} more. Going to 25 A adds another ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)}. The per-kWh transfer fee is identical for all three fuse sizes, so only the subscription changes.` },
        { q: 'How much did Sundsvall Elnät raise its fees for 2026?', a: `For the 16 A house the yearly cost rose from ${h.kr(v.r.V16.f.totalKrPerAr * v.mo)} to ${h.kr(v.r.V16.t.totalKrPerAr * v.mo)} with VAT, ${h.pct(v.okV16)}. The flat saw ${h.pct(v.okL16)}. Among the ${v.nHojn} grids with a house price in both years, the median rise was ${h.pct(v.medHojn)}. Both subscription and transfer fee went up, and the state authority charges rose for every grid.` },
        { q: 'How much did the variable price swing in Sundsvall over the past year?', a: `In the SCB series for houses without electric heating in SE2, the variable price was lowest in ${mn(h, v.lag[0])} at ${h.ore(v.lag[1])} and highest in ${mn(h, v.hog[0])} at ${h.ore(v.hog[1])}, before VAT and including the retailer’s mark-up. Grid fee and energy tax stay put through the year, so it is the energy part that moves the bill from month to month.` },
      ];
    },
    body: (h) => {
      const v = S(h);
      return `<h2>Sundsvall Elnät, case by case</h2>
${h.table(['Standard case', 'Fixed per year incl. VAT', 'Transfer excl. VAT', 'Total per year incl. VAT', 'Median all grids', 'Rank'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0]), h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.pl.median * v.mo), `${x.pl.plats} of ${x.pl.av}`]), `Sundsvall Elnät AB, Energy Markets Inspectorate ${h.P.year}. The 20 A and 25 A houses assume 20,000 kWh, the 16 A house 5,000 kWh and the flat 2,000 kWh. Rank 1 = cheapest.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The distance to the median widens with the fuse. For the 25 A house Sundsvall Elnät costs ${h.kr((v.r.V25.t.totalKrPerAr - v.r.V25.pl.median) * v.mo)} a year more than the middle of the field; for the flat, ${h.kr((v.r.L16.t.totalKrPerAr - v.r.L16.pl.median) * v.mo)}. Owners of electrically heated houses here have the most to gain from checking their main fuse (huvudsäkring): a house that manages on 20 A avoids ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)} a year compared with 25 A.</p>
<h2>Why the flat still pays least</h2>
<p>The transfer fee is higher for flats, but the subscription is ${h.kr(v.r.L16.t.fastKrPerAr * v.mo)} against ${h.kr(v.r.V16.t.fastKrPerAr * v.mo)} for the 16 A house. At the flat’s 2,000 kWh the fixed part still dominates, at ${h.pct(v.r.L16.t.fastKrPerAr / v.r.L16.t.totalKrPerAr)} of the grid cost. How subscription and transfer fit together is explained under ${h.a('natavgift', 'the grid fee')}.</p>
<h2>Sundsvall and its neighbours</h2>
<p>The spot price is the same across ${h.a('elpris-se2', 'SE2')}, from Sundsvall up to ${h.a('elpris-umea', 'Umeå')}. To the south, ${h.a('elpris-gavle', 'Gävle')} is in SE3, a different zone with a different spot price. Every grid is listed in the ${h.a('jamfor-natavgift', 'grid fee comparison')}, where you can see how yours ranks for your fuse size.</p>`;
    },
  },
});
