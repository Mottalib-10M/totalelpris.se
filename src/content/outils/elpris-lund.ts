import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Lund : nätområde LUN (Kraftringen Nät AB, SE4, Nätområden.se) ; tarif Ei « Kraftringen Nät AB » (une seule ligne pour ses huit zones). */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const NIVAER = [1000, 2000, 3500, 5000];
const L = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Kraftringen')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const spot = M.varde('rorligt', 'SE4', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const niva = NIVAER.map((kwh) => ({ kwh, m: M.manadskostnad({ kwh: kwh / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo }) }));
  const man = niva[1].m;
  const pl = M.placering(e, 'L16');
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, pl: M.placering(e, k) }));
  const hojn = M.ENHETER.map((x) => { const a = M.natTariff(x, 'L16', 2025), b = M.natTariff(x, 'L16'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const okning = t.totalKrPerAr / f.totalKrPerAr - 1;
  const fler = hojn.filter((x) => x > okning).length;
  const dyrare = pl.av - pl.plats;
  return { mo, t, f, spot, p, niva, man, pl, rader, okning, fler, hojn: hojn.length, dyrare, fastAndel: t.fastKrPerAr / t.totalKrPerAr, med: pl.median * mo };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A', V16: 'Villa 16 A', V20: 'Villa 20 A', V25: 'Villa 25 A' }, en: { L16: 'Flat 16 A', V16: 'House 16 A', V20: 'House 20 A', V25: 'House 25 A' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-lund',
  group: 'stad',
  order: 80,
  tool: 'pris',
  toolProps: { nat: 'Kraftringen', zon: 'SE4', fall: 'L16' },
  related: ['elpris-se4', 'jamfor-natavgift', 'elpris-malmo', 'natavgift', 'kostnad-torktumlare'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-lund',
    nav: 'Lund',
    card: 'Elpriset i Lund, där Kraftringens höga abonnemang styr räkningen.',
    title: 'Elpris Lund 2026: Kraftringens nätavgift och pris per kWh',
    description: 'Elpris i Lund 2026: SE4 och Kraftringens elnät, ett av landets dyraste för lägenheter tack vare ett högt abonnemang. Se ditt pris per kWh och din månadsräkning.',
    h1: 'Elpris i Lund med Kraftringens elnät',
    intro: 'Lund ligger i elområde SE4 och nätområdet ägs av Kraftringen Nät AB.',
    resume: (h) => {
      const v = L(h);
      return `${h.kr(v.man.total)} i månaden blir elräkningen för en lundalägenhet med 16 ampere och 2 000 kWh om året när elhandeln kostar som SCB:s snitt för rörligt avtal i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} utan moms. Kraftringen Nät AB äger nätområdet Lund enligt Svenska kraftnäts Nätområden.se, och området ligger i SE4. Hos Energimarknadsinspektionen hör Kraftringen till de dyraste näten för lägenheter: ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, plats ${v.pl.plats} av ${v.pl.av}, där bara ${v.dyrare} nät kostar mer. Det är abonnemanget som driver priset. ${h.pct(v.fastAndel)} av nätkostnaden är fast, medan överföringsavgiften bara är ${h.ore(v.t.priser[0])} exklusive moms. Mellan 2025 och ${h.P.year} steg lägenhetens nätkostnad med ${h.pct(v.okning)}. Med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms blir snittpriset ${h.ore(v.man.snittOre)} allt inräknat. Skriv in dagens spotpris i kalkylatorn för att se vad nästa kilowattimme kostar dig.`;
    },
    faqs: (h) => {
      const v = L(h);
      return [
        { q: 'Varför är nätavgiften så hög i Lund?', a: `Energimarknadsinspektionens siffror visar var kostnaden ligger: abonnemang och myndighetsavgifter för en lägenhet med 16 ampere är ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms, långt över de flesta nät, medan överföringen per kWh är låg. Bolagets skäl till prissättningen finns inte i myndighetens data, så vi redovisar bara beloppen. Medianen för lägenheter är ${h.kr(v.med)}.` },
        { q: 'Vilka orter har samma elnät som Lund?', a: `Enligt Nätområden.se äger Kraftringen Nät AB åtta nätområden i SE4: Lund, Lomma, Höör, Klippan, Ringsjö, Björnekulla, Hallabro och Torsås. Energimarknadsinspektionen har en enda rad för Kraftringen Nät AB, så typfallen gäller hela nätet. Staffanstorp har däremot ett eget nät, Staffanstorps Energi AB, med en annan prislista.` },
        { q: 'Hur mycket höjde Kraftringen nätavgiften 2026?', a: `För lägenheten med 16 ampere steg nätkostnaden från ${h.kr(v.f.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året inklusive moms, alltså ${h.pct(v.okning)}. Av ${v.hojn} nät med lägenhetspris båda åren höjde bara ${v.fler} mer i procent. Både abonnemanget och överföringsavgiften gick upp, och myndighetsavgifterna steg för alla nät.` },
        { q: 'Lönar det sig att använda mindre el i Lund?', a: `Mindre än man kan tro. Nätets fasta del betalas oavsett, så en sparad kilowattimme sänker bara elhandeln, överföringen och skatten, i dag omkring ${h.ore(v.p.total)} med moms. Snittpriset per kWh stiger i stället när förbrukningen sjunker: en lägenhet som använder 1 000 kWh om året betalar ${h.ore(v.niva[0].m.snittOre)} i snitt allt inräknat.` },
      ];
    },
    body: (h) => {
      const v = L(h);
      return `<h2>Snittpriset i Lund sjunker ju mer el du använder</h2>
${h.table(['Förbrukning per år', 'Räkning per månad', 'Snittpris allt inräknat'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.m.total), h.ore(x.m.snittOre)]), `Lägenhet 16 A, Kraftringens tariff ${h.P.year}, elhandel SCB rörligt SE4 ${mn(h, h.M.SENASTE_MANAD)}, energiskatt och moms. Elhandlarens eventuella månadsavgift ingår inte.`, ['l', 'r', 'r'])}
<p>Mönstret är tydligare i Lund än i de flesta städer eftersom nästan hela nätkostnaden är fast. En student i en liten lägenhet med låg förbrukning får ett mycket högt pris per kilowattimme, medan ett hushåll som använder mer delar abonnemanget på fler kWh. Den rörliga delen per kilowattimme, ${h.ore(v.p.total)} med moms, är i stället lägre än i Malmö.</p>
<h2>Kraftringens fyra typfall</h2>
${h.table(['Typfall', 'Fast per år', 'Rörligt pris 1', 'Rörligt pris 2', 'Plats'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0]), x.t.priser.length > 1 ? h.ore(x.t.priser[1]) : 'ett pris', `${x.pl.plats} av ${x.pl.av}`]), `Kraftringen Nät AB ${h.P.year}. Fast avgift inkl. moms; rörliga priser exkl. moms så som Energimarknadsinspektionen redovisar dem. Plats 1 = billigast.`, ['l', 'r', 'r', 'r', 'r'])}
<p>För villorna med 20 och 25 ampere har myndighetens tabell två fält för rörligt pris. Hos Kraftringen står samma belopp i båda, så i praktiken gäller ett enda pris per kWh. Villorna hamnar lika långt ned i rangordningen som lägenheten.</p>
<h2>Lund mot grannarna i SE4</h2>
<p>Elhandeln kostar lika mycket i hela SE4, så det är nätet som skiljer Lund från ${h.a('elpris-malmo', 'Malmö')}, där E.ON tar betalt per kWh i stället för i abonnemanget. Hur nätavgiften är uppbyggd förklaras under ${h.a('natavgift', 'nätavgiften')}, och alla nät finns i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}. För en tung apparat som ${h.a('kostnad-torktumlare', 'torktumlaren')} är det spotpriset som avgör mest i Lund.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-lund',
    nav: 'Lund',
    card: 'Electricity price in Lund, where Kraftringen’s high subscription drives the bill.',
    title: 'Electricity Price Lund 2026: Kraftringen Grid Fee per kWh',
    description: 'Electricity price in Lund 2026: SE4 and Kraftringen’s grid, one of the dearest for flats because of a high subscription. Find your price per kWh and bill.',
    h1: 'Electricity price in Lund on Kraftringen’s grid',
    intro: 'Lund is in bidding zone SE4, and the grid area belongs to Kraftringen Nät AB.',
    resume: (h) => {
      const v = L(h);
      return `${h.kr(v.man.total)} a month is the power bill for a Lund flat on a 16 A main fuse using 2,000 kWh a year, when retail energy costs the Statistics Sweden (SCB) variable-contract average for SE4 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. Kraftringen Nät AB owns the Lund grid area according to Svenska kraftnät’s Nätområden.se, and the area is in SE4. In the Energy Markets Inspectorate’s data Kraftringen is among the dearest grids for flats: ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, rank ${v.pl.plats} of ${v.pl.av}, with only ${v.dyrare} grids costing more. The subscription (abonnemang, the fixed grid charge) drives this: ${h.pct(v.fastAndel)} of the grid cost is fixed, while the transfer fee is just ${h.ore(v.t.priser[0])} before VAT. Between 2025 and ${h.P.year} the flat’s grid cost rose ${h.pct(v.okning)}. With energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT, the average comes to ${h.ore(v.man.snittOre)} all in. Enter today’s spot price to see what your next unit costs.`;
    },
    faqs: (h) => {
      const v = L(h);
      return [
        { q: 'Why is the grid fee so high in Lund?', a: `The regulator’s figures show where the cost sits: subscription plus authority charges for a 16 A flat come to ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT, far above most grids, while transfer per kWh is low. The company’s reasons for its pricing are not in the regulator’s data, so we report the amounts only. The median for flats is ${h.kr(v.med)}.` },
        { q: 'Which places share Lund’s power grid?', a: `According to Nätområden.se, Kraftringen Nät AB owns eight grid areas in SE4: Lund, Lomma, Höör, Klippan, Ringsjö, Björnekulla, Hallabro and Torsås. The Energy Markets Inspectorate has a single line for Kraftringen Nät AB, so the standard cases cover the whole grid. Staffanstorp, by contrast, has its own grid company, Staffanstorps Energi AB, with a separate price list.` },
        { q: 'How much did Kraftringen raise its grid fee in 2026?', a: `For the 16 A flat, the grid cost rose from ${h.kr(v.f.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year including VAT, or ${h.pct(v.okning)}. Of ${v.hojn} grids with a flat price in both years, only ${v.fler} raised theirs by a larger percentage. Both the subscription and the transfer fee went up, and authority charges rose for every grid.` },
        { q: 'Does cutting usage pay off in Lund?', a: `Less than you might expect. The fixed grid part is due regardless, so a saved kilowatt-hour only trims energy, transfer and tax, currently around ${h.ore(v.p.total)} with VAT. The average price per kWh rises as usage falls: a flat using 1,000 kWh a year pays ${h.ore(v.niva[0].m.snittOre)} on average, everything included.` },
      ];
    },
    body: (h) => {
      const v = L(h);
      return `<h2>In Lund the average price falls the more you use</h2>
${h.table(['Use per year', 'Bill per month', 'Average price all in'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.m.total), h.ore(x.m.snittOre)]), `Flat 16 A, Kraftringen tariff ${h.P.year}, SCB variable energy price SE4 ${mn(h, h.M.SENASTE_MANAD)}, energy tax and VAT. Any monthly retailer fee is not included.`, ['l', 'r', 'r'])}
<p>The pattern is sharper in Lund than in most cities because nearly all of the grid cost is fixed. A student in a small flat with low usage pays a very high price per kilowatt-hour, while a household using more spreads the subscription over more units. The variable part per kilowatt-hour, ${h.ore(v.p.total)} with VAT, is on the other hand lower than in Malmö.</p>
<h2>Kraftringen’s four standard cases</h2>
${h.table(['Standard case', 'Fixed per year', 'Variable price 1', 'Variable price 2', 'Rank'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0]), x.t.priser.length > 1 ? h.ore(x.t.priser[1]) : 'single price', `${x.pl.plats} of ${x.pl.av}`]), `Kraftringen Nät AB ${h.P.year}. Fixed charge incl. VAT; variable prices excl. VAT as the Energy Markets Inspectorate reports them. Rank 1 = cheapest.`, ['l', 'r', 'r', 'r', 'r'])}
<p>For the 20 and 25 A houses, the regulator’s table has two fields for the variable price. Kraftringen enters the same amount in both, so in practice a single price per kWh applies. The houses sit as far down the ranking as the flat does.</p>
<h2>Lund against its SE4 neighbours</h2>
<p>Retail energy costs the same across SE4, so it is the grid that separates Lund from ${h.a('elpris-malmo', 'Malmö')}, where E.ON charges per kWh rather than through the subscription. How a grid fee (nätavgift) is built is explained under ${h.a('natavgift', 'the grid fee')}, and every grid appears in the ${h.a('jamfor-natavgift', 'grid fee comparison')}. For a heavy appliance such as the ${h.a('kostnad-torktumlare', 'tumble dryer')}, it is the spot price that matters most in Lund.</p>`;
    },
  },
});
