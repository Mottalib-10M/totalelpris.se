import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Eskilstuna : nätområde ESK (Eskilstuna Energi & Miljö Elnät AB, SE3, Nätområden.se) ; pas de cas lägenhet chez Ei.
 *  Angle : transfert inchangé 2025→2026, toute la hausse est dans la part fixe. */
const FALLEN = ['V16', 'V20', 'V25'] as const;
const E = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Eskilstuna Energi')!;
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, f: M.natTariff(e, k, 2025)!, pl: M.placering(e, k), pkt: e.cas[k]!['2026'].punkter! }));
  const r = Object.fromEntries(rader.map((x) => [x.k, x])) as Record<(typeof FALLEN)[number], (typeof rader)[number]>;
  const t = r.V16.t, f = r.V16.f;
  const oforandrad = rader.every((x) => x.t.priser[0] === x.f.priser[0]);
  const okning = t.totalKrPerAr / f.totalKrPerAr - 1;
  const hojn = M.ENHETER.map((x) => { const a = M.natTariff(x, 'V16', 2025), b = M.natTariff(x, 'V16'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const fler = hojn.filter((x) => x > okning).length;
  const spot = M.varde('rorligt', 'SE3', '2')!;
  const spot3 = M.varde('rorligt', 'SE3', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const p3 = M.totalpris({ spot: spot3, natOverforing: r.V20.t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 5000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const elvarme = (20000 * p3.total) / 100 + r.V20.t.fastKrPerAr * mo;
  const abonnHojn = (t.fastKrPerAr - t.myndighet - (f.fastKrPerAr - f.myndighet)) * mo;
  const myndHojn = (t.myndighet - f.myndighet) * mo;
  return { mo, e, rader, r, t, f, oforandrad, okning, fler, nHojn: hojn.length, spot, spot3, p, p3, man, elvarme, abonnHojn, myndHojn, pl: r.V16.pl };
};
const NAMN = { sv: { V16: 'Villa 16 A', V20: 'Villa 20 A, elvärme', V25: 'Villa 25 A, elvärme' }, en: { V16: 'House 16 A', V20: 'House 20 A, electric heating', V25: 'House 25 A, electric heating' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-eskilstuna',
  group: 'stad',
  order: 140,
  tool: 'pris',
  toolProps: { nat: 'Eskilstuna Energi', zon: 'SE3', fall: 'V16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-stockholm', 'natavgift', 'elrakning'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-eskilstuna',
    nav: 'Eskilstuna',
    card: 'Elpriset i Eskilstuna, där bara den fasta nätavgiften steg till 2026.',
    title: 'Elpris Eskilstuna 2026: villans nätavgift och pris per kWh',
    description: 'Elpris i Eskilstuna 2026: SE3 och Eskilstuna Energi och Miljös elnät, där villans nätkostnad steg 9,8 % men överföringsavgiften stod still. Räkna ut ditt pris.',
    h1: 'Elpris i Eskilstuna med Eskilstuna Energi och Miljös elnät',
    intro: 'Eskilstuna ligger i elområde SE3 och nätområdet ägs av Eskilstuna Energi & Miljö Elnät AB.',
    resume: (h) => {
      const v = E(h);
      return `${h.pct(v.okning)} dyrare blev elnätet för en villa med 16 ampere i Eskilstuna mellan 2025 och ${h.P.year}, och hela höjningen ligger i den fasta avgiften. Överföringsavgiften är ${h.ore(v.t.priser[0], 2)} före moms båda åren enligt Energimarknadsinspektionen, medan abonnemanget och myndighetsavgifterna tillsammans gick från ${h.kr(v.f.fastKrPerAr * v.mo)} till ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms. Nätområdet Eskilstuna ägs av Eskilstuna Energi & Miljö Elnät AB och ligger i SE3 enligt Svenska kraftnäts Nätområden.se. Myndigheten har inget lägenhetspris för nätet ${h.P.year}, så sidan räknar på villor. Med SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms för en villa utan elvärme, och full energiskatt på ${h.ore(h.P.skatt.energiskatt_ore)} blir totalpriset ${h.ore(v.p.total)}. En villa som använder 5 000 kWh om året får då en räkning på ungefär ${h.kr(v.man.total)} i månaden. Fyll i dagens spotpris för att se ditt eget pris.`;
    },
    faqs: (h) => {
      const v = E(h);
      return [
        { q: 'Varför finns inget lägenhetspris för Eskilstuna Energi och Miljö?', a: `I Energimarknadsinspektionens fil står noll för lägenhetsfallet hos Eskilstuna Energi och Miljö Elnät AB både 2025 och ${h.P.year}. Myndigheten anger inte skälet i tabellen, och vi uppskattar inget pris på egen hand. Bor du i lägenhet, hämta överföringsavgift och fast avgift från bolagets prislista och skriv in dem i kalkylatorn som påslag och fast kostnad.` },
        { q: 'Ändrades överföringsavgiften i Eskilstuna till 2026?', a: `Nej. ${v.oforandrad ? 'Alla tre villafallen har' : 'Villan med 16 ampere har'} ${h.ore(v.t.priser[0], 2)} före moms i Energimarknadsinspektionens uppgifter för både 2025 och ${h.P.year}. Höjningen kom i stället i abonnemanget, som för 16 ampere steg med ${h.kr(v.abonnHojn)} om året med moms, och i myndighetsavgifterna, som ökade med ${h.kr(v.myndHojn)} för alla nät. En sparad kilowattimme är alltså värd lika mycket som förra året.` },
        { q: 'Vad kostar elen per år för en elvärmd villa i Eskilstuna?', a: `Räknat på Energimarknadsinspektionens typfall med 20 ampere och 20 000 kWh, SCB:s rörliga pris för elvärmda villor i SE3 i ${mn(h, h.M.SENASTE_MANAD)} på ${h.ore(v.spot3)} och full energiskatt blir det omkring ${h.kr(v.elvarme)} om året med moms, varav ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} är fast nätavgift. Beloppet bygger på en enda månads pris, så med ett annat månadspris blir årssumman en annan.` },
        { q: 'Vilka nätområden har Eskilstuna Energi och Miljö?', a: `Enligt Svenska kraftnäts Nätområden.se äger Eskilstuna Energi & Miljö Elnät AB två nätområden, Eskilstuna och Svalboviken, båda i elområde SE3. Bor du utanför dem har du ett annat nätföretag och andra avgifter. Namnet står på nätfakturan, och på Nätområden.se kan du söka på adressen, kommunen eller nätområdets kod innan du väljer nät i kalkylatorn.` },
      ];
    },
    body: (h) => {
      const v = E(h);
      return `<h2>Villans nätkostnad 2025 och ${h.P.year}</h2>
${h.table(['Typfall', 'Fast 2025', `Fast ${h.P.year}`, 'Överföring båda åren', 'Totalt 2025', `Totalt ${h.P.year}`, 'Ändring'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.f.fastKrPerAr * v.mo), h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0], 2), h.kr(x.f.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.pct(x.t.totalKrPerAr / x.f.totalKrPerAr - 1)]), `Eskilstuna Energi och Miljö Elnät AB, Energimarknadsinspektionen. Belopp per år inkl. moms, överföring exkl. moms. Myndighetsavgifter ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'], 2)} år 2025 och ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} år ${h.P.year}.`, ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>Av ${v.nHojn} nät med villapris båda åren höjde ${v.fler} mer i procent än Eskilstuna för villan med 16 ampere. Eftersom överföringen stod still märks höjningen lika mycket för den som använder lite el som för den som använder mycket; den betalas via abonnemanget varje månad.</p>
<h2>Var Eskilstuna hamnar bland näten</h2>
${h.table(['Typfall', 'Plats', 'Kunder i typfallet'], v.rader.map((x) => [NAMN.sv[x.k], `${x.pl.plats} av ${x.pl.av}`, h.num(x.pkt)]), `Energimarknadsinspektionen ${h.P.year}, plats 1 = billigast.`, ['l', 'r', 'r'])}
<p>Ju större säkring, desto bättre placering: villan med 25 ampere hamnar på plats ${v.r.V25.pl.plats}, villan med 16 ampere på plats ${v.r.V16.pl.plats}. Hur abonnemang och överföring vägs ihop förklaras under ${h.a('natavgift', 'nätavgiften')}, och vad som står på fakturan går ${h.a('elrakning', 'elräkningen')} igenom rad för rad.</p>
<h2>Eskilstuna i SE3</h2>
<p>Spotpriset är detsamma som i ${h.a('elpris-stockholm', 'Stockholm')} och resten av ${h.a('elpris-se3', 'SE3')}, så det är nätet som skiljer. Se hur Eskilstuna Energi och Miljö står sig mot alla nät i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-eskilstuna',
    nav: 'Eskilstuna',
    card: 'Electricity price in Eskilstuna, where only the fixed grid charge rose for 2026.',
    title: 'Electricity Price Eskilstuna 2026: House Grid Fee per kWh',
    description: 'Electricity price in Eskilstuna 2026: SE3 and Eskilstuna Energi och Miljö’s grid, where house grid costs rose 9.8% but transfer fees held. Find your price.',
    h1: 'Electricity price in Eskilstuna on Eskilstuna Energi och Miljö’s grid',
    intro: 'Eskilstuna is in bidding zone SE3, and its grid area belongs to Eskilstuna Energi & Miljö Elnät AB.',
    resume: (h) => {
      const v = E(h);
      return `${h.pct(v.okning)} more is what the grid cost a 16 A house in Eskilstuna in ${h.P.year} than in 2025, and the entire rise sits in the fixed charge. The transfer fee (överföringsavgift, the per-kWh grid charge) is ${h.ore(v.t.priser[0], 2)} before VAT in both years according to the Energy Markets Inspectorate, while subscription and authority charges together went from ${h.kr(v.f.fastKrPerAr * v.mo)} to ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT. The Eskilstuna grid area belongs to Eskilstuna Energi & Miljö Elnät AB and lies in SE3, according to Svenska kraftnät’s Nätområden.se. The regulator has no flat price for this grid in ${h.P.year}, so this page works with houses. At the Statistics Sweden (SCB) variable-contract average for SE3 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT for a house without electric heating, plus full energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, the all-in price is ${h.ore(v.p.total)}. A house using 5,000 kWh a year pays roughly ${h.kr(v.man.total)} a month.`;
    },
    faqs: (h) => {
      const v = E(h);
      return [
        { q: 'Why is there no flat price for Eskilstuna Energi och Miljö?', a: `The Energy Markets Inspectorate’s file shows zero for the flat case at Eskilstuna Energi och Miljö Elnät AB in both 2025 and ${h.P.year}. The regulator does not give a reason in the table, and we do not estimate a price ourselves. If you live in a flat, take the transfer fee and fixed charge from the company’s price list and enter them in the calculator as a mark-up and a fixed cost.` },
        { q: 'Did Eskilstuna’s transfer fee change for 2026?', a: `No. ${v.oforandrad ? 'All three house cases show' : 'The 16 A house shows'} ${h.ore(v.t.priser[0], 2)} before VAT in the regulator’s data for both 2025 and ${h.P.year}. The rise came instead through the subscription, up ${h.kr(v.abonnHojn)} a year with VAT for 16 A, and the authority charges, up ${h.kr(v.myndHojn)} for every grid. A kilowatt-hour you save is worth exactly what it was last year.` },
        { q: 'What does power cost a year in an electrically heated Eskilstuna house?', a: `Using the regulator’s standard case of 20 A and 20,000 kWh, the SCB variable price for electrically heated houses in SE3 in ${mn(h, h.M.SENASTE_MANAD)} of ${h.ore(v.spot3)} and full energy tax, it comes to about ${h.kr(v.elvarme)} a year with VAT, of which ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} is the fixed grid fee. The figure rests on a single month’s price, so a different monthly price gives a different yearly total.` },
        { q: 'Which grid areas does Eskilstuna Energi och Miljö run?', a: `According to Svenska kraftnät’s Nätområden.se, Eskilstuna Energi & Miljö Elnät AB owns two grid areas, Eskilstuna and Svalboviken, both in bidding zone SE3. Outside them you have a different grid company (elnätsföretag) and different fees. The name is on your grid bill, and on Nätområden.se you can search by address, municipality or grid-area code before choosing a grid in the calculator.` },
      ];
    },
    body: (h) => {
      const v = E(h);
      return `<h2>The house grid cost in 2025 and ${h.P.year}</h2>
${h.table(['Standard case', 'Fixed 2025', `Fixed ${h.P.year}`, 'Transfer, both years', 'Total 2025', `Total ${h.P.year}`, 'Change'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.f.fastKrPerAr * v.mo), h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.priser[0], 2), h.kr(x.f.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.pct(x.t.totalKrPerAr / x.f.totalKrPerAr - 1)]), `Eskilstuna Energi och Miljö Elnät AB, Energy Markets Inspectorate. Yearly amounts incl. VAT, transfer excl. VAT. Authority charges ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'], 2)} in 2025 and ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} in ${h.P.year}.`, ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>Of ${v.nHojn} grids with a house price in both years, ${v.fler} raised the 16 A house cost by a larger percentage than Eskilstuna. Because transfer stayed flat, the rise hits a light user as hard as a heavy one: it arrives through the subscription every month.</p>
<h2>Where Eskilstuna ranks</h2>
${h.table(['Standard case', 'Rank', 'Customers in the case'], v.rader.map((x) => [NAMN.en[x.k], `${x.pl.plats} of ${x.pl.av}`, h.num(x.pkt)]), `Energy Markets Inspectorate ${h.P.year}, rank 1 = cheapest.`, ['l', 'r', 'r'])}
<p>The bigger the fuse, the better the rank: the 25 A house places ${v.r.V25.pl.plats}, the 16 A house ${v.r.V16.pl.plats}. How subscription and transfer combine is covered under ${h.a('natavgift', 'the grid fee')}, and ${h.a('elrakning', 'the electricity bill')} goes through each line you will see on your invoices.</p>
<h2>Eskilstuna within SE3</h2>
<p>The spot price is the same as in ${h.a('elpris-stockholm', 'Stockholm')} and the rest of ${h.a('elpris-se3', 'SE3')}, so the grid is what makes the difference. See how Eskilstuna Energi och Miljö compares with every grid in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
