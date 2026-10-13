import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** SE2 : Umeå (UMA) et Sundsvall (SUV) selon Nätområden.se ; Umeå a l'avdrag (Västerbotten), Sundsvall non. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const umea = M.natTariff(M.hittaEnhet('Umeå Energi')!, 'V20')!;
  const sund = M.natTariff(M.hittaEnhet('Sundsvall Elnät')!, 'V20')!;
  const spot = M.varde('rorligt', 'SE2', '3')!;
  const pU = M.totalpris({ spot, natOverforing: umea.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const pS = M.totalpris({ spot, natOverforing: sund.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const aU = (pU.total * 20000) / 100 + umea.fastKrPerAr * mo;
  const aS = (pS.total * 20000) / 100 + sund.fastKrPerAr * mo;
  const s12 = M.senaste('rorligt', 'SE2', '3', 12);
  const s12se3 = M.senaste('rorligt', 'SE3', '3', 12);
  const snitt = s12.reduce((a, [, x]) => a + x, 0) / s12.length;
  const snitt3 = s12se3.reduce((a, [, x]) => a + x, 0) / s12se3.length;
  const s12se1 = M.senaste('rorligt', 'SE1', '3', 12);
  const snitt1 = s12se1.reduce((a, [, x]) => a + x, 0) / s12se1.length;
  return { mo, umea, sund, spot, pU, pS, aU, aS, snitt, snitt3, snitt1, fran: s12[0][0], till: s12[s12.length - 1][0] };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-se2',
  group: 'omrade',
  order: 20,
  tool: 'pris',
  toolProps: { nat: 'Umeå Energi', zon: 'SE2', fall: 'V20', skatt: 1 },
  related: ['elpris-umea', 'elpris-sundsvall', 'elpris-se1', 'elpris-se3', 'energiskatt'],
  sources: ['scbElpriser', 'natomraden', 'lse', 'eiNat'],
  sv: {
    slug: 'elpris-se2',
    nav: 'Elpris SE2 (Sundsvall)',
    card: 'Södra Norrland: två grannstäder med olika energiskatt.',
    title: 'Elpris SE2 2026: totalpris i Umeå, Sundsvall och Norrland',
    description: 'Elpris SE2 2026: SCB:s rörliga pris för en elvärmd villa, Umeå med sänkt energiskatt och Sundsvall utan. Räkna ut ditt totalpris per kWh inklusive moms.',
    h1: 'Elpris i SE2: samma spotpris, olika skatt i Umeå och Sundsvall',
    intro: 'SE2 sträcker sig över södra och mellersta Norrland. Inom området kan skatten skilja med nästan tio öre.',
    resume: (h) => {
      const v = V(h);
      return `En elvärmd villa i SE2 med rörligt avtal fakturerades ${h.ore(v.spot)} exklusive moms för elhandeln i ${mn(h, h.M.SENASTE_MANAD)}, enligt SCB. Spotpriset är detsamma i hela området, men totalpriset är det inte. Umeå ligger i Västerbottens län, där hushållen får det norrländska avdraget och betalar ${h.ore(h.P.skatt.energiskatt_sankt_ore)} i energiskatt. Sundsvall ligger i Västernorrland, där bara Sollefteå, Ånge och Örnsköldsvik har avdraget, så där gäller ${h.ore(h.P.skatt.energiskatt_ore)}. Med respektive stads nätavgift enligt Energimarknadsinspektionen blir totalpriset för en villa med 20 ampere ${h.ore(v.pU.total)} i Umeå och ${h.ore(v.pS.total)} i Sundsvall, moms inräknad. På 20 000 kWh om året blir skillnaden med fasta avgifter ${h.kr(v.aS - v.aU)}, alltså mer än vad många sparar på att byta elhandlare. Välj ditt eget nät i listan och skriv in dagens spotpris från elhandlaren.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vilka städer ligger i SE2?', a: 'Enligt Svenska kraftnäts karta på Nätområden.se hör nätområdena Umeå och Sundsvall tätort till SE2. Elområdet bestäms av ditt lokala elnät, så två adresser i samma kommun kan i undantagsfall höra till olika områden. Kontrollera ditt nätområde på Nätområden.se om du är osäker, till exempel om du bor i en mindre ort mellan städerna.' },
        { q: 'Är elen dyrare i SE2 än i SE1?', a: `Det beror på året. Under de tolv månaderna från ${mn(h, v.fran)} till ${mn(h, v.till)} var SCB:s snitt för rörligt avtal till en elvärmd villa ${h.ore(v.snitt1)} i SE1, ${h.ore(v.snitt)} i SE2 och ${h.ore(v.snitt3)} i SE3, exklusive moms. För din räkning väger skatten och nätet ofta tyngre än den skillnaden.` },
        { q: 'Varför har Örnsköldsvik lägre energiskatt än Sundsvall?', a: `Lagen om skatt på energi listar de kommuner där avdraget på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} gäller. I Västernorrlands län är det bara Sollefteå, Ånge och Örnsköldsvik. Sundsvall, Timrå, Härnösand och Kramfors står inte med och betalar därför full energiskatt, trots att de ligger i samma elområde och har samma spotpris.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Umeå och Sundsvall sida vid sida</h2>
${h.table(['', 'Umeå (Umeå Energi Elnät)', 'Sundsvall (Sundsvall Elnät)'], [['Energiskatt exkl. moms', h.ore(h.P.skatt.energiskatt_sankt_ore), h.ore(h.P.skatt.energiskatt_ore)], ['Överföringsavgift, snitt exkl. moms', h.ore(v.umea.rorligOre), h.ore(v.sund.rorligOre)], ['Fast nätavgift per år inkl. moms', h.kr(v.umea.fastKrPerAr * v.mo), h.kr(v.sund.fastKrPerAr * v.mo)], ['Totalpris per kWh inkl. moms', h.ore(v.pU.total), h.ore(v.pS.total)], ['Kostnad för 20 000 kWh per år', h.kr(v.aU), h.kr(v.aS)]], `Villa 20 A med elvärme. Elhandel: SCB, rörligt SE2, ${mn(h, h.M.SENASTE_MANAD)}. Nät: Energimarknadsinspektionen ${h.P.year}.`, ['l', 'r', 'r'])}
<p>Två faktorer drar åt samma håll i Umeå: skatteavdraget och ett nät som hör till de billigare i landet. I Sundsvall är både skatten och överföringsavgiften högre. Det visar varför ett elpris för »Norrland« inte säger mycket om din egen räkning; ${h.a('elpris-umea', 'Umeå')} och ${h.a('elpris-sundsvall', 'Sundsvall')} har egna sidor med fler detaljer.</p>
<h2>Så ser du om din kommun har sänkt skatt</h2>
<p>Avdraget gäller i Norrbottens, Västerbottens och Jämtlands län i sin helhet, i Sollefteå, Ånge och Örnsköldsvik i Västernorrland, i Ljusdal i Gävleborg, i Malung-Sälen, Mora, Orsa och Älvdalen i Dalarna och i Torsby i Värmland. Står din kommun där syns det på nätfakturan som en lägre energiskatt. Slå i så fall på reglaget i kalkylatorn. Guiden om ${h.a('energiskatt', 'energiskatt på el')} förklarar regeln och vad sänkningen från 2025 betydde.</p>
<h2>Elstödet för vintern 2026 i SE2</h2>
<p>För förbrukningen i januari och februari 2026 betalade staten ${h.num(h.P.elstod.ore_per_kwh.SE2)} öre per kWh till hushåll i SE2, samma belopp som i SE1 och betydligt mindre än i söder, där priserna var högre. Taket var ${h.num(h.P.elstod.tak_kwh)} kWh per bostad. En elvärmd villa i Sundsvall eller Umeå som använde maxbeloppet fick alltså ${h.kr((h.P.elstod.ore_per_kwh.SE2 * h.P.elstod.tak_kwh) / 100)}. Pengarna kom från Försäkringskassan utan ansökan och ändrade inte priset per kWh på fakturan. Läs mer om ${h.a('elstod', 'elstödet')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-se2',
    nav: 'Price SE2 (Sundsvall)',
    card: 'Southern Norrland: two nearby cities with different energy tax.',
    title: 'Electricity Price SE2 2026: All-in in Umeå and Sundsvall',
    description: 'Electricity price SE2 2026: Statistics Sweden variable price for a heated house, Umeå with reduced energy tax and Sundsvall without. Your all-in price per kWh.',
    h1: 'Electricity price in SE2: one spot price, two tax rates',
    intro: 'SE2 covers southern and central Norrland. Within the zone, tax can differ by almost ten öre.',
    resume: (h) => {
      const v = V(h);
      return `An electrically heated house in SE2 on a variable contract was billed ${h.ore(v.spot)} before VAT for its energy in ${mn(h, h.M.SENASTE_MANAD)}, according to Statistics Sweden. The spot price is the same throughout the zone, but the all-in price is not. Umeå lies in Västerbotten county, where households get the northern deduction and pay ${h.ore(h.P.skatt.energiskatt_sankt_ore)} in energy tax. Sundsvall is in Västernorrland, where only Sollefteå, Ånge and Örnsköldsvik have the deduction, so ${h.ore(h.P.skatt.energiskatt_ore)} applies. With each city’s grid fee from the Energy Markets Inspectorate, a 20 A house pays ${h.ore(v.pU.total)} in Umeå and ${h.ore(v.pS.total)} in Sundsvall, VAT included. Over 20,000 kWh a year the gap, fixed fees included, comes to ${h.kr(v.aS - v.aU)}. Pick your grid and enter today’s spot price.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Which cities are in SE2?', a: 'Svenska kraftnät’s map on Nätområden.se puts the Umeå and Sundsvall urban grid areas in SE2. Your zone follows your local grid, so in rare cases two addresses in the same municipality belong to different zones. Check your grid area on Nätområden.se if you are unsure.' },
        { q: 'Is electricity dearer in SE2 than in SE1?', a: `It depends on the year. Over the twelve months from ${mn(h, v.fran)} to ${mn(h, v.till)}, the SCB average for a variable contract for a heated house was ${h.ore(v.snitt1)} in SE1, ${h.ore(v.snitt)} in SE2 and ${h.ore(v.snitt3)} in SE3, before VAT. For your own bill, tax and grid often weigh more than that gap.` },
        { q: 'Why does Örnsköldsvik pay less energy tax than Sundsvall?', a: `The Energy Tax Act lists the municipalities where the ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction applies. In Västernorrland county only Sollefteå, Ånge and Örnsköldsvik are listed. Sundsvall, Timrå, Härnösand and Kramfors are not, so they pay full energy tax despite sharing the zone and its spot price.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Umeå and Sundsvall side by side</h2>
${h.table(['', 'Umeå (Umeå Energi Elnät)', 'Sundsvall (Sundsvall Elnät)'], [['Energy tax before VAT', h.ore(h.P.skatt.energiskatt_sankt_ore), h.ore(h.P.skatt.energiskatt_ore)], ['Transfer fee, average before VAT', h.ore(v.umea.rorligOre), h.ore(v.sund.rorligOre)], ['Fixed grid fee per year incl. VAT', h.kr(v.umea.fastKrPerAr * v.mo), h.kr(v.sund.fastKrPerAr * v.mo)], ['All-in price per kWh incl. VAT', h.ore(v.pU.total), h.ore(v.pS.total)], ['Cost of 20,000 kWh a year', h.kr(v.aU), h.kr(v.aS)]], `20 A house with electric heating. Energy: Statistics Sweden, variable SE2, ${mn(h, h.M.SENASTE_MANAD)}. Grid: Energy Markets Inspectorate ${h.P.year}.`, ['l', 'r', 'r'])}
<p>In Umeå two factors pull the same way: the tax deduction and a grid among the cheaper ones in the country. In Sundsvall both tax and transfer fee are higher. It shows why an electricity price for “Norrland” says little about your own bill; ${h.a('elpris-umea', 'Umeå')} and ${h.a('elpris-sundsvall', 'Sundsvall')} have their own pages with more detail.</p>
<h2>Checking whether your municipality has the lower tax</h2>
<p>The deduction covers the whole of Norrbotten, Västerbotten and Jämtland counties, Sollefteå, Ånge and Örnsköldsvik in Västernorrland, Ljusdal in Gävleborg, Malung-Sälen, Mora, Orsa and Älvdalen in Dalarna, and Torsby in Värmland. If you live there, your grid bill shows a lower energy tax line; switch on the setting in the calculator. The guide to ${h.a('energiskatt', 'energy tax on electricity')} explains the rule and what the cut from 2025 meant.</p>
<h2>The winter 2026 support in SE2</h2>
<p>For consumption in January and February 2026 the state paid ${h.num(h.P.elstod.ore_per_kwh.SE2)} öre per kWh to households in SE2, the same as SE1 and much less than in the south, where prices ran higher. The cap was ${h.num(h.P.elstod.tak_kwh)} kWh per home, so a heated house in Sundsvall or Umeå using the maximum received ${h.kr((h.P.elstod.ore_per_kwh.SE2 * h.P.elstod.tak_kwh) / 100)}. Försäkringskassan paid it without any application, and it did not change the price per kWh on the bill. More on the ${h.a('elstod', 'electricity support')}.</p>`;
    },
  },
});
