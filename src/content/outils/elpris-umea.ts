import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Umeå : nätområde UMA (Umeå Energi Elnät AB, SE2, Nätområden.se) ; Västerbottens län = avdrag 11 kap. 4 § LSE. */
const AVTAL = ['rorligt', 'avtal1ar', 'avtal3ar', 'anvisat'] as const;
const U = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Umeå Energi')!;
  const t = M.natTariff(e, 'L16')!;
  const t25 = M.natTariff(e, 'L16', 2025)!;
  const pl = M.placering(e, 'L16');
  const lista = M.rangordna('L16');
  const fore = lista.slice(0, pl.plats - 1).map((x) => x.e.foretag);
  const topp = lista.slice(0, 5);
  const spot = M.varde('rorligt', 'SE2', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const avdragKr = (2000 * P.skatt.norrlandsavdrag_ore * mo) / 100;
  const avtal = M.jamforAvtal('SE2', '1', 2000 / 12);
  const billig = avtal.reduce((a, b) => (b.kr < a.kr ? b : a));
  const dyr = avtal.reduce((a, b) => (b.kr > a.kr ? b : a));
  const s = M.senaste('rorligt', 'SE2', '1', 12);
  const pkt = e.cas.L16!['2026'].punkter!;
  const pktPlats = M.ENHETER.filter((x) => (x.cas.L16?.['2026']?.punkter ?? 0) > pkt).length + 1;
  const r25 = M.rangordna('L16', 2025);
  const pl25 = { plats: r25.findIndex((x) => x.e.id === e.id) + 1, av: r25.length };
  return { mo, e, t, t25, pl, pl25, fore, topp, spot, p, man, avdragKr, avtal, billig, dyr, fran: s[0][0], till: s[s.length - 1][0], pkt, pktPlats, okning: t.totalKrPerAr / t25.totalKrPerAr - 1, med: pl.median * mo };
};
const ANAMN = { sv: { rorligt: 'Rörligt pris', avtal1ar: 'Fast pris 1 år', avtal3ar: 'Fast pris 3 år', anvisat: 'Anvisat avtal' }, en: { rorligt: 'Variable price', avtal1ar: 'Fixed price, 1 year', avtal3ar: 'Fixed price, 3 years', anvisat: 'Default contract (anvisat)' } };
const ATEXT = { sv: { rorligt: 'rörligt pris', avtal1ar: 'ettårigt fast pris', avtal3ar: 'treårigt fast pris', anvisat: 'anvisat avtal' }, en: { rorligt: 'a variable price', avtal1ar: 'a one-year fixed price', avtal3ar: 'a three-year fixed price', anvisat: 'the default contract' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-umea',
  group: 'stad',
  order: 90,
  tool: 'pris',
  toolProps: { nat: 'Umeå Energi', zon: 'SE2', fall: 'L16', skatt: 1 },
  related: ['elpris-se2', 'jamfor-natavgift', 'elpris-sundsvall', 'energiskatt', 'fast-eller-rorligt'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse'],
  sv: {
    slug: 'elpris-umea',
    nav: 'Umeå',
    card: 'Elpriset i Umeå, där lägenheterna har ett av landets billigaste elnät.',
    title: 'Elpris Umeå 2026: billigt elnät och sänkt skatt per kWh',
    description: 'Elpris i Umeå 2026: SE2, sänkt energiskatt i Västerbotten och Umeå Energis elnät, näst billigast av 136 för lägenheter. Räkna ut ditt totalpris per kWh.',
    h1: 'Elpris i Umeå med Umeå Energis elnät',
    intro: 'Umeå ligger i elområde SE2 och nätområdet ägs av Umeå Energi Elnät AB.',
    resume: (h) => {
      const v = U(h);
      return `${h.ore(v.p.total)}, moms inräknad, betalar en lägenhet i Umeå med 16 ampere när elhandeln kostar som SCB:s snitt för rörligt avtal i SE2 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms. Nätområdet Umeå ägs av Umeå Energi Elnät AB och hör till elområde SE2 enligt Svenska kraftnäts Nätområden.se. Två saker håller nere priset. Umeå kommun ligger i Västerbottens län, där lagen om skatt på energi ger hushållen ett avdrag, så energiskatten blir ${h.ore(h.P.skatt.energiskatt_sankt_ore)} i stället för ${h.ore(h.P.skatt.energiskatt_ore)}. Dessutom är nätet ett av landets billigaste för lägenheter: Energimarknadsinspektionen redovisar ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms för typfallet med 2 000 kWh, plats ${v.pl.plats} av ${v.pl.av}. Det gäller trots att kostnaden steg med ${h.pct(v.okning)} från 2025. Med 2 000 kWh om året landar hela elräkningen på ungefär ${h.kr(v.man.total)} i månaden. Fyll i dagens spotpris från din elhandlare för att räkna om med ditt eget pris.`;
    },
    faqs: (h) => {
      const v = U(h);
      return [
        { q: 'Vilket elnät är billigare än Umeå Energi för en lägenhet?', a: `I Energimarknadsinspektionens sammanställning för ${h.P.year} är det bara ${v.fore.join(' och ')} som har en lägre årskostnad för typfallet lägenhet med 16 ampere och 2 000 kWh. Umeå Energi Elnät hamnar på plats ${v.pl.plats} av ${v.pl.av} med ${h.kr(v.t.totalKrPerAr * v.mo)} om året inklusive moms. Medianen för alla nät med lägenhetspris är ${h.kr(v.med)}, så skillnaden mot ett genomsnittligt nät är stor.` },
        { q: 'Hur mycket sparar en Umeålägenhet på den sänkta energiskatten?', a: `Avdraget är ${h.ore(h.P.skatt.norrlandsavdrag_ore)} före moms, alltså ${h.ore(h.P.skatt.norrlandsavdrag_ore * v.mo)} med moms. En lägenhet som använder 2 000 kWh om året betalar därför ${h.kr(v.avdragKr)} mindre i skatt än samma lägenhet i en kommun utan avdrag. Nätföretaget drar av beloppet direkt på fakturan, så du behöver inte ansöka. Avdraget gäller hushåll i hela Västerbottens län enligt 11 kap. 4 § i lagen om skatt på energi.` },
        { q: 'Steg Umeå Energis nätavgift till 2026?', a: `Ja. För typfallet lägenhet steg årskostnaden från ${h.kr(v.t25.totalKrPerAr * v.mo)} år 2025 till ${h.kr(v.t.totalKrPerAr * v.mo)} år ${h.P.year}, moms inräknad, en ökning med ${h.pct(v.okning)}. Överföringsavgiften gick från ${h.ore(v.t25.priser[0])} till ${h.ore(v.t.priser[0])} före moms, och myndighetsavgifterna som alla nät tar ut höjdes till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} om året. År 2025 låg nätet på plats ${v.pl25.plats} av ${v.pl25.av}.` },
        { q: 'Har alla adresser i Umeå samma nätföretag?', a: `Nätområdet Umeå, med koden UMA, ägs av Umeå Energi Elnät AB enligt Nätområden.se. I samma elområde finns också områdena Umeälven Nedre och Umeälven Övre, som ägs av Vattenfall Eldistribution och har en annan prislista. Ligger din adress utanför tätorten, slå upp den på Nätområden.se eller läs namnet på nätfakturan innan du väljer nät i kalkylatorn ovan.` },
      ];
    },
    body: (h) => {
      const v = U(h);
      return `<h2>De billigaste elnäten för lägenheter ${h.P.year}</h2>
${h.table(['Plats', 'Nätföretag', 'Kostnad per år inkl. moms'], v.topp.map((x, i) => [String(i + 1), x.e.namn, h.kr(x.t.totalKrPerAr * v.mo)]), `Typfall lägenhet 16 A, 2 000 kWh per år. Energimarknadsinspektionen ${h.P.year}, med myndighetsavgifter på ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)}. Av ${v.pl.av} nät.`, ['r', 'l', 'r'])}
<p>Umeå Energi Elnät är inget litet nät. Ei räknar ${h.num(v.pkt)} uttagspunkter i lägenhetsfallet, och bara ${v.pktPlats - 1} nät i Ei:s sammanställning har fler lägenhetskunder. Av årskostnaden är ${h.kr(v.t.fastKrPerAr * v.mo)} fast, och överföringen kostar ${h.ore(v.t.rorligOre * v.mo)} med moms. Båda delarna ligger lågt, så priset per kilowattimme blir lågt även för den som använder lite el.</p>
<h2>Rörligt eller fast avtal i SE2</h2>
${h.table(['Avtal', 'Snittpris exkl. moms', 'Elhandel för 2 000 kWh inkl. moms'], v.avtal.map((x) => [ANAMN.sv[x.avtal], h.ore(x.snittOre), h.kr(x.kr * v.mo)]), `SCB, lägenheter i SE2, ${mn(h, v.fran)} till ${mn(h, v.till)}. Endast elhandeln; nät och skatt tillkommer lika för alla avtal.`, ['l', 'r', 'r'])}
<p>Under perioden var ${ATEXT.sv[v.billig.avtal]} det billigaste för en lägenhet i SE2 och ${ATEXT.sv[v.dyr.avtal]} det dyraste, med ${h.kr((v.dyr.kr - v.billig.kr) * v.mo)} i skillnad på ett år. Har du flyttat till Umeå utan att välja elhandlare får du ett anvisat avtal. Tidigare år kan ordningen ha sett annorlunda ut, och ${h.a('fast-eller-rorligt', 'jämförelsen av fast och rörligt')} visar fler perioder.</p>
<h2>Skatten och grannstaden</h2>
<p>Umeå delar spotpris med ${h.a('elpris-sundsvall', 'Sundsvall')}, men inte skattenivå: Västernorrland har avdraget bara i tre kommuner, och Sundsvall är inte en av dem. Hur avdraget fungerar och vilka län det gäller står i guiden om ${h.a('energiskatt', 'energiskatt på el')}. Vill du se hur Umeå Energi står sig mot ditt förra nät, öppna ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-umea',
    nav: 'Umeå',
    card: 'Electricity price in Umeå, where flats have one of Sweden’s cheapest grids.',
    title: 'Electricity Price Umeå 2026: Cheap Grid and Lower Energy Tax',
    description: 'Electricity price in Umeå 2026: zone SE2, lower energy tax in Västerbotten and Umeå Energi’s grid, second cheapest of 136 for flats. Your all-in price per kWh.',
    h1: 'Electricity price in Umeå on Umeå Energi’s grid',
    intro: 'Umeå is in bidding zone SE2, and its grid area belongs to Umeå Energi Elnät AB.',
    resume: (h) => {
      const v = U(h);
      return `${h.ore(v.p.total)}, VAT included, is what a 16 A flat in Umeå pays when retail energy costs the Statistics Sweden (SCB) average for a variable contract in SE2 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. The Umeå grid area is owned by Umeå Energi Elnät AB and sits in bidding zone SE2, according to Svenska kraftnät’s Nätområden.se. Two things keep the price down. Umeå is in Västerbotten county, where the Energy Tax Act gives households a deduction, so energy tax is ${h.ore(h.P.skatt.energiskatt_sankt_ore)} rather than ${h.ore(h.P.skatt.energiskatt_ore)}. And the local grid is among the cheapest in Sweden for flats: the Energy Markets Inspectorate (Ei) lists ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT for its 2,000 kWh standard case, rank ${v.pl.plats} of ${v.pl.av}, even after a ${h.pct(v.okning)} rise from 2025. At 2,000 kWh a year the whole bill comes to about ${h.kr(v.man.total)} a month. Type in today’s spot price from your retailer to recalculate.`;
    },
    faqs: (h) => {
      const v = U(h);
      return [
        { q: 'Which grid is cheaper than Umeå Energi for a flat?', a: `In the regulator’s ${h.P.year} figures only ${v.fore.join(' and ')} has a lower yearly cost for the standard 16 A flat using 2,000 kWh. Umeå Energi Elnät ranks ${v.pl.plats} of ${v.pl.av} at ${h.kr(v.t.totalKrPerAr * v.mo)} a year including VAT, while the median across all grids with a flat price is ${h.kr(v.med)}. Moving here from a typical Swedish grid area lowers this part of the bill noticeably.` },
        { q: 'How much does a Umeå flat save from the reduced energy tax?', a: `The deduction is ${h.ore(h.P.skatt.norrlandsavdrag_ore)} before VAT, or ${h.ore(h.P.skatt.norrlandsavdrag_ore * v.mo)} with VAT. A flat using 2,000 kWh a year therefore pays ${h.kr(v.avdragKr)} less tax than the same flat in a municipality without it. The grid company (elnätsföretag) applies it on the bill automatically. It covers households throughout Västerbotten county under chapter 11, section 4 of the Energy Tax Act.` },
        { q: 'Did Umeå Energi raise its grid fee for 2026?', a: `Yes. For the standard flat the yearly cost went from ${h.kr(v.t25.totalKrPerAr * v.mo)} in 2025 to ${h.kr(v.t.totalKrPerAr * v.mo)} in ${h.P.year}, VAT included, up ${h.pct(v.okning)}. The transfer fee (överföringsavgift, the per-kWh grid charge) moved from ${h.ore(v.t25.priser[0])} to ${h.ore(v.t.priser[0])} before VAT, and the state authority charges every grid passes on rose to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} a year. In 2025 it ranked ${v.pl25.plats} of ${v.pl25.av}.` },
        { q: 'Does every Umeå address have the same grid company?', a: `The Umeå grid area, code UMA, belongs to Umeå Energi Elnät AB according to Nätområden.se. The same zone also contains the Umeälven Nedre and Umeälven Övre areas, run by Vattenfall Eldistribution on a different price list. If you live outside the town itself, look up your address on Nätområden.se or check the name on your grid bill before choosing a grid in the calculator.` },
      ];
    },
    body: (h) => {
      const v = U(h);
      return `<h2>The cheapest grids for flats in ${h.P.year}</h2>
${h.table(['Rank', 'Grid company', 'Cost per year incl. VAT'], v.topp.map((x, i) => [String(i + 1), x.e.namn, h.kr(x.t.totalKrPerAr * v.mo)]), `Standard case: flat, 16 A, 2,000 kWh a year. Energy Markets Inspectorate ${h.P.year}, with authority charges of ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)}. Out of ${v.pl.av} grids.`, ['r', 'l', 'r'])}
<p>Umeå Energi Elnät is not a small grid. Ei counts ${h.num(v.pkt)} connection points in its flat case, and only ${v.pktPlats - 1} grids in Ei’s data have more flat customers. Of the yearly cost, ${h.kr(v.t.fastKrPerAr * v.mo)} is fixed, and transfer costs ${h.ore(v.t.rorligOre * v.mo)} with VAT. Both parts are low, so even a light user ends up with a modest price per kilowatt-hour.</p>
<h2>Variable or fixed contract in SE2</h2>
${h.table(['Contract', 'Average before VAT', 'Energy for 2,000 kWh incl. VAT'], v.avtal.map((x) => [ANAMN.en[x.avtal], h.ore(x.snittOre), h.kr(x.kr * v.mo)]), `Statistics Sweden, flats in SE2, ${mn(h, v.fran)} to ${mn(h, v.till)}. Retail energy only; grid and tax are the same whatever the contract.`, ['l', 'r', 'r'])}
<p>Over that period ${ATEXT.en[v.billig.avtal]} was the cheapest option for a flat in SE2 and ${ATEXT.en[v.dyr.avtal]} the dearest, a gap of ${h.kr((v.dyr.kr - v.billig.kr) * v.mo)} over the year. If you moved to Umeå and never picked a retailer, you are on the default contract (anvisat avtal). The ranking can differ in other years; the ${h.a('fast-eller-rorligt', 'fixed versus variable comparison')} covers more periods.</p>
<h2>Tax, and the neighbouring city</h2>
<p>Umeå shares its spot price with ${h.a('elpris-sundsvall', 'Sundsvall')} but not its tax level: in Västernorrland county the deduction applies in only three municipalities, and Sundsvall is not among them. The guide to ${h.a('energiskatt', 'energy tax on electricity')} explains the rule and the counties it covers. To see how Umeå Energi compares with the grid you left behind, open the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
