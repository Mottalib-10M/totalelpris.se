import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Gävle : nätområde GVL (Gävle Energi AB, SE3, Nätområden.se) ; tarif Ei « Gävle Energi Elnät AB » (REL03076 en 2026,
 *  les chiffres 2025 sont sous un autre numéro, REL03057 : pas de comparaison d'une année sur l'autre). Gävleborg : seul Ljusdal a l'avdrag. */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const G = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Gävle Energi')!;
  const t = M.natTariff(e, 'V16')!;
  const spot = M.varde('rorligt', 'SE3', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 5000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const rader = FALLEN.map((k) => ({ k, t: M.natTariff(e, k)!, pl: M.placering(e, k), pkt: e.cas[k]!['2026'].punkter! }));
  const r = Object.fromEntries(rader.map((x) => [x.k, x])) as Record<(typeof FALLEN)[number], (typeof rader)[number]>;
  const sammaPris = rader.every((x) => Math.abs(x.t.rorligOre - t.rorligOre) < 0.01);
  const stodMax = (P.elstod.ore_per_kwh.SE3 * P.elstod.tak_kwh) / 100;
  return { mo, e, t, spot, p, man, rader, r, sammaPris, stodMax, pl: M.placering(e, 'V16') };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A', V16: 'Villa 16 A', V20: 'Villa 20 A, elvärme', V25: 'Villa 25 A, elvärme' }, en: { L16: 'Flat 16 A', V16: 'House 16 A', V20: 'House 20 A, electric heating', V25: 'House 25 A, electric heating' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-gavle',
  group: 'stad',
  order: 100,
  tool: 'pris',
  toolProps: { nat: 'Gävle Energi', zon: 'SE3', fall: 'V16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-uppsala', 'elpris-sundsvall', 'elstod'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse', 'regElstod'],
  sv: {
    slug: 'elpris-gavle',
    nav: 'Gävle',
    card: 'Elpriset i Gävle, där överföringsavgiften är densamma för lägenhet och villa.',
    title: 'Elpris Gävle 2026: Gävle Energis elnät och pris per kWh',
    description: 'Elpris i Gävle 2026: SE3, full energiskatt och Gävle Energis nät med samma överföringsavgift i alla typfall. Räkna ut vad en villa med 16 A betalar per kWh.',
    h1: 'Elpris i Gävle med Gävle Energis elnät',
    intro: 'Gävle ligger i elområde SE3 och nätområdet ägs av Gävle Energi AB.',
    resume: (h) => {
      const v = G(h);
      return `${h.kr(v.man.total)} i månaden kostar elen för en villa i Gävle med 16 ampere och 5 000 kWh om året, utan elvärme, när elhandeln ligger på SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)}: ${h.ore(v.spot)} före moms. Svenska kraftnäts Nätområden.se anger Gävle Energi AB som ägare till nätområdet Gävle, i elområde SE3. Hos Energimarknadsinspektionen tar bolagets elnät ${h.ore(v.t.rorligOre)} i överföringsavgift före moms, och samma belopp står i alla fyra typfall, från lägenheten till den elvärmda villan med 25 ampere. Det som skiljer kunderna åt är alltså den fasta avgiften, som för villan med 16 ampere blir ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms. Det ger plats ${v.pl.plats} av ${v.pl.av} bland näten. Gävle kommun har inget skatteavdrag; i Gävleborgs län gäller det bara Ljusdal, så energiskatten är ${h.ore(h.P.skatt.energiskatt_ore)}. Totalpriset blir ${h.ore(v.p.total)} med moms. Skriv in dagens spotpris för att se vad nästa timme kostar.`;
    },
    faqs: (h) => {
      const v = G(h);
      return [
        { q: 'Varför har Gävle Energi samma överföringsavgift för lägenhet och villa?', a: `Energimarknadsinspektionens uppgifter för ${h.P.year} visar ${h.ore(v.t.rorligOre)} före moms i alla fyra typfall hos Gävle Energi Elnät AB. Bolagets skäl framgår inte av myndighetens data, så vi redovisar bara beloppet. Följden är att en sparad kilowattimme är värd lika mycket i nätet oavsett bostad, ${h.ore(v.t.rorligOre * v.mo)} med moms, medan abonnemanget växer med säkringen.` },
        { q: 'Har Gävle samma sänkta energiskatt som Ljusdal?', a: `Nej. Lagen om skatt på energi räknar i Gävleborgs län bara upp Ljusdal bland kommunerna med avdrag på ${h.ore(h.P.skatt.norrlandsavdrag_ore)}. I Gävle, Sandviken, Hudiksvall och övriga kommuner i länet gäller därför full energiskatt, ${h.ore(h.P.skatt.energiskatt_ore)} före moms. För villan med 5 000 kWh om året motsvarar avdraget ${h.kr((5000 * h.P.skatt.norrlandsavdrag_ore * v.mo) / 100)} med moms, ett belopp som Gävlehushållen alltså inte får.` },
        { q: 'Varför jämför ni inte Gävle Energis nätavgift med 2025?', a: `I Energimarknadsinspektionens fil står Gävle Energi Elnät AB för ${h.P.year} under ett annat redovisningsnummer än för 2025, och antalet kunder skiljer sig mellan raderna. Vi vet inte om de täcker exakt samma område, så vi räknar inte fram någon förändring mellan åren. Vill du jämföra själv, titta på din nätfaktura från 2025 och lägg den bredvid årets prislista från bolaget.` },
        { q: 'Vad kostar en större säkring hos Gävle Energi?', a: `Villan med 20 ampere har en fast avgift på ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} om året med moms och villan med 25 ampere ${h.kr(v.r.V25.t.fastKrPerAr * v.mo)}. Båda typfallen räknar med 20 000 kWh, så skillnaden på ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)} om året är ren säkringskostnad. Behöver huset inte 25 ampere kan det löna sig att fråga nätföretaget om en mindre huvudsäkring.` },
      ];
    },
    body: (h) => {
      const v = G(h);
      return `<h2>Gävle Energis fyra typfall ${h.P.year}</h2>
${h.table(['Typfall', 'Fast per år inkl. moms', 'Överföring inkl. moms', 'Totalt per år inkl. moms', 'Plats', 'Kunder'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${x.pl.plats} av ${x.pl.av}`, h.num(x.pkt)]), `Gävle Energi Elnät AB, Energimarknadsinspektionen ${h.P.year}. Kunder = uttagspunkter i typfallet. Plats 1 = billigast.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Den elvärmda villan med 20 ampere hamnar högst upp av Gävles fyra fall i jämförelsen, på plats ${v.r.V20.pl.plats}. Där väger överföringen tyngst, eftersom typfallet räknar med 20 000 kWh, och Gävles låga pris per kWh gör mest nytta. Lägenheten ligger på plats ${v.r.L16.pl.plats}; för den är det abonnemanget på ${h.kr(v.r.L16.t.fastKrPerAr * v.mo)} som gör mest av kostnaden.</p>
<p>Enligt Nätområden.se äger Gävle Energi AB fyra nätområden i SE3: Forsbacka, Gävle, Hedesunda och Hofors. Ei har för ${h.P.year} en rad för Gävle Energi Elnät AB. Står ett annat namn på din nätfaktura, välj det nätet i kalkylatorn.</p>
<h2>Elstödet för vintern 2026 i Gävle</h2>
<p>För förbrukningen i januari och februari 2026 fick hushåll i SE3 ${h.num(h.P.elstod.ore_per_kwh.SE3)} öre per kWh, upp till ${h.num(h.P.elstod.tak_kwh)} kWh per bostad. Varje 1 000 kWh under de två månaderna gav alltså ${h.kr((h.P.elstod.ore_per_kwh.SE3 * 1000) / 100)}, och den som nådde taket fick ${h.kr(v.stodMax)}. Försäkringskassan betalade ut pengarna till den som stod på elnätsavtalet den 28 februari. Läs mer om ${h.a('elstod', 'elstödet')}.</p>
<h2>Gävle i SE3</h2>
<p>Elhandeln kostar lika mycket i Gävle som i ${h.a('elpris-uppsala', 'Uppsala')} och resten av ${h.a('elpris-se3', 'SE3')}. ${h.a('elpris-sundsvall', 'Sundsvall')}, längre norrut längs kusten, ligger däremot i SE2 och har ett annat spotpris. Hur Gävle Energi står sig mot alla andra nät ser du i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-gavle',
    nav: 'Gävle',
    card: 'Electricity price in Gävle, where flats and houses pay the same transfer fee.',
    title: 'Electricity Price Gävle 2026: Gävle Energi Grid per kWh',
    description: 'Electricity price in Gävle 2026: SE3, full energy tax and Gävle Energi’s grid with one transfer fee in every standard case. See what a 16 A house pays per kWh.',
    h1: 'Electricity price in Gävle on Gävle Energi’s grid',
    intro: 'Gävle is in bidding zone SE3, and its grid area belongs to Gävle Energi AB.',
    resume: (h) => {
      const v = G(h);
      return `${h.kr(v.man.total)} a month is what power costs a Gävle house on a 16 A main fuse using 5,000 kWh a year without electric heating, when retail energy matches the Statistics Sweden (SCB) variable-contract average for SE3 in ${mn(h, h.M.SENASTE_MANAD)}: ${h.ore(v.spot)} before VAT. Svenska kraftnät’s Nätområden.se names Gävle Energi AB as owner of the Gävle grid area, in bidding zone SE3. In the Energy Markets Inspectorate’s data the company’s grid charges a transfer fee (överföringsavgift, the per-kWh grid charge) of ${h.ore(v.t.rorligOre)} before VAT, and the same figure appears in all four standard cases, from the flat to the 25 A electrically heated house. What separates customers is the fixed fee, which for the 16 A house is ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT, rank ${v.pl.plats} of ${v.pl.av}. Gävle has no energy tax deduction; in Gävleborg county only Ljusdal does, so tax is ${h.ore(h.P.skatt.energiskatt_ore)}. The all-in price is ${h.ore(v.p.total)} with VAT.`;
    },
    faqs: (h) => {
      const v = G(h);
      return [
        { q: 'Why does Gävle Energi charge flats and houses the same transfer fee?', a: `The regulator’s ${h.P.year} figures show ${h.ore(v.t.rorligOre)} before VAT in all four standard cases for Gävle Energi Elnät AB. The company’s reasons are not in that data, so we only report the amount. In practice a kilowatt-hour you save is worth the same on the grid side whatever your home, ${h.ore(v.t.rorligOre * v.mo)} with VAT, while the subscription grows with the fuse size.` },
        { q: 'Does Gävle get the same lower energy tax as Ljusdal?', a: `No. In Gävleborg county the Energy Tax Act lists only Ljusdal among the municipalities with the ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction. Gävle, Sandviken, Hudiksvall and the rest of the county pay the full ${h.ore(h.P.skatt.energiskatt_ore)} before VAT. For the house using 5,000 kWh a year the deduction would be worth ${h.kr((5000 * h.P.skatt.norrlandsavdrag_ore * v.mo) / 100)} with VAT, which Gävle households do not receive.` },
        { q: 'Why is there no 2025 comparison for Gävle Energi’s grid fee?', a: `In the Energy Markets Inspectorate’s file, Gävle Energi Elnät AB appears for ${h.P.year} under a different reporting number from 2025, and the customer counts on the two lines differ. We cannot tell whether they cover exactly the same area, so we do not compute a change. To compare yourself, put a 2025 grid bill next to the company’s current price list.` },
        { q: 'What does a bigger main fuse cost with Gävle Energi?', a: `The 20 A house has a fixed fee of ${h.kr(v.r.V20.t.fastKrPerAr * v.mo)} a year with VAT and the 25 A house ${h.kr(v.r.V25.t.fastKrPerAr * v.mo)}. Both standard cases assume 20,000 kWh, so the ${h.kr((v.r.V25.t.fastKrPerAr - v.r.V20.t.fastKrPerAr) * v.mo)} gap is purely the price of the larger fuse (säkring). If the house does not need 25 A, asking the grid company about a smaller one can pay.` },
      ];
    },
    body: (h) => {
      const v = G(h);
      return `<h2>Gävle Energi’s four standard cases in ${h.P.year}</h2>
${h.table(['Standard case', 'Fixed per year incl. VAT', 'Transfer incl. VAT', 'Total per year incl. VAT', 'Rank', 'Customers'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${x.pl.plats} of ${x.pl.av}`, h.num(x.pkt)]), `Gävle Energi Elnät AB, Energy Markets Inspectorate ${h.P.year}. Customers = connection points in the case. Rank 1 = cheapest.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Of Gävle’s four cases, the electrically heated 20 A house does best in the national ranking, at ${v.r.V20.pl.plats}. Transfer weighs most there, because the case assumes 20,000 kWh, so Gävle’s low per-kWh charge helps most. The flat sits at ${v.r.L16.pl.plats}; for a flat, the ${h.kr(v.r.L16.t.fastKrPerAr * v.mo)} subscription makes up most of the cost.</p>
<p>According to Nätområden.se, Gävle Energi AB owns four grid areas in SE3: Forsbacka, Gävle, Hedesunda and Hofors. Ei has one ${h.P.year} line for Gävle Energi Elnät AB. If a different company name is on your grid bill, choose that grid in the calculator.</p>
<h2>The winter 2026 support in Gävle</h2>
<p>For January and February 2026 consumption, households in SE3 received ${h.num(h.P.elstod.ore_per_kwh.SE3)} öre per kWh, up to ${h.num(h.P.elstod.tak_kwh)} kWh per home. Each 1,000 kWh used in those two months brought ${h.kr((h.P.elstod.ore_per_kwh.SE3 * 1000) / 100)}, and a household at the cap got ${h.kr(v.stodMax)}. Försäkringskassan, the social insurance agency, paid whoever held the grid contract on 28 February. More on the ${h.a('elstod', 'electricity support')}.</p>
<h2>Gävle within SE3</h2>
<p>Retail energy costs the same in Gävle as in ${h.a('elpris-uppsala', 'Uppsala')} and the rest of ${h.a('elpris-se3', 'SE3')}. ${h.a('elpris-sundsvall', 'Sundsvall')}, further up the coast, is in SE2 instead and has a different spot price. How Gävle Energi compares with every other grid is in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
