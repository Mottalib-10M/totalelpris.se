import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Helsingborg : nätområde HBG (Öresundskraft AB, SE4, Nätområden.se) ; tarif Ei « Öresundskraft Elnät AB ». */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const B = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Öresundskraft')!;
  const t = M.natTariff(e, 'V16')!;
  const f = M.natTariff(e, 'V16', 2025)!;
  const spot = M.varde('rorligt', 'SE4', '2')!;
  const anv = M.varde('anvisat', 'SE4', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: M.FALL_KWH.V16 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'V16');
  const rader = FALLEN.map((k) => ({ k, a: M.natTariff(e, k, 2025)!, b: M.natTariff(e, k)! }));
  const forandr = M.ENHETER.map((x) => { const a = M.natTariff(x, 'V16', 2025), b = M.natTariff(x, 'V16'); return a && b ? b.totalKrPerAr - a.totalKrPerAr : null; }).filter((x): x is number => x !== null);
  const sankta = forandr.filter((x) => x < 0).length;
  const fastAndel = t.fastKrPerAr / t.totalKrPerAr;
  return { mo, t, f, spot, anv, p, man, pl, rader, sankta, antal: forandr.length, fastAndel, med: pl.median * mo };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-helsingborg',
  group: 'stad',
  order: 60,
  tool: 'pris',
  toolProps: { nat: 'Öresundskraft', zon: 'SE4', fall: 'V16' },
  related: ['elpris-se4', 'jamfor-natavgift', 'elpris-malmo', 'kostnad-frys', 'fast-eller-rorligt'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-helsingborg',
    nav: 'Helsingborg',
    card: 'Elpriset i Helsingborg, där Öresundskraft sänkte nätavgiften till 2026.',
    title: 'Elpris Helsingborg 2026: Öresundskrafts sänkta nätavgift',
    description: 'Elpris i Helsingborg 2026: SE4 och Öresundskrafts elnät, ett av få som blev billigare i år. Räkna ut villans pris per kWh och vad elen kostar varje månad.',
    h1: 'Elpris i Helsingborg med Öresundskrafts elnät',
    intro: 'Helsingborg ligger i elområde SE4, och nätområdet ägs av Öresundskraft.',
    resume: (h) => {
      const v = B(h);
      return `${h.ore(v.p.total)} per kilowattimme med moms betalar en helsingborgsvilla med 16 ampere och 5 000 kWh om året när elhandeln kostar som SCB:s snitt för rörligt avtal i villor utan elvärme i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms. Nätområdet Helsingborg ägs av Öresundskraft AB enligt Nätområden.se; i Energimarknadsinspektionens statistik heter nätbolaget Öresundskraft Elnät AB. Till skillnad från de flesta nät blev det billigare till ${h.P.year}: villafallet kostar ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms mot ${h.kr(v.f.totalKrPerAr * v.mo)} året innan, trots att myndighetsavgifterna steg. Överföringsavgiften sänktes från ${h.ore(v.f.priser[0])} till ${h.ore(v.t.priser[0])} exklusive moms. Nästan allt i nätavgiften är dock fast, ${h.pct(v.fastAndel)} för villan. Med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} blir månadsräkningen omkring ${h.kr(v.man.total)}. Välj lägenhet i kalkylatorn om du bor i flerbostadshus.`;
    },
    faqs: (h) => {
      const v = B(h);
      return [
        { q: 'Vilka nätområden har Öresundskraft?', a: `Enligt Nätområden.se äger Öresundskraft AB fyra nätområden, alla i SE4: Helsingborg, Mörarp, Ängelholmsbygden och Nordvästra Skåne. Energimarknadsinspektionen har en enda rad för Öresundskraft Elnät AB, så typfallen på den här sidan gäller hela det nätet. Höganäs har däremot ett eget nät, Höganäs Energi AB, med en annan prislista.` },
        { q: 'Hur mycket sänkte Öresundskraft nätavgiften 2026?', a: `För villan med 16 ampere och 5 000 kWh gick nätkostnaden ned med ${h.kr((v.f.totalKrPerAr - v.t.totalKrPerAr) * v.mo)} om året inklusive moms enligt Energimarknadsinspektionen. Abonnemanget och överföringsavgiften sänktes båda, medan myndighetsavgifterna steg till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms. Av ${v.antal} villanät med pris båda åren var det bara ${v.sankta} som blev billigare.` },
        { q: 'Lönar det sig att spara el med Öresundskrafts tariff?', a: `Mindre än i många andra städer. Överföringen kostar bara ${h.ore(v.t.rorligOre * v.mo)} per kWh med moms, medan ${h.pct(v.fastAndel)} av villans nätkostnad är fast. Det mesta av besparingen kommer därför från elhandeln och energiskatten, som tillsammans med moms blir ${h.ore((v.spot + h.P.skatt.energiskatt_ore) * v.mo)} per sparad kilowattimme vid SCB:s senaste pris för SE4.` },
        { q: 'Är elen dyrare i Helsingborg än i Malmö?', a: `Spotpriset är detsamma eftersom båda städerna ligger i SE4. Nätet skiljer: Öresundskraft tar ut ett högt abonnemang och låg överföring, E.ON i Malmö tvärtom. För villan med 16 ampere hamnar Öresundskraft på plats ${v.pl.plats} av ${v.pl.av} hos Energimarknadsinspektionen, där 1 är billigast. Jämför de två stadssidorna för just din förbrukning.` },
      ];
    },
    body: (h) => {
      const v = B(h);
      return `<h2>Öresundskrafts nätkostnad före och efter sänkningen</h2>
${h.table(['Typfall', '2025', String(h.P.year), 'Skillnad'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.a.totalKrPerAr * v.mo), h.kr(x.b.totalKrPerAr * v.mo), h.kr((x.b.totalKrPerAr - x.a.totalKrPerAr) * v.mo)]), `Nätkostnad per år inkl. moms, Öresundskraft Elnät AB. Källa: Energimarknadsinspektionen.`, ['l', 'r', 'r', 'r'])}
<p>Alla fyra typfall blev billigare, och mest i kronor för de stora villorna med 20 och 25 ampere. Sänkningen är tydligast i jämförelse med resten av landet, där mittvärdet för villan med 16 ampere i stället ligger på ${h.kr(v.med)} efter en höjning. Öresundskrafts placering, ${v.pl.plats} av ${v.pl.av}, ligger ändå kvar på den dyrare halvan, eftersom abonnemanget är högt från början.</p>
<h2>Elhandeln i SE4: rörligt mot anvisat</h2>
<p>Den som flyttar till Helsingborg och inte väljer elhandlare hamnar på ett anvisat avtal. Enligt SCB kostade det ${h.ore(v.anv)} för villor utan elvärme i SE4 i ${mn(h, h.M.SENASTE_MANAD)}, mot ${h.ore(v.spot)} för ett rörligt avtal, båda utan moms. På 5 000 kWh om året motsvarar skillnaden ${h.kr((v.anv - v.spot) * 5000 / 100 * v.mo)} med moms. Mer om valet finns under ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')}.</p>
<h2>När tariffen är mest fast</h2>
<p>Med en låg överföringsavgift påverkar förbrukningen mest elhandeln. Apparater som går dygnet runt, till exempel ${h.a('kostnad-frys', 'frysen')}, kostar därför ungefär samma sak i Helsingborg som i Malmö per kilowattimme elhandel, men mindre i nätavgift. Grannstaden har den motsatta modellen, se ${h.a('elpris-malmo', 'elpriset i Malmö')}, och fler nät finns i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-helsingborg',
    nav: 'Helsingborg',
    card: 'Electricity price in Helsingborg, where Öresundskraft cut its grid fee for 2026.',
    title: 'Electricity Price Helsingborg 2026: Öresundskraft Fee Cut',
    description: 'Electricity price in Helsingborg 2026: SE4 and Öresundskraft’s grid, one of the few that got cheaper this year. Work out a house’s price per kWh and bill.',
    h1: 'Electricity price in Helsingborg on Öresundskraft’s grid',
    intro: 'Helsingborg lies in bidding zone SE4, and the grid area belongs to Öresundskraft.',
    resume: (h) => {
      const v = B(h);
      return `${h.ore(v.p.total)} per kilowatt-hour including VAT is what a Helsingborg house on a 16 A main fuse using 5,000 kWh a year pays when retail energy costs the Statistics Sweden (SCB) variable-contract average for houses without electric heating in SE4 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. The Helsingborg grid area belongs to Öresundskraft AB according to Nätområden.se; the Energy Markets Inspectorate lists the grid company as Öresundskraft Elnät AB. Unlike most grids, it became cheaper for ${h.P.year}: the house case costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT against ${h.kr(v.f.totalKrPerAr * v.mo)} the year before, even though state authority charges went up. The transfer fee (per-kWh grid charge) fell from ${h.ore(v.f.priser[0])} to ${h.ore(v.t.priser[0])} before VAT. Still, most of the grid fee is fixed, ${h.pct(v.fastAndel)} for the house. With energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, the monthly bill is roughly ${h.kr(v.man.total)}.`;
    },
    faqs: (h) => {
      const v = B(h);
      return [
        { q: 'Which grid areas does Öresundskraft run?', a: `According to Nätområden.se, Öresundskraft AB owns four grid areas, all in SE4: Helsingborg, Mörarp, Ängelholmsbygden and Nordvästra Skåne. The Energy Markets Inspectorate has a single line for Öresundskraft Elnät AB, so the standard cases here apply across that grid. Höganäs, by contrast, has its own grid company, Höganäs Energi AB, with a separate price list.` },
        { q: 'How much did Öresundskraft cut its grid fee in 2026?', a: `For the 16 A house using 5,000 kWh, the grid cost fell by ${h.kr((v.f.totalKrPerAr - v.t.totalKrPerAr) * v.mo)} a year including VAT, per the regulator. Both the subscription and the transfer fee went down, while authority charges rose to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT. Of ${v.antal} house tariffs priced in both years, only ${v.sankta} got cheaper.` },
        { q: 'Does saving power pay off on Öresundskraft’s tariff?', a: `Less than in many cities. Transfer costs only ${h.ore(v.t.rorligOre * v.mo)} per kWh with VAT, while ${h.pct(v.fastAndel)} of the house’s grid cost is fixed. Most of what you save therefore comes from retail energy and energy tax, which with VAT add up to ${h.ore((v.spot + h.P.skatt.energiskatt_ore) * v.mo)} per kilowatt-hour avoided at the latest SCB price for SE4.` },
        { q: 'Is electricity dearer in Helsingborg than in Malmö?', a: `The spot price is the same, since both cities are in SE4. The grids differ: Öresundskraft charges a high subscription and low transfer fee, E.ON in Malmö the reverse. For the 16 A house, Öresundskraft ranks ${v.pl.plats} of ${v.pl.av} in the regulator’s list, where 1 is cheapest. Compare both city pages for your own usage.` },
      ];
    },
    body: (h) => {
      const v = B(h);
      return `<h2>Öresundskraft’s grid cost before and after the cut</h2>
${h.table(['Standard case', '2025', String(h.P.year), 'Difference'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.a.totalKrPerAr * v.mo), h.kr(x.b.totalKrPerAr * v.mo), h.kr((x.b.totalKrPerAr - x.a.totalKrPerAr) * v.mo)]), `Grid cost per year incl. VAT, Öresundskraft Elnät AB. Source: Energy Markets Inspectorate.`, ['l', 'r', 'r', 'r'])}
<p>All four standard cases got cheaper, most in kronor for the larger houses on 20 and 25 A fuses. The cut stands out against the rest of the country, where the median for the 16 A house sits at ${h.kr(v.med)} after a rise. Öresundskraft’s rank, ${v.pl.plats} of ${v.pl.av}, is nonetheless still on the dearer half, because the subscription starts out high.</p>
<h2>Retail energy in SE4: variable against default</h2>
<p>If you move to Helsingborg and do not pick a retailer, you are put on a default contract (anvisat avtal). According to SCB it cost ${h.ore(v.anv)} for houses without electric heating in SE4 in ${mn(h, h.M.SENASTE_MANAD)}, against ${h.ore(v.spot)} on a variable contract, both before VAT. Over 5,000 kWh a year that gap is worth ${h.kr((v.anv - v.spot) * 5000 / 100 * v.mo)} with VAT. The choice is covered under ${h.a('fast-eller-rorligt', 'fixed or variable price')}.</p>
<h2>When the tariff is mostly fixed</h2>
<p>With a low transfer fee, your usage mainly moves the retail part of the bill. Appliances running around the clock, such as the ${h.a('kostnad-frys', 'freezer')}, cost about the same in retail energy per kilowatt-hour in Helsingborg as in Malmö but less in grid fee. The neighbouring city has the opposite model, see ${h.a('elpris-malmo', 'electricity in Malmö')}, and more grids appear in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
