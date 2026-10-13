import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Malmö : nätområde MMO « Malmö-Burlöv » (E.ON Energidistribution AB, SE4, Nätområden.se) ; tarif Ei « E.ON Energidistribution AB, Syd & Mellersta ». */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const W = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('E.ON Energidistribution', 'Syd')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const spot = M.varde('rorligt', 'SE4', '1')!;
  const spot3 = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: M.FALL_KWH.L16 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'L16');
  const andel = (t.rorligOre * M.FALL_KWH.L16 / 100) / t.totalKrPerAr;
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, pl: M.placering(e, k) }));
  return { mo, e, t, f, spot, spot3, p, man, pl, andel, rader, med: pl.median * mo };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-malmo',
  group: 'stad',
  order: 30,
  tool: 'pris',
  toolProps: { nat: 'E.ON Energidistribution|Syd', zon: 'SE4', fall: 'L16' },
  related: ['elpris-se4', 'eon-energidistribution', 'jamfor-natavgift', 'elpris-lund', 'kostnad-dusch'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-malmo',
    nav: 'Malmö',
    card: 'Totalpris per kWh i Malmö med E.ON:s nät i SE4.',
    title: 'Elpris Malmö 2026: E.ON:s nätavgift och priset per kWh i SE4',
    description: 'Elpris i Malmö 2026: elområde SE4 och E.ON:s nät med hög avgift per kWh. Räkna ut vad varje kilowattimme kostar dig och vad en lägenhet betalar i månaden.',
    h1: 'Elpris i Malmö: E.ON:s nät och södra Sveriges spotpris',
    intro: 'Nätområdet Malmö-Burlöv ägs av E.ON Energidistribution AB och ligger i elområde SE4.',
    resume: (h) => {
      const v = W(h);
      return `${h.ore(v.p.total)} med moms är vad en malmölägenhet med 16 ampere betalar för varje förbrukad kilowattimme när elhandeln kostar som SCB:s snitt för rörligt avtal i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} utan moms. Enligt Nätområden.se hör Malmö till nätområdet Malmö-Burlöv, som E.ON Energidistribution AB äger, i elområde SE4 längst i söder. Energimarknadsinspektionen redovisar E.ON:s lokalnät i tre prisgrupper; vi räknar med gruppen Syd & Mellersta, men det är prislistan på din egen faktura som gäller. Där är överföringsavgiften ${h.ore(v.t.priser[0])} exklusive moms, en av de högre i landet, medan abonnemanget är lågt. Hela ${h.pct(v.andel)} av lägenhetens nätkostnad följer därför förbrukningen. Med ${h.kr(v.t.fastKrPerAr * v.mo)} i fasta avgifter och energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} blir räkningen för 2 000 kWh om året ungefär ${h.kr(v.man.total)} i månaden. Mata in dagens spotpris från din elhandlare i kalkylatorn så räknas resten ut åt dig.`;
    },
    faqs: (h) => {
      const v = W(h);
      return [
        { q: 'Vilket nätområde tillhör Malmö?', a: `Malmö ligger i nätområdet Malmö-Burlöv med koden MMO, som ägs av E.ON Energidistribution AB enligt Svenska kraftnäts Nätområden.se. Namnet visar att området sträcker sig in i Burlöv. E.ON äger enligt samma källa flera andra områden i SE4, bland annat Skåne Västra Lokalnät och Skåne Landsbygd. Kontrollera områdets namn på din nätfaktura.` },
        { q: 'Har E.ON höjt nätavgiften i Malmö till 2026?', a: `I Energimarknadsinspektionens tabell för gruppen Syd & Mellersta är E.ON:s abonnemang och överföringsavgift desamma för 2025 och ${h.P.year}. Det enda som ändrats är myndighetsavgifterna, som gick från ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms. Lägenhetsfallet kostar därmed ${h.kr(v.t.totalKrPerAr * v.mo)} mot ${h.kr(v.f.totalKrPerAr * v.mo)} året innan, med moms.` },
        { q: 'Hur mycket sparar jag på en kilowattimme mindre i Malmö?', a: `Med SCB:s rörliga snittpris för SE4 och E.ON:s överföringsavgift sparar varje kilowattimme du låter bli att använda omkring ${h.ore(v.p.total)} inklusive moms och energiskatt. Det är mer än i de flesta städer, eftersom nätdelen per kWh är hög. En dusch som är en minut kortare syns därför tydligare på fakturan här än i en stad med högt abonnemang och låg överföringsavgift.` },
        { q: 'Varför är elen dyrare i Malmö än i Göteborg?', a: `Två saker skiljer. Spotpriset i SE4 är oftast högre: SCB:s rörliga lägenhetspris var ${h.ore(v.spot)} i SE4 mot ${h.ore(v.spot3)} i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, utan moms. Dessutom ligger E.ON:s nät för lägenheter på plats ${v.pl.plats} av ${v.pl.av} hos Energimarknadsinspektionen, där 1 är billigast, medan Göteborg Energis nät ligger betydligt lägre.` },
      ];
    },
    body: (h) => {
      const v = W(h);
      return `<h2>E.ON:s fyra typfall i södra Sverige</h2>
${h.table(['Typfall', 'Fast per år', 'Överföring', 'Nät totalt per år', 'Plats'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${x.pl.plats} av ${x.pl.av}`]), `E.ON Energidistribution AB, grupp Syd & Mellersta, ${h.P.year}, inkl. moms. Plats 1 = billigaste nätområdet. Källa: Energimarknadsinspektionen.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Tabellen visar en ovanlig profil. För lägenheten och den mindre villan tar E.ON ut en stor del av nätkostnaden per kilowattimme; för villorna med 20 och 25 ampere är det i stället den fasta avgiften som dominerar och överföringen är betydligt lägre. Det betyder att en malmöbo i lägenhet kan påverka nätkostnaden mer genom sin förbrukning än någon med fast hög avgift.</p>
<h2>SE4 mot SE3: skillnaden i elhandeln</h2>
<p>Malmö ligger i det sydligaste elområdet. Enligt SCB kostade ett rörligt avtal för lägenheter ${h.ore(v.spot)} i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot - v.spot3)} mer än i SE3 samma månad, båda utan moms och med elhandlarens påslag. Läs mer om zonen på sidan om ${h.a('elpris-se4', 'elpriset i SE4')}, där månadsserien finns.</p>
<h2>Var kilowattimmen kostar mest och hur du minskar den</h2>
<p>När varje kWh bär både spotpris, en hög överföringsavgift, energiskatt och moms lönar sig förbrukningen som går att undvika. En lägre duschtemperatur och kortare duschar slår igenom direkt, se ${h.a('kostnad-dusch', 'vad en dusch kostar')}. Nätföretaget kan du inte byta, men elhandlaren väljer du fritt. Lund ligger i samma elområde men har ett annat nätbolag och en helt annan fördelning mellan fast och rörligt: jämför med ${h.a('elpris-lund', 'elpriset i Lund')} och ${h.a('jamfor-natavgift', 'nätavgifterna i hela landet')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-malmo',
    nav: 'Malmö',
    card: 'All-in price per kWh in Malmö on E.ON’s grid, SE4.',
    title: 'Electricity Price Malmö 2026: E.ON Grid Fee and SE4 per kWh',
    description: 'Electricity price in Malmö 2026: zone SE4 and E.ON’s grid with a high per-kWh charge. See what each kilowatt-hour costs you and what a flat pays each month.',
    h1: 'Electricity price in Malmö: E.ON’s grid and southern spot prices',
    intro: 'The Malmö-Burlöv grid area is owned by E.ON Energidistribution AB and lies in bidding zone SE4.',
    resume: (h) => {
      const v = W(h);
      return `${h.ore(v.p.total)} including VAT is what a Malmö flat on a 16 A fuse pays for each kilowatt-hour it uses when retail energy costs the Statistics Sweden (SCB) average for a variable contract in SE4 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. Nätområden.se, the national grid-area map, places Malmö in the Malmö-Burlöv area, owned by E.ON Energidistribution AB, in SE4 at the southern tip of the country. The Energy Markets Inspectorate (Ei) reports E.ON’s local grids in three price groups; we use the group called Syd & Mellersta, but the price list on your own bill is what counts. There the transfer fee (the per-kWh grid charge) is ${h.ore(v.t.priser[0])} before VAT, among the higher ones in Sweden, while the subscription is low, so ${h.pct(v.andel)} of a flat’s grid cost follows its usage. With ${h.kr(v.t.fastKrPerAr * v.mo)} in fixed charges and energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, a flat using 2,000 kWh a year pays about ${h.kr(v.man.total)} a month.`;
    },
    faqs: (h) => {
      const v = W(h);
      return [
        { q: 'Which grid area is Malmö in?', a: `Malmö is in the Malmö-Burlöv grid area, code MMO, owned by E.ON Energidistribution AB according to Svenska kraftnät’s Nätområden.se. As the name says, it reaches into Burlöv. The same source lists other E.ON areas in SE4, such as Skåne Västra Lokalnät and Skåne Landsbygd. The area name is printed on your grid bill from the network company (elnätsföretag).` },
        { q: 'Did E.ON raise its Malmö grid fee for 2026?', a: `In the Energy Markets Inspectorate’s table for the Syd & Mellersta group, E.ON’s subscription and transfer fee are identical for 2025 and ${h.P.year}. Only the state authority charges moved, from ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT. The flat case is ${h.kr(v.t.totalKrPerAr * v.mo)} against ${h.kr(v.f.totalKrPerAr * v.mo)} the year before, with VAT.` },
        { q: 'What does one kilowatt-hour less save me in Malmö?', a: `Using the SCB variable average for SE4 and E.ON’s transfer fee, each kilowatt-hour you avoid saves roughly ${h.ore(v.p.total)} including VAT and energy tax. That is more than in most cities, because the grid part per kWh is high. A shorter shower therefore shows up more clearly on a Malmö bill than in a city with a high subscription and a low transfer fee.` },
        { q: 'Why is electricity dearer in Malmö than in Gothenburg?', a: `Two things differ. Spot prices in SE4 are usually higher: the SCB variable price for flats was ${h.ore(v.spot)} in SE4 against ${h.ore(v.spot3)} in SE3 in ${mn(h, h.M.SENASTE_MANAD)}, before VAT. On top of that, E.ON’s grid ranks ${v.pl.plats} of ${v.pl.av} for flats in the regulator’s list, where 1 is cheapest, far behind Göteborg Energi.` },
      ];
    },
    body: (h) => {
      const v = W(h);
      return `<h2>E.ON’s four standard cases in the south</h2>
${h.table(['Standard case', 'Fixed per year', 'Transfer', 'Grid total per year', 'Rank'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${x.pl.plats} of ${x.pl.av}`]), `E.ON Energidistribution AB, group Syd & Mellersta, ${h.P.year}, incl. VAT. Rank 1 = cheapest grid area. Source: Energy Markets Inspectorate.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The table shows an unusual profile. For the flat and the smaller house, E.ON collects much of its grid cost per kilowatt-hour; for houses on 20 and 25 A fuses the fixed charge dominates and the transfer fee drops sharply. A Malmö tenant can therefore shift the grid cost more through their own usage than a household on a heavy standing charge.</p>
<h2>SE4 against SE3: the retail gap</h2>
<p>Malmö is in the southernmost bidding zone (elområde). According to SCB, a variable contract for flats cost ${h.ore(v.spot)} in SE4 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot - v.spot3)} more than in SE3 the same month, both before VAT and including the retailer’s mark-up. The monthly series is on the ${h.a('elpris-se4', 'SE4 price page')}.</p>
<h2>Where each unit costs most, and how to use fewer</h2>
<p>When every kWh carries the spot price, a high transfer fee, energy tax and VAT, avoidable use is worth cutting. Cooler, shorter showers show up at once; see ${h.a('kostnad-dusch', 'what a shower costs')}. You cannot change grid company, but you pick your retailer freely; newcomers start on a default contract (anvisat avtal) until they choose. Lund shares the zone but has a different grid company with a very different fixed-to-variable split: compare ${h.a('elpris-lund', 'electricity in Lund')} and ${h.a('jamfor-natavgift', 'grid fees across Sweden')}.</p>`;
    },
  },
});
