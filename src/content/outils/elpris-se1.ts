import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** SE1 : zone nord (Luleå, Skellefteå, Kiruna selon Nätområden.se) ; taux réduit d'energiskatt en Norrbotten. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Luleå Energi')!;
  const t = M.natTariff(e, 'V16')!;
  const spot = M.varde('rorligt', 'SE1', '2')!;
  const sankt = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const normal = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const ar = [2022, 2023, 2024, 2025].map((y) => ({ y, se1: M.arssnitt('rorligt', 'SE1', '2', y)!.snitt, se4: M.arssnitt('rorligt', 'SE4', '2', y)!.snitt }));
  const s = M.serie('rorligt', 'SE1', '2');
  const max = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  const stod = P.elstod.ore_per_kwh.SE1;
  return { mo, e, t, spot, sankt, normal, ar, max, stod, villaVinter: Math.min(P.elstod.tak_kwh, 7900) };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-se1',
  group: 'omrade',
  order: 10,
  tool: 'pris',
  toolProps: { nat: 'Luleå Energi', zon: 'SE1', fall: 'V16', skatt: 1 },
  related: ['elpris-lulea', 'elpris-se2', 'energiskatt', 'elomraden', 'elpriser-per-manad'],
  sources: ['scbElpriser', 'natomraden', 'lse', 'eiNat'],
  sv: {
    slug: 'elpris-se1',
    nav: 'Elpris SE1 (Luleå)',
    card: 'Norra Norrland: lägst spotpris och sänkt energiskatt.',
    title: 'Elpris SE1 2026: totalpris i Luleå och Norrbotten per kWh',
    description: 'Elpris SE1 2026: rörligt avtal enligt SCB, sänkt energiskatt 26,4 öre i Norrbotten och Luleå Energis nätavgift. Räkna ut ditt eget pris per kWh med moms.',
    h1: 'Elpris i SE1: norra Sveriges pris med sänkt energiskatt',
    intro: 'SE1 är det nordligaste elområdet, med Luleå, Skellefteå och Boden, och oftast det billigaste.',
    resume: (h) => {
      const v = V(h);
      return `I elområde SE1 kostade ett rörligt elavtal för en villa utan elvärme ${h.ore(v.spot)} exklusive moms i ${mn(h, h.M.SENASTE_MANAD)} enligt SCB, påslaget inräknat. Det är den lägsta nivån av de fyra områdena. Två saker gör totalpriset ännu lägre för många här. I hela Norrbottens län, liksom i Västerbotten och Jämtland, får hushållen ett avdrag på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} på energiskatten, som därför blir ${h.ore(h.P.skatt.energiskatt_sankt_ore)} i stället för ${h.ore(h.P.skatt.energiskatt_ore)}. Och nätföretag som Luleå Energi Elnät hör till de billigare i Energimarknadsinspektionens sammanställning. En villa med 16 ampere i Luleå betalar med SCB:s snittpris ${h.ore(v.sankt.total)} med moms, mot ${h.ore(v.normal.total)} utan skatteavdraget. Skriv in dagens spotpris i kalkylatorn för att se ditt eget totalpris, och välj ett annat nät om du bor utanför Luleå.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vilka orter ligger i elområde SE1?', a: 'Enligt Svenska kraftnäts karta på Nätområden.se ligger bland annat nätområdena Luleå, Skellefteå och Boden i SE1. Gränsen följer elnäten och inte länen, så slå upp just ditt nätområde där om du bor nära gränsen mot SE2. Sökningen görs på nätområdets namn eller kod, eller på kommunen.' },
        { q: 'Varför är elen billigare i SE1 än i söder?', a: `Det produceras mer el i norr än som används där, och ledningarna söderut räcker inte alltid till. Då blir priset lägre i norr. Under 2025 var SCB:s snitt för rörligt avtal i SE1 ${h.ore(v.ar[3].se1)} och i SE4 ${h.ore(v.ar[3].se4)}, båda exklusive moms och för en villa utan elvärme.` },
        { q: 'Hur stort var elstödet 2026 i SE1?', a: `Stödet för förbrukningen i januari och februari 2026 var ${h.num(v.stod)} öre per kWh i SE1, samma som i SE2, upp till ${h.num(h.P.elstod.tak_kwh)} kWh per bostad. Det betalades av Försäkringskassan från juni 2026 till den som stod på elnätsavtalet den 28 februari, utan ansökan.` },
        { q: 'Gäller den sänkta energiskatten alla i SE1?', a: `Avdraget på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} gäller hushåll och tjänsteföretag i de kommuner som räknas upp i lagen, och hela Norrbottens och Västerbottens län finns med. Industri, jordbruk och några andra verksamheter omfattas inte. Nätföretaget gör avdraget direkt på fakturan; du behöver inte söka.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = v.ar.map((x) => [String(x.y), h.ore(x.se1 * v.mo), h.ore(x.se4 * v.mo), h.ore((x.se4 - x.se1) * v.mo)]);
      return `<h2>Fyra år av rörligt pris: SE1 mot SE4</h2>
${h.table(['År', 'SE1 inkl. moms', 'SE4 inkl. moms', 'Skillnad'], rader, 'SCB, rörligt avtal, villa utan elvärme, årssnitt av månadspriser. Energiskatt och nät ingår inte.', ['l', 'r', 'r', 'r'])}
<p>Gapet mot söder har varit stort varje år sedan 2022. Den dyraste månaden i SCB:s serie för SE1 var ${mn(h, v.max[0])} med ${h.ore(v.max[1])} exklusive moms. Även i norr kan alltså en kall och torr vinter ge höga priser, men topparna har legat långt under södra Sveriges.</p>
<h2>Skatteavdraget i Norrbotten, räknat på en villa</h2>
<p>Avdraget på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} exklusive moms blir ${h.ore(h.P.skatt.norrlandsavdrag_ore * v.mo)} med moms. För en elvärmd villa som använder 20 000 kWh om året är det ${h.kr((20000 * h.P.skatt.norrlandsavdrag_ore * v.mo) / 100)} mindre i skatt per år. Med ${h.a('energiskatt', 'energiskatten')} på normal nivå hade samma villa betalat det beloppet till staten i stället.</p>
<h2>Nätet i SE1: Luleå Energi som exempel</h2>
<p>Luleå Energi Elnät tar för en villa med 16 ampere en fast avgift på ${h.kr(v.t.fastKrPerAr * v.mo)} om året och ${h.ore(v.t.rorligOre * v.mo)}, båda med moms, enligt Energimarknadsinspektionen för ${h.P.year}. Bor du utanför Luleå har du ett annat nätföretag; välj det i kalkylatorn eller ${h.a('jamfor-natavgift', 'jämför alla nätområden')}. Mer om staden på sidan ${h.a('elpris-lulea', 'elpris i Luleå')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-se1',
    nav: 'Price SE1 (Luleå)',
    card: 'Northern Norrland: lowest spot price and reduced energy tax.',
    title: 'Electricity Price SE1 2026: All-in Price in Luleå per kWh',
    description: 'Electricity price SE1 2026: variable contract per Statistics Sweden, 26.4 öre reduced energy tax in Norrbotten and Luleå Energi’s grid fee. Your price per kWh.',
    h1: 'Electricity price in SE1: the northern zone with reduced energy tax',
    intro: 'SE1 is Sweden’s northernmost bidding zone, home to Luleå, Skellefteå and Boden, and usually the cheapest.',
    resume: (h) => {
      const v = V(h);
      return `In bidding zone SE1 a variable electricity contract for a house without electric heating cost ${h.ore(v.spot)} before VAT in ${mn(h, h.M.SENASTE_MANAD)} according to Statistics Sweden (SCB), the retailer’s mark-up included. That is the lowest of the four zones. Two things push the all-in price lower still for many residents. Throughout Norrbotten county, as in Västerbotten and Jämtland, households get a deduction of ${h.ore(h.P.skatt.norrlandsavdrag_ore)} on energy tax, which therefore comes to ${h.ore(h.P.skatt.energiskatt_sankt_ore)} instead of ${h.ore(h.P.skatt.energiskatt_ore)}. And grid companies such as Luleå Energi Elnät are among the cheaper ones in the Energy Markets Inspectorate’s figures. A 16 A house in Luleå pays ${h.ore(v.sankt.total)} with VAT at the SCB average, against ${h.ore(v.normal.total)} without the tax deduction. Enter today’s spot price to see your own figure.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Which towns are in bidding zone SE1?', a: 'Svenska kraftnät’s map on Nätområden.se places grid areas such as Luleå, Skellefteå and Boden in SE1. The border follows local grids, not counties, so look up your own grid area there if you live near the SE2 line. You can search by grid-area name or code, or by municipality.' },
        { q: 'Why is power cheaper in SE1 than in the south?', a: `More electricity is generated in the north than is used there, and the lines southwards are not always big enough, so northern prices fall. In 2025 the SCB average for a variable contract was ${h.ore(v.ar[3].se1)} in SE1 and ${h.ore(v.ar[3].se4)} in SE4, both before VAT for a house without electric heating.` },
        { q: 'How large was the 2026 electricity support in SE1?', a: `The support for January and February 2026 consumption was ${h.num(v.stod)} öre per kWh in SE1, the same as SE2, up to ${h.num(h.P.elstod.tak_kwh)} kWh per home. Försäkringskassan paid it from June 2026 to whoever held the grid contract on 28 February, with no application needed.` },
        { q: 'Does everyone in SE1 get the lower energy tax?', a: `The ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction applies to households and service businesses in the municipalities listed in the Energy Tax Act, and all of Norrbotten and Västerbotten counties are on the list. Industry, farming and some other activities are excluded. The grid company applies it on the bill; there is nothing to claim.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = v.ar.map((x) => [String(x.y), h.ore(x.se1 * v.mo), h.ore(x.se4 * v.mo), h.ore((x.se4 - x.se1) * v.mo)]);
      return `<h2>Four years of variable prices: SE1 against SE4</h2>
${h.table(['Year', 'SE1 incl. VAT', 'SE4 incl. VAT', 'Gap'], rader, 'Statistics Sweden, variable contract, house without electric heating, yearly average of monthly prices. Energy tax and grid not included.', ['l', 'r', 'r', 'r'])}
<p>The gap to the south has been wide every year since 2022. The dearest month in the SCB series for SE1 was ${mn(h, v.max[0])} at ${h.ore(v.max[1])} before VAT. So a cold, dry winter can push northern prices up too, but the peaks have stayed well below southern Sweden’s.</p>
<h2>The Norrbotten tax deduction on a real house</h2>
<p>The deduction of ${h.ore(h.P.skatt.norrlandsavdrag_ore)} before VAT is ${h.ore(h.P.skatt.norrlandsavdrag_ore * v.mo)} with VAT. For an electrically heated house using 20,000 kWh a year that is ${h.kr((20000 * h.P.skatt.norrlandsavdrag_ore * v.mo) / 100)} less tax per year. At the standard rate of ${h.a('energiskatt', 'energy tax')} the same house would pay that amount to the state instead.</p>
<h2>The grid in SE1: Luleå Energi as an example</h2>
<p>For a 16 A house Luleå Energi Elnät charges a fixed fee of ${h.kr(v.t.fastKrPerAr * v.mo)} a year and ${h.ore(v.t.rorligOre * v.mo)}, both with VAT, in the Energy Markets Inspectorate’s ${h.P.year} data. Outside Luleå you have a different grid company: pick it in the calculator or ${h.a('jamfor-natavgift', 'compare every grid area')}. More on the city on ${h.a('elpris-lulea', 'electricity price in Luleå')}.</p>`;
    },
  },
});
