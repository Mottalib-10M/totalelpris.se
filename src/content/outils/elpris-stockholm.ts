import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Stockholm : nätområde STH (Ellevio AB, SE3, Nätområden.se) ; tarif Ei « Ellevio AB, Mellansverige ». */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Ellevio', 'Mellansverige')!;
  const t = M.natTariff(e, 'L16')!;
  const t25 = M.natTariff(e, 'L16', 2025)!;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const liten = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const stor = M.manadskostnad({ kwh: 5000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'L16');
  const { ar, man } = M.manadDelar(M.SENASTE_MANAD);
  const s = M.senaste('rorligt', 'SE3', '1', 12);
  const lag = s.reduce((a, b) => (b[1] < a[1] ? b : a)), hog = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { mo, e, t, t25, spot, p, liten, stor, pl, ar, man, lag, hog, med: pl.median * mo };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-stockholm',
  group: 'stad',
  order: 10,
  tool: 'pris',
  toolProps: { nat: 'Ellevio|Mellansverige', zon: 'SE3', fall: 'L16' },
  related: ['elpris-se3', 'ellevio', 'jamfor-natavgift', 'elpris-uppsala', 'elrakning'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-stockholm',
    nav: 'Stockholm',
    card: 'Totalpriset per kWh i Stockholm med Ellevios nät, SE3.',
    title: 'Elpris Stockholm 2026: totalpris per kWh med Ellevios nät',
    description: 'Elpris i Stockholm 2026: SE3, Ellevios överföringsavgift och energiskatt 36 öre. Räkna ut ditt totalpris per kWh och vad elen kostar en lägenhet i månaden.',
    h1: 'Elpris i Stockholm: totalpriset med Ellevios nätavgift',
    intro: 'Stockholm ligger i elområde SE3 och elnätet i staden ägs av Ellevio.',
    resume: (h) => {
      const v = V(h);
      return `I Stockholm betalar en lägenhet med 16 ampere i dag ungefär ${h.ore(v.p.total)} per kilowattimme när spotpriset är SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} exklusive moms. Resten av priset kommer från Ellevio, som äger nätområdet Stockholm enligt Svenska kraftnäts karta: en överföringsavgift på ${h.ore(v.t.rorligOre)} exklusive moms och en fast avgift på ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms, enligt Energimarknadsinspektionens uppgifter för ${h.P.year}. Därtill energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och 25 procent moms. För en liten lägenhet med 2 000 kWh om året blir räkningen omkring ${h.kr(v.liten.total)} i månaden, för en större med 5 000 kWh omkring ${h.kr(v.stor.total)}. Byt spotpriset mot dagens pris från din elhandlare för att se vad elen kostar just nu, timme för timme.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vilket elnätsbolag har jag i Stockholm?', a: `Nätområdet Stockholm ägs av Ellevio enligt Svenska kraftnäts tjänst Nätområden.se. Delar av länet ligger i andra nätområden med andra ägare, så kontrollera namnet på din elnätsfaktura eller slå upp adressen på Nätområden.se innan du jämför priser. Nätföretaget kan du inte byta, bara elhandlaren.` },
        { q: 'Hur mycket har Ellevios nätavgift ändrats sedan 2025?', a: `För typfallet lägenhet med 16 ampere och 2 000 kWh om året redovisar Energimarknadsinspektionen ${h.kr(v.t.totalKrPerAr * v.mo)} för ${h.P.year} mot ${h.kr(v.t25.totalKrPerAr * v.mo)} för 2025, med moms. Ändringen beror både på Ellevios prislista och på att myndighetsavgifterna höjdes till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året.` },
        { q: 'Är elen dyrare i Stockholm än i resten av SE3?', a: `Spotpriset är detsamma i hela SE3. Skillnaden ligger i nätavgiften: för en lägenhet hamnar Ellevios nätområde på plats ${v.pl.plats} av ${v.pl.av} i Energimarknadsinspektionens sammanställning, där 1 är billigast. Medianen för hela landet är ${h.kr(v.med)} om året med moms, så skillnaden mot ett billigt nät kan vara flera hundra kronor.` },
        { q: 'Varför visar ni bara lägenhet för Ellevio?', a: `Energimarknadsinspektionens tabell för ${h.P.year} har inget totalbelopp för Ellevios villakunder, som har en tariff med effektavgift. Vi gissar inte. Välj ett annat typfall i kalkylatorn för att se om ett pris finns, eller lägg in villans överföringsavgift från Ellevios prislista som påslag.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Vad elen kostar en lägenhet i Stockholm</h2>
${h.table(['Del av priset', 'Öre per kWh inkl. moms'], [['Elhandel, SCB-snitt rörligt SE3', h.ore(v.spot * v.mo)], ['Ellevios överföringsavgift', h.ore(v.t.rorligOre * v.mo)], ['Energiskatt', h.ore(h.P.skatt.energiskatt_ore * v.mo)], ['Totalt rörligt', h.ore(v.p.total)]], `Lägenhet 16 A, SE3. Elhandel: SCB, ${mn(h, h.M.SENASTE_MANAD)}. Nät: Energimarknadsinspektionen, ${h.P.year}.`, ['l', 'r'])}
<p>I en stockholmsetta är det den fasta delen som gör priset högt per kilowattimme. Ellevios abonnemang och myndighetsavgifterna kostar ${h.kr(v.t.fastKrPerAr * v.mo)} om året oavsett hur mycket du använder. Med 2 000 kWh blir snittet ${h.ore(v.liten.snittOre)}, med 5 000 kWh ${h.ore(v.stor.snittOre)}. Den som flyttar från en villa till en lägenhet i innerstaden ser därför ofta ett högre pris per kWh men en lägre räkning.</p>
<h2>Spotpriset i SE3 under det senaste året</h2>
<p>Stockholm delar elområde med Göteborg, Uppsala och Linköping. Enligt SCB var det rörliga priset för lägenheter i SE3 lägst i ${mn(h, v.lag[0])} med ${h.ore(v.lag[1])} och högst i ${mn(h, v.hog[0])} med ${h.ore(v.hog[1])}, exklusive moms och med påslaget inräknat. Vinterns toppar i SE3 kommer ofta när kärnkraft står still för revision samtidigt som det är kallt och vindstilla; då räcker inte överföringen från norr. Se ${h.a('elpriser-per-manad', 'elpriser per månad')} för hela serien.</p>
<h2>Så får du ner kostnaden i Stockholm</h2>
<p>Nätavgiften går inte att påverka genom att byta bolag, men du kan välja elhandlare och avtal fritt. Har du kvartsprisavtal lönar det sig att köra ${h.a('kostnad-tvattmaskin', 'tvättmaskinen')} och ${h.a('kostnad-diskmaskin', 'diskmaskinen')} när priset är lågt, vilket i SE3 oftast är mitt på dagen en solig dag eller sent på natten. Med rörligt månadspris spelar tidpunkten ingen roll för fakturan. ${h.a('fast-eller-rorligt', 'Jämför fast och rörligt')} med SCB:s siffror för SE3.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-stockholm',
    nav: 'Stockholm',
    card: 'All-in price per kWh in Stockholm on Ellevio’s grid, SE3.',
    title: 'Electricity Price Stockholm 2026: All-in per kWh, Ellevio',
    description: 'Electricity price in Stockholm 2026: SE3 zone, Ellevio’s transfer fee and the 36 öre energy tax. Work out your all-in price per kWh and a flat’s monthly bill.',
    h1: 'Electricity price in Stockholm: the all-in price on Ellevio’s grid',
    intro: 'Stockholm is in bidding zone SE3, and the city grid is owned by Ellevio.',
    resume: (h) => {
      const v = V(h);
      return `In Stockholm a flat with a 16 A main fuse currently pays about ${h.ore(v.p.total)} per kilowatt-hour when the spot price is the Statistics Sweden average for a variable contract in SE3 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. The rest of the price comes from Ellevio, which owns the Stockholm grid area according to Svenska kraftnät’s map: a transfer fee of ${h.ore(v.t.rorligOre)} before VAT and a fixed fee of ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT, in the Energy Markets Inspectorate’s ${h.P.year} figures. Add energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and 25% VAT. A small flat using 2,000 kWh a year pays around ${h.kr(v.liten.total)} a month; a larger one using 5,000 kWh around ${h.kr(v.stor.total)}. Replace the spot price with today’s price from your retailer to see what power costs right now.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Which grid company do I have in Stockholm?', a: `The Stockholm grid area belongs to Ellevio according to Svenska kraftnät’s Nätområden.se. Parts of the county sit in other grid areas with other owners, so check the name on your grid bill or look up your address before comparing. You cannot switch grid company, only your electricity retailer.` },
        { q: 'How much has Ellevio’s grid fee changed since 2025?', a: `For the standard 16 A flat using 2,000 kWh a year, the Energy Markets Inspectorate lists ${h.kr(v.t.totalKrPerAr * v.mo)} for ${h.P.year} against ${h.kr(v.t25.totalKrPerAr * v.mo)} for 2025, VAT included. The change reflects both Ellevio’s price list and the rise in state authority charges to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year.` },
        { q: 'Is power dearer in Stockholm than elsewhere in SE3?', a: `The spot price is identical across SE3. The difference lies in the grid fee: for a flat, Ellevio’s area ranks ${v.pl.plats} of ${v.pl.av} in the regulator’s compilation, where 1 is cheapest. The national median is ${h.kr(v.med)} a year with VAT, so the gap to a cheap grid can run to several hundred kronor.` },
        { q: 'Why is only the flat case shown for Ellevio?', a: `The regulator’s ${h.P.year} table has no total for Ellevio’s house customers, who are on a tariff with a power charge. We do not guess. Pick another standard case in the calculator to see whether a price exists, or add the house transfer fee from Ellevio’s price list as a mark-up.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>What power costs a Stockholm flat</h2>
${h.table(['Part of the price', 'Öre per kWh incl. VAT'], [['Retail energy, SCB variable average SE3', h.ore(v.spot * v.mo)], ['Ellevio transfer fee', h.ore(v.t.rorligOre * v.mo)], ['Energy tax', h.ore(h.P.skatt.energiskatt_ore * v.mo)], ['Total variable', h.ore(v.p.total)]], `Flat, 16 A, SE3. Energy: Statistics Sweden, ${mn(h, h.M.SENASTE_MANAD)}. Grid: Energy Markets Inspectorate, ${h.P.year}.`, ['l', 'r'])}
<p>In a one-room Stockholm flat it is the fixed part that pushes the price per kilowatt-hour up. Ellevio’s subscription and the authority charges cost ${h.kr(v.t.fastKrPerAr * v.mo)} a year however little you use. At 2,000 kWh the average is ${h.ore(v.liten.snittOre)}, at 5,000 kWh ${h.ore(v.stor.snittOre)}. Newcomers moving from a house abroad into a city flat often see a higher price per kWh on a much smaller bill.</p>
<h2>The SE3 spot price over the past year</h2>
<p>Stockholm shares its zone with Gothenburg, Uppsala and Linköping. According to Statistics Sweden, the variable price for flats in SE3 was lowest in ${mn(h, v.lag[0])} at ${h.ore(v.lag[1])} and highest in ${mn(h, v.hog[0])} at ${h.ore(v.hog[1])}, before VAT and with the mark-up included. Winter peaks in SE3 tend to come when nuclear units are down for maintenance during cold, still weather and the lines from the north are full. See ${h.a('elpriser-per-manad', 'electricity prices by month')} for the full series.</p>
<h2>Cutting the bill in Stockholm</h2>
<p>You cannot lower the grid fee by switching company, but you choose your retailer and contract freely; as a newcomer you are placed on a default contract (anvisat avtal) until you pick one, often at a higher price. On a quarter-hour contract it pays to run the ${h.a('kostnad-tvattmaskin', 'washing machine')} and ${h.a('kostnad-diskmaskin', 'dishwasher')} when prices are low, which in SE3 is usually midday on a sunny day or late at night. On a variable monthly price, timing does not change the bill. ${h.a('fast-eller-rorligt', 'Compare fixed and variable')} with Statistics Sweden figures for SE3.</p>`;
    },
  },
});
