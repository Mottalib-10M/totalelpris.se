import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Halmstad : nätområde HMD (Halmstads Energi och Miljö Nät AB, SE4, Nätområden.se) ; tarif Ei « Halmstads Energi och Miljö Nät AB ». */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const H = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Halmstads Energi')!;
  const t = M.natTariff(e, 'V20')!;
  const f = M.natTariff(e, 'V20', 2025)!;
  const lgh = M.natTariff(e, 'L16')!;
  const kwh = M.FALL_KWH.V20;
  const spot = M.varde('rorligt', 'SE4', '3')!;
  const spot3 = M.varde('rorligt', 'SE3', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: kwh / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'V20'), plL = M.placering(e, 'L16');
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, pl: M.placering(e, k) }));
  const sparOre = ((pl.median - t.totalKrPerAr) / kwh) * 100;
  const gap = spot - spot3;
  return { mo, t, f, lgh, kwh, spot, spot3, p, man, pl, plL, rader, sparOre, gap, med: pl.median * mo };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-halmstad',
  group: 'stad',
  order: 130,
  tool: 'pris',
  toolProps: { nat: 'Halmstads Energi', zon: 'SE4', fall: 'V20' },
  related: ['elpris-se4', 'jamfor-natavgift', 'elpris-helsingborg', 'ladda-elbil', 'elpris-goteborg'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-halmstad',
    nav: 'Halmstad',
    card: 'Elpriset i Halmstad, där ett av landets billigaste elnät möter SE4:s spotpris.',
    title: 'Elpris Halmstad 2026: billigt elnät i SE4 och pris per kWh',
    description: 'Elpris i Halmstad 2026: SE4 men ett av Sveriges billigaste elnät, Halmstads Energi och Miljö. Räkna ut villans och lägenhetens pris per kWh och månadsräkning.',
    h1: 'Elpris i Halmstad: billigt nät, sydligt spotpris',
    intro: 'Halmstad ligger i elområde SE4, och nätområdet ägs av Halmstads Energi och Miljö Nät AB.',
    resume: (h) => {
      const v = H(h);
      return `${h.ore(v.p.total)} per kilowattimme betalar en halmstadsvilla med elvärme, 20 ampere och 20 000 kWh om året, när elhandeln kostar som SCB:s snitt för rörligt avtal i villor med elvärme i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} utan moms. Nätområdet Halmstad ägs av Halmstads Energi och Miljö Nät AB enligt Nätområden.se och ligger i SE4. Nätet hör till de billigaste i landet. För villan med elvärme kostar det ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, plats ${v.pl.plats} av ${v.pl.av} hos Energimarknadsinspektionen, och för lägenheten plats ${v.plL.plats} av ${v.plL.av}. Överföringsavgiften för villor är bara ${h.ore(v.t.priser[0])} per kWh exklusive moms; nästan allt ligger i abonnemanget. Med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} blir månadsräkningen för villan ungefär ${h.kr(v.man.total)} i genomsnitt över året. Byt typfall i kalkylatorn om du bor i lägenhet eller i en villa utan elvärme.`;
    },
    faqs: (h) => {
      const v = H(h);
      return [
        { q: 'Vem äger elnätet i Halmstad?', a: `Nätområdet Halmstad med koden HMD ägs av Halmstads Energi och Miljö Nät AB enligt Svenska kraftnäts Nätområden.se. Det är bolagets enda område i den källan. Runt staden finns andra ägare: nätområdet Halland tillhör E.ON Energidistribution AB och Laholm tillhör Södra Hallands Kraft. Bor du utanför tätorten, kontrollera namnet på din elnätsfaktura.` },
        { q: 'Väger det billiga nätet i Halmstad upp det dyra SE4?', a: `${v.sparOre >= v.gap ? 'För en villa med elvärme ja, och mer därtill just nu' : 'För en villa med elvärme till stor del'}. Halmstads nät kostar ${h.ore(v.sparOre)} mindre per kWh än mediannätet för samma typfall, räknat utan moms, medan SCB:s rörliga villapris i SE4 låg ${h.ore(v.gap)} över SE3 i ${mn(h, h.M.SENASTE_MANAD)}. Skillnaden mellan zonerna varierar från månad till månad, men nätet ligger fast hela året.` },
        { q: 'Varför har villor lägre överföringsavgift än lägenheter i Halmstad?', a: `Energimarknadsinspektionens tabell för ${h.P.year} visar ${h.ore(v.lgh.priser[0])} per kWh för lägenheten och ${h.ore(v.t.priser[0])} för villorna, exklusive moms. Villorna betalar i stället ett mycket högre abonnemang. Hur bolaget motiverar fördelningen står inte i myndighetens data; för hushållet betyder det att villans nätkostnad knappt rör sig med förbrukningen.` },
        { q: 'Hur mycket steg nätavgiften i Halmstad 2026?', a: `För villan med elvärme gick nätet från ${h.kr(v.f.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, en ökning på ${h.pct(v.t.totalKrPerAr / v.f.totalKrPerAr - 1)}. Både abonnemanget och överföringen höjdes, och myndighetsavgifterna steg för alla nät. Trots det ligger Halmstad kvar bland de billigaste i Energimarknadsinspektionens jämförelse.` },
      ];
    },
    body: (h) => {
      const v = H(h);
      return `<h2>Halmstads nät jämfört med mittvärdet i landet</h2>
${h.table(['Typfall', 'Halmstad', 'Median i landet', 'Under medianen'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.pl.median * v.mo), h.kr((x.pl.median - x.t.totalKrPerAr) * v.mo)]), `Nätkostnad per år inkl. moms ${h.P.year}, Halmstads Energi och Miljö Nät AB. Källa: Energimarknadsinspektionen.`, ['l', 'r', 'r', 'r'])}
<p>Den största skillnaden i kronor gäller de stora villorna, där en halmstadsbo betalar flera tusen kronor mindre om året för nätet än ett hushåll mitt i fältet. Lägenheten ligger också långt under medianen, på plats ${v.plL.plats}. Bara villan med 16 ampere och 5 000 kWh hamnar närmare mitten, eftersom abonnemanget då fördelas på få kilowattimmar.</p>
<h2>Södra Sveriges spotpris med ett nordligt nätpris</h2>
<p>Elhandeln följer SE4. SCB:s rörliga pris för villor med elvärme var ${h.ore(v.spot)} i SE4 och ${h.ore(v.spot3)} i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, utan moms. Halmstad betalar alltså zonens högre elpris, men får tillbaka en stor del genom nätet. Läs mer om zonens prisutveckling på ${h.a('elpris-se4', 'sidan om SE4')}.</p>
<h2>Laddning hemma på ett nät med låg överföring</h2>
<p>När överföringen bara är ${h.ore(v.t.rorligOre * v.mo)} med moms för villor är det elhandeln och skatten som styr vad en extra kilowattimme kostar. Den som laddar bil hemma betalar därför främst spotpris, påslag och energiskatt, se ${h.a('ladda-elbil', 'kostnaden för att ladda elbil')}. Helsingborg har ett dyrare nät i samma zon, se ${h.a('elpris-helsingborg', 'elpriset i Helsingborg')}, och resten av landet finns i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-halmstad',
    nav: 'Halmstad',
    card: 'Electricity price in Halmstad, where one of Sweden’s cheapest grids meets SE4 spot prices.',
    title: 'Electricity Price Halmstad 2026: Cheap Grid in Zone SE4',
    description: 'Electricity price in Halmstad 2026: SE4 but one of the cheapest grids in Sweden, Halmstads Energi och Miljö. Work out a house or flat’s price per kWh and bill.',
    h1: 'Electricity price in Halmstad: cheap grid, southern spot price',
    intro: 'Halmstad is in bidding zone SE4, and the grid area belongs to Halmstads Energi och Miljö Nät AB.',
    resume: (h) => {
      const v = H(h);
      return `${h.ore(v.p.total)} per kilowatt-hour is what a Halmstad house with electric heating, a 20 A main fuse and 20,000 kWh a year pays when retail energy costs the Statistics Sweden (SCB) variable-contract average for electrically heated houses in SE4 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. The Halmstad grid area belongs to Halmstads Energi och Miljö Nät AB according to Nätområden.se and lies in SE4. The grid is among the cheapest in Sweden: ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT for the electrically heated house, rank ${v.pl.plats} of ${v.pl.av} in the Energy Markets Inspectorate’s list, and rank ${v.plL.plats} of ${v.plL.av} for the flat. The transfer fee (per-kWh grid charge) for houses is only ${h.ore(v.t.priser[0])} before VAT; nearly everything sits in the subscription. With energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, the house’s monthly bill averages around ${h.kr(v.man.total)} over the year. Switch the case in the calculator for a flat.`;
    },
    faqs: (h) => {
      const v = H(h);
      return [
        { q: 'Who owns the power grid in Halmstad?', a: `The Halmstad grid area, code HMD, belongs to Halmstads Energi och Miljö Nät AB according to Svenska kraftnät’s Nätområden.se. It is the company’s only area in that source. Other owners surround the town: the Halland area belongs to E.ON Energidistribution AB and Laholm to Södra Hallands Kraft. Outside the town itself, check the grid company named on your bill.` },
        { q: 'Does Halmstad’s cheap grid make up for pricey SE4?', a: `${v.sparOre >= v.gap ? 'For an electrically heated house, yes, and then some at the moment' : 'For an electrically heated house, largely'}. Halmstad’s grid costs ${h.ore(v.sparOre)} less per kWh than the median grid for the same case, before VAT, while the SCB variable house price in SE4 was ${h.ore(v.gap)} above SE3 in ${mn(h, h.M.SENASTE_MANAD)}. The gap between zones changes month by month; the grid saving holds all year.` },
        { q: 'Why do houses pay a lower transfer fee than flats in Halmstad?', a: `The regulator’s ${h.P.year} table shows ${h.ore(v.lgh.priser[0])} per kWh for the flat and ${h.ore(v.t.priser[0])} for houses, before VAT. Houses pay a much higher subscription instead. The company’s reasoning is not in the regulator’s data; for a household it means a house’s grid cost barely moves with usage.` },
        { q: 'How much did Halmstad’s grid fee rise in 2026?', a: `For the electrically heated house, the grid went from ${h.kr(v.f.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, up ${h.pct(v.t.totalKrPerAr / v.f.totalKrPerAr - 1)}. Both the subscription and the transfer fee rose, and authority charges went up for every grid. Even so, Halmstad stays among the cheapest in the regulator’s comparison.` },
      ];
    },
    body: (h) => {
      const v = H(h);
      return `<h2>Halmstad’s grid against the national median</h2>
${h.table(['Standard case', 'Halmstad', 'National median', 'Below median'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.pl.median * v.mo), h.kr((x.pl.median - x.t.totalKrPerAr) * v.mo)]), `Grid cost per year incl. VAT ${h.P.year}, Halmstads Energi och Miljö Nät AB. Source: Energy Markets Inspectorate.`, ['l', 'r', 'r', 'r'])}
<p>The largest gap in kronor is for the big houses, where a Halmstad household pays several thousand kronor a year less for its grid than one in the middle of the field. The flat is well below the median too, at rank ${v.plL.plats}. Only the 16 A house using 5,000 kWh lands nearer the middle, because the subscription is spread over few kilowatt-hours.</p>
<h2>Southern spot prices on a low-cost grid</h2>
<p>Retail energy follows SE4. The SCB variable price for electrically heated houses was ${h.ore(v.spot)} in SE4 and ${h.ore(v.spot3)} in SE3 in ${mn(h, h.M.SENASTE_MANAD)}, before VAT. Halmstad pays the zone’s higher energy price but wins much of it back through the grid. The zone’s price history is on the ${h.a('elpris-se4', 'SE4 page')}.</p>
<h2>Home charging on a low-transfer grid</h2>
<p>With transfer at just ${h.ore(v.t.rorligOre * v.mo)} including VAT for houses, retail energy and tax decide what an extra kilowatt-hour costs. Charging a car at home therefore costs mainly spot price, mark-up (påslag) and energy tax; see ${h.a('ladda-elbil', 'the cost of charging an EV')}. Helsingborg has a dearer grid in the same zone, see ${h.a('elpris-helsingborg', 'electricity in Helsingborg')}, and the rest of Sweden is in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
