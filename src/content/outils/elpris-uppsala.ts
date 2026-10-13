import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Uppsala : nätområde UPP (Vattenfall Eldistribution AB, SE3, Nätområden.se) ; tarif Ei « Vattenfall Eldistribution AB, Lokalnät Syd » (Lokalnät Norr a les mêmes montants). */
const FALLEN = ['L16', 'V16', 'V20', 'V25'] as const;
const U = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!;
  const norr = M.hittaEnhet('Vattenfall Eldistribution', 'Norr')!;
  const t = M.natTariff(e, 'V16')!;
  const f = M.natTariff(e, 'V16', 2025)!;
  const lgh = M.natTariff(e, 'L16')!;
  const spot = M.varde('rorligt', 'SE3', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: M.FALL_KWH.V16 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'V16');
  const rader = FALLEN.map((k) => ({ k, a: M.natTariff(e, k, 2025)!, b: M.natTariff(e, k)! }));
  const okning = t.totalKrPerAr / f.totalKrPerAr - 1;
  const lika = M.natTariff(norr, 'V16')!.totalKrPerAr === t.totalKrPerAr;
  const hojn = M.ENHETER.map((x) => { const a = M.natTariff(x, 'V16', 2025), b = M.natTariff(x, 'V16'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const fler = hojn.filter((x) => x > okning).length;
  return { mo, t, f, lgh, spot, p, man, pl, rader, okning, lika, hojn: hojn.length, fler, med: pl.median * mo };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-uppsala',
  group: 'stad',
  order: 40,
  tool: 'pris',
  toolProps: { nat: 'Vattenfall Eldistribution|Syd', zon: 'SE3', fall: 'V16' },
  related: ['elpris-se3', 'vattenfall-eldistribution', 'jamfor-natavgift', 'elpris-stockholm', 'elrakning'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-uppsala',
    nav: 'Uppsala',
    card: 'Elpriset i Uppsala med Vattenfalls nät, räknat för en villa i SE3.',
    title: 'Elpris Uppsala 2026: Vattenfalls nätavgift för villa och lgh',
    description: 'Elpris i Uppsala 2026: SE3 och Vattenfall Eldistributions nät, som höjde både abonnemang och överföring. Räkna ut villans pris per kWh och månadskostnad.',
    h1: 'Elpris i Uppsala med Vattenfall Eldistributions nät',
    intro: 'Uppsala är ett av Vattenfall Eldistributions nätområden och ligger i elområde SE3.',
    resume: (h) => {
      const v = U(h);
      return `För en uppsalavilla med 16 amperes säkring och 5 000 kWh om året kostar elen i dag omkring ${h.ore(v.p.total)} per kilowattimme, med SCB:s snitt för rörligt avtal i villor utan elvärme i SE3 i ${mn(h, h.M.SENASTE_MANAD)} som elhandelspris (${h.ore(v.spot)} utan moms). Nätområdet Uppsala ägs av Vattenfall Eldistribution AB enligt Svenska kraftnäts Nätområden.se. Hos Energimarknadsinspektionen steg Vattenfalls nät mer än de flesta till ${h.P.year}: villafallet kostar ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, ${h.pct(v.okning)} mer än 2025. Överföringsavgiften gick från ${h.ore(v.f.priser[0])} till ${h.ore(v.t.priser[0])} per kWh exklusive moms och abonnemanget höjdes också. Därmed hamnar nätet på plats ${v.pl.plats} av ${v.pl.av} bland villanäten, där 1 är billigast. Med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} landar villans månadsräkning kring ${h.kr(v.man.total)}. Byt typfall i kalkylatorn om du bor i lägenhet, eller skriv in dagens spotpris.`;
    },
    faqs: (h) => {
      const v = U(h);
      return [
        { q: 'Har Uppsala samma nätpris som resten av Vattenfalls kunder?', a: `Energimarknadsinspektionen redovisar Vattenfall Eldistributions lokalnät i två grupper, Lokalnät Syd och Lokalnät Norr. ${v.lika ? 'För villan med 16 ampere har de exakt samma belopp i' : 'Beloppen skiljer sig åt i'} ${h.P.year} års tabell. Runt Uppsala har Vattenfall enligt Nätområden.se också områdena Uppland Norra, Uppland Östra och Uppland Västra, men Uppland Södra ägs av E.ON.` },
        { q: 'Hur mycket höjde Vattenfall nätavgiften i Uppsala 2026?', a: `För villan med 16 ampere och 5 000 kWh steg nätkostnaden från ${h.kr(v.f.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året inklusive moms, alltså ${h.pct(v.okning)}. Både abonnemanget och överföringsavgiften höjdes enligt Energimarknadsinspektionen. En mindre del av ökningen förklaras av myndighetsavgifterna, som alla nätbolag tar ut och som höjdes till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms.` },
        { q: 'Vad betalar en lägenhet i Uppsala för elnätet?', a: `Typfallet lägenhet med 16 ampere och 2 000 kWh kostar hos Vattenfall ${h.kr(v.lgh.totalKrPerAr * v.mo)} om året med moms ${h.P.year}, varav ${h.kr(v.lgh.fastKrPerAr * v.mo)} är fasta avgifter. Det är mer än medianen för lägenheter i landet. Välj lägenhet i kalkylatorn ovan så räknas överföringen per kWh om för din förbrukning och din säkring.` },
        { q: 'Är elen dyrare i Uppsala än i Stockholm?', a: `Elhandeln kostar lika mycket eftersom båda städerna ligger i SE3. Skillnaden sitter i nätet: Uppsala har Vattenfall och Stockholms nätområde ägs av Ellevio, med egna prislistor. För villor saknar Energimarknadsinspektionens tabell ett totalbelopp för Ellevio ${h.P.year}, så jämför lägenhetsfallet på de två stadssidorna i stället för att gissa.` },
      ];
    },
    body: (h) => {
      const v = U(h);
      return `<h2>Vattenfalls nätkostnad i Uppsala, 2025 mot ${h.P.year}</h2>
${h.table(['Typfall', '2025', String(h.P.year), 'Förändring'], v.rader.map((x) => [NAMN.sv[x.k], h.kr(x.a.totalKrPerAr * v.mo), h.kr(x.b.totalKrPerAr * v.mo), h.pct(x.b.totalKrPerAr / x.a.totalKrPerAr - 1)]), `Nätkostnad per år inkl. moms, Vattenfall Eldistribution AB, Lokalnät Syd. Källa: Energimarknadsinspektionen.`, ['l', 'r', 'r', 'r'])}
<p>Höjningen är bred. Bland de ${v.hojn} nät som har ett villapris för båda åren är det bara ${v.fler} som höjt mer i procent än Vattenfall. Alla fyra typfall blev dyrare med ungefär lika stor procentsats, vilket visar att Vattenfall lyft både den fasta delen och priset per kilowattimme. För villan med 16 ampere är abonnemang och myndighetsavgifter ${h.kr(v.t.fastKrPerAr * v.mo)} om året och överföringen ${h.ore(v.t.rorligOre * v.mo)} med moms. Medianen för samma villafall i landet är ${h.kr(v.med)}, så en uppsalavilla betalar ${h.kr(v.t.totalKrPerAr * v.mo - v.med)} mer än ett hushåll mitt i fältet.</p>
<h2>Elhandeln är densamma som i Stockholm</h2>
<p>Hela SE3 har samma spotpris timme för timme, och SCB:s rörliga villapris för området låg på ${h.ore(v.spot)} utan moms i ${mn(h, h.M.SENASTE_MANAD)}. Det är därför nätet och inte zonen som skiljer Uppsala från ${h.a('elpris-stockholm', 'Stockholm')}. Se ${h.a('elpris-se3', 'elpriset i SE3')} för hur zonpriset har rört sig månad för månad.</p>
<h2>Kontrollera din egen räkning</h2>
<p>Vattenfalls faktura delar upp nätet i abonnemang och överföring, och elhandlarens faktura visar spotpris och påslag. Lägg ihop dem med ${h.a('elrakning', 'elräkningskalkylatorn')} för att se om totalen stämmer med vad du har betalat. Vill du se var Vattenfall står mot andra nätbolag i hela landet, öppna ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')} eller sidan om ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-uppsala',
    nav: 'Uppsala',
    card: 'Electricity price in Uppsala on Vattenfall’s grid, worked out for a house in SE3.',
    title: 'Electricity Price Uppsala 2026: Vattenfall Grid Fee per kWh',
    description: 'Electricity price in Uppsala 2026: SE3 and Vattenfall Eldistribution’s grid, which raised both its standing and per-kWh charges. Work out a house’s bill.',
    h1: 'Electricity price in Uppsala on Vattenfall Eldistribution’s grid',
    intro: 'Uppsala is one of Vattenfall Eldistribution’s grid areas and lies in bidding zone SE3.',
    resume: (h) => {
      const v = U(h);
      return `For an Uppsala house on a 16 A main fuse using 5,000 kWh a year, power currently costs about ${h.ore(v.p.total)} per kilowatt-hour, taking the Statistics Sweden (SCB) average for a variable contract in houses without electric heating in SE3 in ${mn(h, h.M.SENASTE_MANAD)} as the energy price (${h.ore(v.spot)} before VAT). The Uppsala grid area belongs to Vattenfall Eldistribution AB according to Svenska kraftnät’s Nätområden.se. In the Energy Markets Inspectorate’s data, Vattenfall’s grid rose more than most for ${h.P.year}: the house case costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, ${h.pct(v.okning)} more than in 2025. The transfer fee went from ${h.ore(v.f.priser[0])} to ${h.ore(v.t.priser[0])} per kWh before VAT, and the subscription rose too, leaving the grid at rank ${v.pl.plats} of ${v.pl.av} among house tariffs. With energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, the monthly bill comes to around ${h.kr(v.man.total)}. Switch to the flat case in the calculator if you rent a flat.`;
    },
    faqs: (h) => {
      const v = U(h);
      return [
        { q: 'Does Uppsala pay the same grid price as other Vattenfall customers?', a: `The Energy Markets Inspectorate lists Vattenfall Eldistribution’s local grids in two groups, Lokalnät Syd and Lokalnät Norr. ${v.lika ? 'For the 16 A house they carry exactly the same amounts in' : 'Their amounts differ in'} the ${h.P.year} table. Around Uppsala, Nätområden.se also lists Vattenfall areas Uppland Norra, Östra and Västra, while Uppland Södra belongs to E.ON.` },
        { q: 'How much did Vattenfall raise the Uppsala grid fee in 2026?', a: `For the 16 A house using 5,000 kWh, the grid cost rose from ${h.kr(v.f.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year including VAT, or ${h.pct(v.okning)}. Both the subscription and the transfer fee went up, according to the regulator. A smaller part comes from the state authority charges every grid company passes on, raised to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT.` },
        { q: 'What does a flat in Uppsala pay for the grid?', a: `The standard flat on 16 A using 2,000 kWh costs ${h.kr(v.lgh.totalKrPerAr * v.mo)} a year with VAT on Vattenfall’s grid in ${h.P.year}, of which ${h.kr(v.lgh.fastKrPerAr * v.mo)} is fixed charges. That is above the national median for flats. Choose the flat case in the calculator above to apply the per-kWh transfer fee to your own usage.` },
        { q: 'Is power more expensive in Uppsala than in Stockholm?', a: `Retail energy costs the same, since both cities are in SE3. The difference is the grid: Uppsala is on Vattenfall, while the Stockholm area belongs to Ellevio, each with its own price list. The regulator’s ${h.P.year} table has no house total for Ellevio, so compare the flat case on the two city pages rather than guessing.` },
      ];
    },
    body: (h) => {
      const v = U(h);
      return `<h2>Vattenfall’s grid cost in Uppsala, 2025 against ${h.P.year}</h2>
${h.table(['Standard case', '2025', String(h.P.year), 'Change'], v.rader.map((x) => [NAMN.en[x.k], h.kr(x.a.totalKrPerAr * v.mo), h.kr(x.b.totalKrPerAr * v.mo), h.pct(x.b.totalKrPerAr / x.a.totalKrPerAr - 1)]), `Grid cost per year incl. VAT, Vattenfall Eldistribution AB, Lokalnät Syd. Source: Energy Markets Inspectorate.`, ['l', 'r', 'r', 'r'])}
<p>The rise is across the board. Of the ${v.hojn} grids with a house price for both years, only ${v.fler} raised theirs by a larger percentage than Vattenfall. All four standard cases went up by a similar percentage, which tells you Vattenfall lifted both the standing charge and the price per kilowatt-hour. For the 16 A house, subscription and authority charges come to ${h.kr(v.t.fastKrPerAr * v.mo)} a year and transfer to ${h.ore(v.t.rorligOre * v.mo)} with VAT. The national median for the same house case is ${h.kr(v.med)}, so an Uppsala homeowner pays ${h.kr(v.t.totalKrPerAr * v.mo - v.med)} more than a household in the middle of the field.</p>
<h2>Retail energy matches Stockholm</h2>
<p>All of SE3 shares one spot price hour by hour, and the SCB variable price for houses in the zone was ${h.ore(v.spot)} before VAT in ${mn(h, h.M.SENASTE_MANAD)}. It is the grid, not the zone, that sets Uppsala apart from ${h.a('elpris-stockholm', 'Stockholm')}. See the ${h.a('elpris-se3', 'SE3 price page')} for the zone’s month-by-month path.</p>
<h2>Checking your own bill</h2>
<p>Vattenfall’s invoice splits the grid into subscription (abonnemang) and transfer (överföring), and your retailer’s invoice shows spot price and mark-up (påslag). Put them together in the ${h.a('elrakning', 'electricity bill calculator')} to see whether the total matches what you paid. To see where Vattenfall stands against other grid companies nationwide, open the ${h.a('jamfor-natavgift', 'grid fee comparison')} or the ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution page')}.</p>`;
    },
  },
});
