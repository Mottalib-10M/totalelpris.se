/** Accueil (page pilier, RECETTE §5) : textes des deux langues, chiffres tirés des paramètres, de SCB et d'Ei. */
import type { Helpers, FAQ } from '../lib/guide-types';
import type { Zon } from '../lib/engine/scb';

export interface HomeText {
  title: string; description: string; h1: string; intro: string;
  resume: (h: Helpers) => string; faqs: (h: Helpers) => FAQ[]; body: (h: Helpers) => string;
}

const MAN_SV = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
const MAN_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Valeurs communes : exemple d'un appartement à Stockholm (Ellevio, SE3) et d'une villa à Malmö (E.ON, SE4). */
const V = (h: Helpers) => {
  const { P, M } = h;
  const m = M.SENASTE_MANAD;
  const { ar, man } = M.manadDelar(m);
  const mo = 1 + P.skatt.moms;
  const zoner = (['SE1', 'SE2', 'SE3', 'SE4'] as Zon[]).map((z) => ({ z, rorligt: M.varde('rorligt', z, '1')!, fast1: M.varde('avtal1ar', z, '1')!, villa: M.varde('rorligt', z, '3')! }));
  const sthlm = M.hittaEnhet('Ellevio', 'Mellansverige')!;
  const tS = M.natTariff(sthlm, 'L16')!;
  const spotS = M.varde('rorligt', 'SE3', '1')!;
  const pS = M.totalpris({ spot: spotS, natOverforing: tS.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const mS = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: pS.total, natFastKrPerAr: tS.fastKrPerAr * mo });
  const malmo = M.hittaEnhet('E.ON Energidistribution', 'Syd')!;
  const tM = M.natTariff(malmo, 'V20')!;
  const spotM = M.varde('rorligt', 'SE4', '3')!;
  const pM = M.totalpris({ spot: spotM, natOverforing: tM.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const mM = M.manadskostnad({ kwh: 20000 / 12, prisTotalOre: pM.total, natFastKrPerAr: tM.fastKrPerAr * mo });
  const rL = M.rangordna('L16');
  const rV = M.rangordna('V20');
  const s4 = M.serie('rorligt', 'SE4', '2');
  const topp = s4.reduce((a, b) => (b[1] > a[1] ? b : a));
  const a25 = (z: Zon) => M.arssnitt('rorligt', z, '2', 2025)!.snitt;
  const jam = M.jamforAvtal('SE3', '2', 1000);
  return { m, ar, man, mo, zoner, sthlm, tS, spotS, pS, mS, malmo, tM, spotM, pM, mM, rL, rV, topp, a25, jam,
    skatt: P.skatt.energiskatt_ore, skattInkl: P.skatt.energiskatt_ore * mo, sankt: P.skatt.energiskatt_sankt_ore, skatt25: P.skatt.energiskatt_2025_ore,
    medL: M.median(rL.map((x) => x.t.totalKrPerAr)) * mo, medV: M.median(rV.map((x) => x.t.totalKrPerAr)) * mo };
};
const manad = (h: Helpers, m: number, ar: number) => `${(h.lang === 'sv' ? MAN_SV : MAN_EN)[m - 1]} ${ar}`;
const topp = (h: Helpers, mm: string) => { const { ar, man } = h.M.manadDelar(mm); return manad(h, man, ar); };

export const HOME: Record<'sv' | 'en', HomeText> = {
  sv: {
    title: 'Elpris idag 2026: ditt totalpris per kWh med skatt och nät',
    description: 'Elpris idag 2026: skriv in spotpriset och se vad du betalar per kWh med energiskatt 36 öre, moms och ditt elnätsföretags avgift, för SE1 till SE4.',
    h1: 'Elpris idag: vad elen kostar dig per kWh, med skatt och nätavgift',
    intro: 'Spotpriset är bara en del av priset. Här räknar du ut resten för ditt elnät.',
    resume: (h) => {
      const v = V(h);
      return `Elpriset du ser i appar och på elbörsens tavlor är spotpriset utan moms, och det är sällan mer än hälften av vad en kilowattimme kostar dig. Ovanpå kommer elhandlarens påslag, elnätsföretagets överföringsavgift, energiskatten på ${h.ore(v.skatt)} exklusive moms ${h.P.year} och till sist 25 procent moms på allt, även på skatten. Ett exempel: en lägenhet i Stockholm med Ellevios nät och SCB:s snittpris för rörligt avtal i SE3 i ${manad(h, v.man, v.ar)}, ${h.ore(v.spotS)}, betalar ${h.ore(v.pS.total)} per kilowattimme, och med de fasta avgifterna omkring ${h.kr(v.mS.total)} i månaden för 2 000 kWh om året. Skriv in ditt eget spotpris eller klistra in dagens 96 kvartspriser, välj ditt nätområde bland Energimarknadsinspektionens ${h.num(v.rL.length)} och se totalpriset, den billigaste tiden och vad en tvätt eller en laddning kostar.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Varför visar ni inte dagens spotpris direkt?', a: `Dagspriserna sätts på elbörsen och ägs av den. ENTSO-E:s lista över data som får återanvändas fritt omfattar inte day-ahead-priserna, och elbörsen säljer licenser för att visa dem. Vi återpublicerar därför inga spotpriser. Du ser dagens pris gratis i din elhandlares app eller på ENTSO-E:s transparensplattform och skriver in det här.` },
        { q: 'Hur mycket av mitt elpris är skatt?', a: `Energiskatten är ${h.ore(v.skatt)} exklusive moms ${h.P.year}, ${h.ore(v.skattInkl)} med moms. Momsen på 25 procent läggs på spotpris, påslag, nätavgift och skatt. Med ett spotpris kring en krona per kWh går ungefär en tredjedel av det rörliga priset till staten.` },
        { q: 'Vad är energiskatten i norra Sverige?', a: `I Norrbottens, Västerbottens och Jämtlands län och i några kommuner i Västernorrland, Gävleborg, Dalarna och Värmland gör nätföretaget ett avdrag på ${h.ore(h.P.skatt.norrlandsavdrag_ore)}. Hushållen betalar då ${h.ore(v.sankt)} exklusive moms. Slå på reglaget för sänkt energiskatt i kalkylatorn om du bor där.` },
        { q: 'Vilket elområde bor jag i?', a: `Elområdet hör till ditt lokala elnät, inte till länet. Svenska kraftnäts karta på Nätområden.se visar vilket nätområde och elområde din adress tillhör. Stockholm, Göteborg, Uppsala och Linköping ligger i SE3, Malmö, Lund, Helsingborg och Växjö i SE4, Umeå och Sundsvall i SE2 och Luleå och Skellefteå i SE1.` },
        { q: 'Vad kostar nätavgiften i mitt område?', a: `Det beror helt på nätföretaget. Enligt Energimarknadsinspektionens sammanställning för ${h.P.year} betalar en lägenhet med 16 ampere och 2 000 kWh mellan ${h.kr(v.rL[0].t.totalKrPerAr * v.mo)} och ${h.kr(v.rL[v.rL.length - 1].t.totalKrPerAr * v.mo)} om året med moms, medianen är ${h.kr(v.medL)}. Jämförelsen per nätområde finns på sidan om nätavgifter.` },
        { q: 'Är rörligt elpris billigare än fast pris just nu?', a: `Under de senaste tolv månader som SCB publicerat kostade elenergin för en villa utan elvärme i SE3 med 1 000 kWh i månaden ${h.kr(v.jam[0].kr * v.mo)} med rörligt pris och ${h.kr(v.jam[1].kr * v.mo)} med ettårigt fastpris, moms inräknad. Det kan vända ett kallt år; sidan om fast eller rörligt räknar för ditt elområde.` },
        { q: 'När kommer morgondagens elpriser?', a: `Elbörsens auktion för nästa dygn hålls klockan ${h.P.marknad.auktion_kl} dagen före, och priserna publiceras i början av eftermiddagen. Sedan den 1 oktober 2025 sätts ett pris per kvart, 96 priser per dygn. Klistra in dem på sidan om morgondagens elpris för att se totalpriset och den billigaste tiden.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = v.zoner.map((z) => [z.z, h.ore(z.rorligt * v.mo), h.ore(z.fast1 * v.mo), h.ore((z.rorligt + v.skatt) * v.mo)]);
      return `<div class="not-prose my-6 border-l-4 border-accent-600 bg-accent-50 px-5 py-4 text-navy-800"><p class="text-sm font-semibold uppercase tracking-wide text-navy-700">Därför står inget spotpris på den här sidan</p><p class="mt-2">Spotpriserna sätts varje dag vid elbörsens auktion och ägs av börsen. ENTSO-E:s villkor tillåter fri återanvändning av en lista med data, och day-ahead-priserna finns inte med på den. Många sajter visar dem ändå, utan licens. Vi gör det inte. Kalkylatorn är förifylld med SCB:s officiella snittpris för rörligt avtal i ditt elområde, och du byter det mot dagens pris från din elhandlares app eller ${h.src('entsoe', 'ENTSO-E:s transparensplattform')}.</p></div>
<h2>Fyra elområden, fyra priser före skatt</h2>
<p>Sverige är indelat i fyra elområden sedan 2011, numrerade från norr till söder. Inom ett elområde är spotpriset detsamma överallt under samma kvart, men mellan områdena skiljer det när ledningarna söderut inte räcker till. Tabellen visar vad hushåll i lägenhet faktiskt fakturerades i ${manad(h, v.man, v.ar)} enligt SCB, påslaget inräknat, och vad det blir med energiskatt och moms men före nätavgift.</p>
${h.table(['Elområde', 'Rörligt avtal, inkl. moms', 'Fast pris 1 år, inkl. moms', 'Rörligt + energiskatt, inkl. moms'], rader, `SCB, Elpriser och elavtal, lägenhet, ${manad(h, v.man, v.ar)}. Energiskatt ${h.ore(v.skatt)} exkl. moms.`, ['l', 'r', 'r', 'r'])}
<p>Skillnaden mellan norr och söder är störst på vintern. Den högsta månaden i serien för SE4 var ${topp(h, v.topp[0])} med ${h.ore(v.topp[1] * v.mo)} inklusive moms för en villa utan elvärme. Under hela 2025 låg det rörliga snittet i SE1 på ${h.ore(v.a25('SE1') * v.mo)} och i SE4 på ${h.ore(v.a25('SE4') * v.mo)}, båda med moms. Läs mer på sidorna om ${h.a('elpris-se1', 'SE1')}, ${h.a('elpris-se2', 'SE2')}, ${h.a('elpris-se3', 'SE3')} och ${h.a('elpris-se4', 'SE4')}, och om varför gränserna går där de går i guiden om ${h.a('elomraden', 'elområden')}.</p>
<h2>Så räknas totalpriset, rad för rad</h2>
<p>Kalkylatorn gör samma sak som de två fakturorna du får varje månad, en från elhandlaren och en från nätföretaget, och lägger ihop dem per kilowattimme.</p>
<ol>
<li><strong>Spotpriset</strong>, i öre per kWh utan moms. Har du ett kvartsprisavtal betalar du priset för varje kvart; med rörligt månadspris betalar du ett snitt viktat efter hur alla kunder i elområdet använder el.</li>
<li><strong>Påslaget</strong>, elhandlarens marginal per kWh, ofta några öre. Det står i avtalet. Månadsavgiften till elhandlaren ligger utanför och kostar enligt Energimarknadsbyrån oftast 100 till 500 kronor om året.</li>
<li><strong>Överföringsavgiften</strong>, nätföretagets pris per kWh. Den sätts av ditt lokala nät och du kan inte byta nätföretag. Vi använder Energimarknadsinspektionens sammanställning per den 1 januari ${h.P.year}, med samma typfall som myndigheten.</li>
<li><strong>Energiskatten</strong>, ${h.ore(v.skatt)} exklusive moms enligt lagen om skatt på energi, sänkt från ${h.ore(v.skatt25)} år 2025. Den tas ut av nätföretaget.</li>
<li><strong>Momsen</strong>, 25 procent på summan av allt ovan, skatten inräknad.</li>
</ol>
<p>Till det rörliga priset kommer nätets fasta avgift, som beror på säkringen, och de statliga myndighetsavgifterna på ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms. Kalkylatorn lägger på dem och visar månadskostnaden för den förbrukning du anger.</p>
<h2>Två exempel med dagens skattesatser</h2>
<p>En lägenhet i Stockholm hos Ellevio, 2 000 kWh om året: SCB:s snitt för rörligt avtal i SE3 i ${manad(h, v.man, v.ar)} var ${h.ore(v.spotS)} exklusive moms. Ellevios överföringsavgift för typfallet är ${h.ore(v.tS.rorligOre)} och energiskatten ${h.ore(v.skatt)}. Med moms blir det ${h.ore(v.pS.total)}. Den fasta nätavgiften på ${h.kr(v.tS.fastKrPerAr * v.mo)} om året med moms gör att snittet per kWh landar på ${h.ore(v.mS.snittOre)}: i en liten bostad väger det fasta tungt.</p>
<p>En elvärmd villa i Malmö hos E.ON med 20 ampere och 20 000 kWh om året: rörligt pris i SE4 för villa med elvärme ${h.ore(v.spotM)}, överföring ${h.ore(v.tM.rorligOre)} i snitt för typfallet, skatt och moms ger ${h.ore(v.pM.total)}. Med fasta avgifter blir månadsräkningen omkring ${h.kr(v.mM.total)}. Här är det spotpriset och skatten som dominerar, inte abonnemanget.</p>
<h2>Varför ditt elnät ändrar allt</h2>
<p>Två grannkommuner kan ha samma spotpris och ändå olika totalpris, för att de ligger i olika nätföretags områden. Energimarknadsinspektionen redovisar ${h.num(v.rV.length)} nätområden med ett pris för en elvärmd villa med 20 ampere. Det billigaste kostar ${h.kr(v.rV[0].t.totalKrPerAr * v.mo)} om året med moms och det dyraste ${h.kr(v.rV[v.rV.length - 1].t.totalKrPerAr * v.mo)}; medianen ligger på ${h.kr(v.medV)}. Den skillnaden är större än vad de flesta sparar på att byta elhandlare. Ingen av de stora prissajterna räknar in den, eftersom de bara visar börspriset. ${h.a('jamfor-natavgift', 'Jämför ditt nätområde')} eller läs om ${h.a('ellevio', 'Ellevio')}, ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution')} och ${h.a('eon-energidistribution', 'E.ON')}.</p>
<h2>Klistra in dagens priser och hitta billigaste tiden</h2>
<p>Under fältet för spotpris finns en ruta där du klistrar in dagens eller morgondagens kvartspriser, ett per rad, i öre, kronor eller euro per megawattimme. Kalkylatorn räknar om varje kvart till totalpris med din nätavgift och skatt, ritar dygnet, visar lägsta och högsta pris och var den billigaste sammanhängande perioden börjar för den tid du väljer. Lägsta och högsta räknas ur samma lista, så de kan inte hamna i fel ordning. Samma funktion finns för ${h.a('kostnad-tvattmaskin', 'tvättmaskinen')}, ${h.a('kostnad-torktumlare', 'torktumlaren')}, ${h.a('kostnad-diskmaskin', 'diskmaskinen')} och för ${h.a('ladda-elbil', 'laddning av elbil')}, där laddtiden räknas fram ur batteriet och laddboxens effekt.</p>
<p>Ett kvartspris spelar bara roll om ditt avtal följer det. Med rörligt månadspris betalar du månadens snitt oavsett när du tvättar; att flytta förbrukning lönar sig då inte på fakturan, även om det hjälper elsystemet. Guiden om ${h.a('kvartspris', 'kvartspris')} reder ut skillnaden, och ${h.a('fast-eller-rorligt', 'fast eller rörligt')} visar vad avtalen har kostat de senaste tolv månaderna enligt SCB.</p>
<h2>Det här räknar vi inte</h2>
<p>Effektavgifter, där nätföretaget tar betalt för den högsta timeffekten under månaden, ingår bara om de finns i Energimarknadsinspektionens typfall; kravet på att alla nätföretag skulle införa dem upphävdes i juni 2026, men flera har dem kvar. Elhandlarens månadsavgift och eventuella tillägg för elcertifikat och ursprungsgarantier anger du själv i påslaget. Nätföretag kan ändra sina priser under året; datumet för varje uppgift står i ${h.a('method', 'metodbeskrivningen')}. Vid ett ${h.a('elstod', 'elstöd')} betalas pengarna ut i efterhand och påverkar inte priset per kWh.</p>`;
    },
  },
  en: {
    title: 'Electricity Price Today Sweden 2026: All-in Price per kWh',
    description: 'Electricity price today in Sweden, 2026: enter the spot price and see what you pay per kWh with the 36 öre energy tax, 25% VAT and your local grid fee, SE1–SE4.',
    h1: 'Electricity price today: what a kWh really costs you in Sweden',
    intro: 'The spot price is only part of the bill. Work out the rest for your own grid area.',
    resume: (h) => {
      const v = V(h);
      return `The electricity price shown in apps and on power-exchange boards in Sweden is the spot price before VAT, and it is rarely more than half of what a kilowatt-hour costs you. On top come the retailer’s mark-up (påslag), the grid company’s transfer fee (överföringsavgift), energy tax of ${h.ore(v.skatt)} before VAT in ${h.P.year}, and finally 25% VAT on everything, the tax included. One example: a flat in Stockholm on Ellevio’s grid, paying the Statistics Sweden average for a variable contract in SE3 in ${manad(h, v.man, v.ar)}, ${h.ore(v.spotS)}, ends up at ${h.ore(v.pS.total)} per kWh, or about ${h.kr(v.mS.total)} a month with fixed fees for 2,000 kWh a year. Type in your own spot price or paste today’s 96 quarter-hour prices, pick your grid area among the ${h.num(v.rL.length)} listed by the Energy Markets Inspectorate, and see the all-in price, the cheapest time and what a wash or a car charge costs.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Why is today’s spot price not displayed here?', a: `Day-ahead prices are set on the power exchange and belong to it. ENTSO-E’s list of data free for re-use does not include them, and the exchange sells licences to display them, so we do not republish any spot prices. You can see today’s price free in your retailer’s app or on the ENTSO-E transparency platform and type it in here.` },
        { q: 'How much of my electricity price is tax?', a: `Energy tax is ${h.ore(v.skatt)} before VAT in ${h.P.year}, ${h.ore(v.skattInkl)} with VAT. The 25% VAT applies to the spot price, mark-up, grid fee and the tax itself. With a spot price around one krona per kWh, roughly a third of the variable price goes to the state.` },
        { q: 'Is energy tax lower in northern Sweden?', a: `Yes, in Norrbotten, Västerbotten and Jämtland counties and a few municipalities in Västernorrland, Gävleborg, Dalarna and Värmland, the grid company deducts ${h.ore(h.P.skatt.norrlandsavdrag_ore)}, so households pay ${h.ore(v.sankt)} before VAT. Switch on reduced energy tax in the calculator if you live there.` },
        { q: 'How do I find my bidding zone as a newcomer?', a: `The zone follows your local grid, not the county. Svenska kraftnät’s map on Nätområden.se shows the grid area and zone of any address, and the grid company is named on your bill. Stockholm, Gothenburg, Uppsala and Linköping are in SE3; Malmö, Lund, Helsingborg and Växjö in SE4; Umeå and Sundsvall in SE2; Luleå and Skellefteå in SE1.` },
        { q: 'How much is the grid fee where I live?', a: `It depends entirely on the grid company. In the Energy Markets Inspectorate’s ${h.P.year} compilation, a 16 A flat using 2,000 kWh pays between ${h.kr(v.rL[0].t.totalKrPerAr * v.mo)} and ${h.kr(v.rL[v.rL.length - 1].t.totalKrPerAr * v.mo)} a year with VAT, with a median of ${h.kr(v.medL)}. The grid-fee page compares every area.` },
        { q: 'Has a variable contract been cheaper than a fixed one lately?', a: `Over the last twelve months published by Statistics Sweden, energy for a house without electric heating in SE3 using 1,000 kWh a month cost ${h.kr(v.jam[0].kr * v.mo)} on a variable price and ${h.kr(v.jam[1].kr * v.mo)} on a one-year fixed price, VAT included. A cold winter can reverse that; the fixed-or-variable page works it out per zone.` },
        { q: 'What time are tomorrow’s prices known?', a: `The exchange auction for the next day runs at ${h.P.marknad.auktion_kl} Swedish time the day before, and prices come out early in the afternoon. Since 1 October 2025 there is one price per quarter hour, 96 a day. Paste them on the tomorrow page to see the all-in price and the cheapest window.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = v.zoner.map((z) => [z.z, h.ore(z.rorligt * v.mo), h.ore(z.fast1 * v.mo), h.ore((z.rorligt + v.skatt) * v.mo)]);
      return `<div class="not-prose my-6 border-l-4 border-accent-600 bg-accent-50 px-5 py-4 text-navy-800"><p class="text-sm font-semibold uppercase tracking-wide text-navy-700">Why there is no spot price on this page</p><p class="mt-2">Spot prices are set every day in the power exchange’s auction and belong to the exchange. ENTSO-E’s terms allow free re-use of a listed set of data, and day-ahead prices are not on that list. Many sites show them anyway, without a licence; we do not. The calculator starts from the official Statistics Sweden average for a variable contract in your zone, and you replace it with today’s price from your retailer’s app or the ${h.src('entsoe', 'ENTSO-E transparency platform')}.</p></div>
<h2>Four bidding zones, four prices before tax</h2>
<p>Sweden has been split into four bidding zones (elområden) since 2011, numbered from north to south. Within a zone the spot price is the same everywhere for a given quarter hour; between zones it differs whenever the lines southwards are full. The table shows what households in flats were actually billed in ${manad(h, v.man, v.ar)} according to Statistics Sweden (SCB), mark-up included, and what that becomes with energy tax and VAT but before the grid fee.</p>
${h.table(['Zone', 'Variable contract, incl. VAT', 'Fixed 1 year, incl. VAT', 'Variable + energy tax, incl. VAT'], rader, `Statistics Sweden, electricity prices and contracts, flat, ${manad(h, v.man, v.ar)}. Energy tax ${h.ore(v.skatt)} before VAT.`, ['l', 'r', 'r', 'r'])}
<p>The north–south gap is widest in winter. The highest month in the SE4 series was ${topp(h, v.topp[0])}, at ${h.ore(v.topp[1] * v.mo)} including VAT for a house without electric heating. Across 2025 the variable average was ${h.ore(v.a25('SE1') * v.mo)} in SE1 and ${h.ore(v.a25('SE4') * v.mo)} in SE4, both with VAT. See the pages on ${h.a('elpris-se1', 'SE1')}, ${h.a('elpris-se2', 'SE2')}, ${h.a('elpris-se3', 'SE3')} and ${h.a('elpris-se4', 'SE4')}, and why the borders sit where they do in the guide to ${h.a('elomraden', 'bidding zones')}.</p>
<h2>How the all-in price is built</h2>
<p>The calculator does what your two monthly bills do, one from the retailer (elhandelsbolag) and one from the grid company (elnätsföretag), and adds them up per kilowatt-hour.</p>
<ol>
<li><strong>Spot price</strong>, öre per kWh before VAT. On a quarter-hour contract you pay each quarter’s price; on a variable monthly price you pay an average weighted by how everyone in the zone uses power.</li>
<li><strong>Mark-up</strong>, the retailer’s margin per kWh, often a few öre and stated in your contract. The retailer’s monthly fee is separate; Energimarknadsbyrån puts it at 100 to 500 kronor a year in most cases.</li>
<li><strong>Transfer fee</strong>, the grid company’s price per kWh. It is set by your local grid, and you cannot switch grid company. We use the Energy Markets Inspectorate’s (Ei) compilation on 1 January ${h.P.year}, with the same standard cases as the regulator.</li>
<li><strong>Energy tax</strong>, ${h.ore(v.skatt)} before VAT under the Energy Tax Act, down from ${h.ore(v.skatt25)} in 2025, collected by the grid company.</li>
<li><strong>VAT</strong> (moms), 25% on the sum of all the above, the tax included.</li>
</ol>
<p>Add the grid’s fixed fee, which depends on your main fuse, and the state authority charges of ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT. The calculator includes them and shows the monthly cost for the consumption you enter.</p>
<h2>Two worked examples at this year’s tax rates</h2>
<p>A flat in Stockholm on Ellevio’s grid, 2,000 kWh a year: the SCB variable-contract average for SE3 in ${manad(h, v.man, v.ar)} was ${h.ore(v.spotS)} before VAT. Ellevio’s transfer fee for the standard case is ${h.ore(v.tS.rorligOre)} and energy tax ${h.ore(v.skatt)}. With VAT that makes ${h.ore(v.pS.total)}. The fixed grid fee of ${h.kr(v.tS.fastKrPerAr * v.mo)} a year with VAT pushes the average per kWh to ${h.ore(v.mS.snittOre)}: in a small home the fixed part weighs heavily.</p>
<p>An electrically heated house in Malmö on E.ON’s grid, 20 A and 20,000 kWh a year: variable price in SE4 for a heated house ${h.ore(v.spotM)}, transfer fee ${h.ore(v.tM.rorligOre)} on average for the case, plus tax and VAT gives ${h.ore(v.pM.total)}. With fixed fees the monthly bill is about ${h.kr(v.mM.total)}. Here spot price and tax dominate, not the subscription.</p>
<h2>Why your grid area changes everything</h2>
<p>Two neighbouring towns can share a spot price and still pay different all-in prices, because they sit in different grid companies’ areas. The Energy Markets Inspectorate lists ${h.num(v.rV.length)} grid areas with a price for an electrically heated 20 A house. The cheapest costs ${h.kr(v.rV[0].t.totalKrPerAr * v.mo)} a year with VAT and the most expensive ${h.kr(v.rV[v.rV.length - 1].t.totalKrPerAr * v.mo)}, against a median of ${h.kr(v.medV)}. That gap is bigger than what most people save by switching retailer, and none of the big price sites include it, because they only show the exchange price. ${h.a('jamfor-natavgift', 'Compare your grid area')} or read about ${h.a('ellevio', 'Ellevio')}, ${h.a('vattenfall-eldistribution', 'Vattenfall Eldistribution')} and ${h.a('eon-energidistribution', 'E.ON')}.</p>
<h2>Paste today’s prices and find the cheapest time</h2>
<p>Below the spot-price field is a box where you paste today’s or tomorrow’s quarter-hour prices, one per line, in öre, kronor or euros per megawatt-hour. The calculator turns each quarter into an all-in price with your grid fee and tax, draws the day, shows the lowest and highest price and where the cheapest continuous window starts for the length you choose. Lowest and highest come from the same list, so they cannot end up the wrong way round. The same feature exists for the ${h.a('kostnad-tvattmaskin', 'washing machine')}, the ${h.a('kostnad-torktumlare', 'tumble dryer')}, the ${h.a('kostnad-diskmaskin', 'dishwasher')} and for ${h.a('ladda-elbil', 'charging an electric car')}, where charging time is derived from the battery and the wallbox power.</p>
<p>A quarter-hour price only matters if your contract follows it. On a variable monthly price you pay the month’s average whenever you run the machine, so shifting use does not show on the bill, even if it helps the power system. The guide to ${h.a('kvartspris', 'quarter-hour prices')} explains the difference, and ${h.a('fast-eller-rorligt', 'fixed or variable')} shows what each contract type cost over the last twelve months according to Statistics Sweden.</p>
<h2>What we do not calculate</h2>
<p>Power charges (effektavgift), where the grid company bills your highest hourly load of the month, are included only if they appear in the regulator’s standard case; the rule forcing every grid company to introduce them was repealed in June 2026, but several keep them. You add the retailer’s monthly fee and any certificate or origin-guarantee surcharges yourself in the mark-up field. Grid companies may change prices during the year; the date of each figure is given in the ${h.a('method', 'method')}. A government ${h.a('elstod', 'electricity support')} is paid afterwards and does not change the price per kWh.</p>`;
    },
  },
};
