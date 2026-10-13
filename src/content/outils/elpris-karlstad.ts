import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Karlstad : nätområde KST (Karlstad Elnät AB, SE3, Nätområden.se) ; Ei « Karlstads Elnät AB », 2026 : cas lägenhet seulement.
 *  Värmland : seul Torsby a l'avdrag (LSE 11 kap. 4 §). Angle : transfert parmi les plus chers, coût qui suit la consommation. */
const NIVAER = [1000, 2000, 3000, 4000, 6000];
const K = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Karlstads Elnät')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const pl = M.placering(e, 'L16');
  const alla = M.rangordna('L16');
  const niva = NIVAER.map((kwh) => {
    const egen = M.natKostnad(t, kwh);
    const ovr = alla.map((x) => M.natKostnad(x.t, kwh));
    return { kwh, kr: egen * mo, med: M.median(ovr) * mo, plats: ovr.filter((x) => x < egen).length + 1 };
  });
  const hogre = alla.filter((x) => x.t.rorligOre > t.rorligOre).length;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const spar500 = (500 * p.total) / 100;
  const natAndel = (t.rorligOre * mo) / p.total;
  return { mo, e, t, f, pl, niva, hogre, spot, p, man, spar500, natAndel, okning: t.totalKrPerAr / f.totalKrPerAr - 1, rorAndel: 1 - t.fastKrPerAr / t.totalKrPerAr, pkt: e.cas.L16!['2026'].punkter! };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-karlstad',
  group: 'stad',
  order: 160,
  tool: 'pris',
  toolProps: { nat: 'Karlstads Elnät', zon: 'SE3', fall: 'L16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-eskilstuna', 'natavgift', 'kostnad-tvattmaskin'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse'],
  sv: {
    slug: 'elpris-karlstad',
    nav: 'Karlstad',
    card: 'Elpriset i Karlstad, där en hög överföringsavgift gör varje kWh dyr.',
    title: 'Elpris Karlstad 2026: hög överföringsavgift och pris per kWh',
    description: 'Elpris i Karlstad 2026: SE3 och Karlstads Elnät, där överföringsavgiften på 55,35 öre per kWh hör till landets högsta. Räkna ut vad en lägenhet betalar per kWh.',
    h1: 'Elpris i Karlstad med Karlstads Elnäts överföringsavgift',
    intro: 'Karlstad ligger i elområde SE3 och nätområdet ägs av Karlstad Elnät AB.',
    resume: (h) => {
      const v = K(h);
      return `${h.ore(v.p.total)} med moms kostar varje kilowattimme i en Karlstadlägenhet när elhandeln ligger på SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms. Nätområdet Karlstad ägs av Karlstad Elnät AB och ligger i SE3 enligt Svenska kraftnäts Nätområden.se. Det som lyfter priset är nätets överföringsavgift: ${h.ore(v.t.priser[0], 2)} före moms enligt Energimarknadsinspektionen, och bara ${v.hogre} av ${v.pl.av} nät tar mer av lägenheter. Abonnemanget är i gengäld lågt, ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms inklusive myndighetsavgifter. För typfallet med 2 000 kWh blir nätet ${h.kr(v.t.totalKrPerAr * v.mo)} om året, plats ${v.pl.plats} av ${v.pl.av}, och ${h.pct(v.rorAndel)} av det följer förbrukningen. Värmlands län har sänkt energiskatt bara i Torsby, så i Karlstad gäller ${h.ore(h.P.skatt.energiskatt_ore)}. En lägenhet med 2 000 kWh om året får en räkning på ungefär ${h.kr(v.man.total)} i månaden. Skriv in dagens spotpris för att se vad nästa kilowattimme kostar.`;
    },
    faqs: (h) => {
      const v = K(h);
      return [
        { q: 'Varför är överföringsavgiften så hög i Karlstad?', a: `Energimarknadsinspektionens data visar beloppen men inte bolagets skäl. Karlstads Elnät tar ${h.ore(v.t.priser[0], 2)} före moms och har samtidigt ett abonnemang på ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms, vilket är lågt. Bolaget lägger alltså en större del av kostnaden på förbrukningen än de flesta nät gör. Vill du veta varför, är det Karlstads Elnät som kan svara.` },
        { q: 'Hur mycket sparar en Karlstadlägenhet på 500 kWh mindre om året?', a: `Med SCB:s snittpris för SE3 är varje kilowattimme värd ${h.ore(v.p.total)} med moms, så 500 kWh mindre ger ungefär ${h.kr(v.spar500)} lägre kostnad om året. Av priset per kWh går ${h.pct(v.natAndel)} till nätet, en större andel än i städer där nätet tar betalt via abonnemanget. Det gör att sparåtgärder lönar sig mer i Karlstad än på många andra orter.` },
        { q: 'Har Torsby lägre elskatt än Karlstad?', a: `Ja. Torsby är den enda kommunen i Värmlands län som finns med i förteckningen i 11 kap. 4 § lagen om skatt på energi. Där får hushållen ett avdrag på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} och betalar ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. I Karlstad och länets övriga kommuner gäller full energiskatt, ${h.ore(h.P.skatt.energiskatt_ore)} före moms, oavsett vilket elnät man har.` },
        { q: 'Hur mycket steg överföringsavgiften i Karlstad 2026?', a: `Från ${h.ore(v.f.priser[0], 2)} till ${h.ore(v.t.priser[0], 2)} före moms mellan 2025 och ${h.P.year}, enligt Energimarknadsinspektionen. Abonnemanget och myndighetsavgifterna steg också, så lägenhetens totala nätkostnad gick från ${h.kr(v.f.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, en ökning med ${h.pct(v.okning)}. Ei redovisar ${h.num(v.pkt)} lägenhetskunder i nätet.` },
      ];
    },
    body: (h) => {
      const v = K(h);
      return `<h2>Karlstad mot mitten av fältet vid olika förbrukning</h2>
${h.table(['Förbrukning per år', 'Karlstads Elnät inkl. moms', 'Median alla nät', 'Plats'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.kr), h.kr(x.med), `${x.plats} av ${v.pl.av}`]), `Lägenhet 16 A. Varje näts fasta avgift plus dess snittpris per kWh i Energimarknadsinspektionens typfall ${h.P.year}, räknat på respektive förbrukning. Plats 1 = billigast.`, ['l', 'r', 'r', 'r'])}
<p>Vid ${h.num(v.niva[0].kwh)} kWh om året ligger Karlstads Elnät på plats ${v.niva[0].plats}; vid ${h.num(v.niva[4].kwh)} kWh har nätet halkat ned till plats ${v.niva[4].plats}. En liten lägenhet med låg förbrukning klarar sig alltså relativt bra här, medan ett hushåll som använder mycket el betalar betydligt mer än i ett genomsnittligt nät. Typfallets 2 000 kWh ger plats ${v.niva[1].plats}.</p>
<h2>Var pengarna går för en kilowattimme</h2>
${h.table(['Del av priset', 'Öre per kWh inkl. moms'], [['Elhandel, SCB-snitt rörligt SE3', h.ore(v.spot * v.mo)], ['Karlstads Elnäts överföringsavgift', h.ore(v.t.rorligOre * v.mo)], ['Energiskatt', h.ore(h.P.skatt.energiskatt_ore * v.mo)], ['Totalt rörligt', h.ore(v.p.total)]], `Lägenhet 16 A, SE3. Elhandel: SCB, ${mn(h, h.M.SENASTE_MANAD)}. Nät: Energimarknadsinspektionen ${h.P.year}.`, ['l', 'r'])}
<p>Med ett kvartsprisavtal kan det löna sig att flytta tunga apparater som ${h.a('kostnad-tvattmaskin', 'tvättmaskinen')} till billiga timmar, men nätdelen per kWh är lika hög dygnet runt i Ei:s uppgifter. Hur abonnemang och överföring fördelas i andra nät förklaras under ${h.a('natavgift', 'nätavgiften')}.</p>
<h2>Karlstad i SE3</h2>
<p>Spotpriset är detsamma som i ${h.a('elpris-eskilstuna', 'Eskilstuna')} och resten av ${h.a('elpris-se3', 'SE3')}. Hur Karlstads Elnät står sig mot alla nät ser du i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}, där du även kan välja ditt eget nät om du bor utanför nätområdet Karlstad.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-karlstad',
    nav: 'Karlstad',
    card: 'Electricity price in Karlstad, where a high transfer fee makes every kWh dear.',
    title: 'Electricity Price Karlstad 2026: High Transfer Fee per kWh',
    description: 'Electricity price in Karlstad 2026: SE3 and Karlstads Elnät, whose 55.35 öre per kWh transfer fee is among Sweden’s highest. Work out what a flat pays per kWh.',
    h1: 'Electricity price in Karlstad with Karlstads Elnät’s transfer fee',
    intro: 'Karlstad is in bidding zone SE3, and its grid area belongs to Karlstad Elnät AB.',
    resume: (h) => {
      const v = K(h);
      return `${h.ore(v.p.total)} with VAT is the cost of each kilowatt-hour in a Karlstad flat when retail energy matches the Statistics Sweden (SCB) variable-contract average for SE3 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. The Karlstad grid area belongs to Karlstad Elnät AB and lies in SE3, according to Svenska kraftnät’s Nätområden.se. What lifts the price is the grid’s transfer fee (överföringsavgift, the per-kWh grid charge): ${h.ore(v.t.priser[0], 2)} before VAT in the Energy Markets Inspectorate’s data, and only ${v.hogre} of ${v.pl.av} grids charge flats more. The subscription is low in return, ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT including authority charges. For the 2,000 kWh standard case the grid costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year, rank ${v.pl.plats} of ${v.pl.av}, and ${h.pct(v.rorAndel)} of it follows usage. In Värmland county only Torsby has reduced energy tax, so Karlstad pays ${h.ore(h.P.skatt.energiskatt_ore)}. A flat using 2,000 kWh a year pays about ${h.kr(v.man.total)} a month.`;
    },
    faqs: (h) => {
      const v = K(h);
      return [
        { q: 'Why is the transfer fee so high in Karlstad?', a: `The regulator’s data shows the amounts but not the company’s reasons. Karlstads Elnät charges ${h.ore(v.t.priser[0], 2)} before VAT while keeping a low subscription of ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT. It therefore puts more of its cost on usage than most grids do. For the reasoning behind that choice, Karlstads Elnät itself is the one to ask.` },
        { q: 'How much does a Karlstad flat save by using 500 kWh less a year?', a: `At the SCB average for SE3 each kilowatt-hour is worth ${h.ore(v.p.total)} with VAT, so 500 kWh less cuts the yearly cost by about ${h.kr(v.spar500)}. Of the price per kWh, ${h.pct(v.natAndel)} goes to the grid, a larger share than in cities where the grid charges mainly through the subscription. Saving power therefore pays off more in Karlstad than in many other places.` },
        { q: 'Does Torsby pay less electricity tax than Karlstad?', a: `Yes. Torsby is the only municipality in Värmland county listed in chapter 11, section 4 of the Energy Tax Act. Households there get a ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction and pay ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. In Karlstad and the county’s other municipalities full energy tax applies, ${h.ore(h.P.skatt.energiskatt_ore)} before VAT, whichever grid you are on.` },
        { q: 'How much did Karlstad’s transfer fee rise in 2026?', a: `From ${h.ore(v.f.priser[0], 2)} to ${h.ore(v.t.priser[0], 2)} before VAT between 2025 and ${h.P.year}, according to the Energy Markets Inspectorate. The subscription and authority charges rose too, so the flat’s total grid cost went from ${h.kr(v.f.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, an increase of ${h.pct(v.okning)}. Ei records ${h.num(v.pkt)} flat customers on this grid.` },
      ];
    },
    body: (h) => {
      const v = K(h);
      return `<h2>Karlstad against the middle of the field at different levels of use</h2>
${h.table(['Use per year', 'Karlstads Elnät incl. VAT', 'Median all grids', 'Rank'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.kr), h.kr(x.med), `${x.plats} of ${v.pl.av}`]), `Flat 16 A. Each grid’s fixed charge plus its average price per kWh in the Energy Markets Inspectorate’s ${h.P.year} standard case, applied to each level of use. Rank 1 = cheapest.`, ['l', 'r', 'r', 'r'])}
<p>At ${h.num(v.niva[0].kwh)} kWh a year Karlstads Elnät ranks ${v.niva[0].plats}; at ${h.num(v.niva[4].kwh)} kWh it has slipped to ${v.niva[4].plats}. A small, low-use flat does relatively well here, while a household that uses a lot of power pays considerably more than on an average grid. The standard 2,000 kWh gives rank ${v.niva[1].plats}.</p>
<h2>Where the money goes for one kilowatt-hour</h2>
${h.table(['Part of the price', 'Öre per kWh incl. VAT'], [['Energy, SCB variable average SE3', h.ore(v.spot * v.mo)], ['Karlstads Elnät transfer fee', h.ore(v.t.rorligOre * v.mo)], ['Energy tax', h.ore(h.P.skatt.energiskatt_ore * v.mo)], ['Total variable', h.ore(v.p.total)]], `Flat 16 A, SE3. Energy: Statistics Sweden, ${mn(h, h.M.SENASTE_MANAD)}. Grid: Energy Markets Inspectorate ${h.P.year}.`, ['l', 'r'])}
<p>On a quarter-hour contract (kvartspris) it can pay to shift heavy appliances such as the ${h.a('kostnad-tvattmaskin', 'washing machine')} to cheap periods, but the grid part per kWh is the same around the clock in Ei’s data. How other grids split subscription and transfer is explained under ${h.a('natavgift', 'the grid fee')}.</p>
<h2>Karlstad within SE3</h2>
<p>The spot price is the same as in ${h.a('elpris-eskilstuna', 'Eskilstuna')} and the rest of ${h.a('elpris-se3', 'SE3')}. How Karlstads Elnät compares with every grid is in the ${h.a('jamfor-natavgift', 'grid fee comparison')}, where you can also pick your own grid if you live outside the Karlstad grid area.</p>`;
    },
  },
});
