import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Göteborg : nätområde GBG (Göteborg Energi Nät AB, SE3, Nätområden.se) ; tarif Ei « Göteborg Energi Nät AB », seul le cas L16 en 2026. */
const G = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Göteborg Energi')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const ab = t.fastKrPerAr - t.myndighet, ab25 = f.fastKrPerAr - f.myndighet;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: M.FALL_KWH.L16 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'L16');
  const merFast = t.fastKrPerAr - f.fastKrPerAr;
  const billigare = f.rorligOre - t.rorligOre;
  const bryt = Math.round(merFast / (billigare / 100) / 100) * 100;
  const s25 = M.arssnitt('rorligt', 'SE3', '1', 2025)!, s26 = M.arssnitt('rorligt', 'SE3', '1', 2026)!;
  return { mo, t, f, ab, ab25, spot, p, man, pl, merFast, billigare, bryt, s25, s26, med: pl.median * mo };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-goteborg',
  group: 'stad',
  order: 20,
  tool: 'pris',
  toolProps: { nat: 'Göteborg Energi', zon: 'SE3', fall: 'L16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-jonkoping', 'kostnad-torktumlare', 'fast-eller-rorligt'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-goteborg',
    nav: 'Göteborg',
    card: 'Pris per kWh i Göteborg med Göteborg Energis nät i SE3.',
    title: 'Elpris Göteborg 2026: Göteborg Energis nät och pris per kWh',
    description: 'Elpris i Göteborg 2026: SE3, Göteborg Energis höjda abonnemang och sänkta överföringsavgift. Se ditt pris per kWh och vad en lägenhet betalar i månaden.',
    h1: 'Elpris i Göteborg med Göteborg Energis nätavgift',
    intro: 'Göteborg hör till elområde SE3, och nätområdet i staden ägs av Göteborg Energi Nät AB.',
    resume: (h) => {
      const v = G(h);
      return `Runt ${h.ore(v.p.total)} kostar varje kilowattimme just nu för en göteborgslägenhet med 16 ampere säkring, räknat med SCB:s snitt för rörligt elavtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms. Göteborg Energi Nät AB äger nätområdet Göteborg enligt Nätområden.se, tjänsten som Svenska kraftnät driver, och området ligger i elområde SE3. Nätbolaget har lagt om prislistan till ${h.P.year}: abonnemanget gick från ${h.kr(v.ab25 * v.mo)} till ${h.kr(v.ab * v.mo)} om året med moms, medan överföringsavgiften sänktes från ${h.ore(v.f.priser[0])} till ${h.ore(v.t.priser[0])} exklusive moms. För Energimarknadsinspektionens typlägenhet med 2 000 kWh blir nätet ${h.kr(v.t.totalKrPerAr * v.mo)} om året, plats ${v.pl.plats} av ${v.pl.av} i myndighetens jämförelse. Månadsräkningen hamnar då kring ${h.kr(v.man.total)} när energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och 25 procent moms är medräknade. Skriv in ditt eget spotpris eller klistra in dagens kvartspriser i kalkylatorn för att få fram ditt pris.`;
    },
    faqs: (h) => {
      const v = G(h);
      return [
        { q: 'Vem äger elnätet i Göteborg?', a: `Nätområdet Göteborg, med koden GBG, ägs av Göteborg Energi Nät AB enligt Nätområden.se. Grannkommunerna har ofta egna nät: nätområdet Mölndal tillhör Mölndal Energi Nät AB och Partille tillhör Partille Energi Nät AB, så en adress strax utanför stadsgränsen kan ha en helt annan nätavgift. Namnet på fakturan avgör.` },
        { q: 'Hur mycket dyrare blev Göteborg Energis fasta avgift 2026?', a: `Abonnemang och myndighetsavgifter kostar tillsammans ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms ${h.P.year}, mot ${h.kr(v.f.fastKrPerAr * v.mo)} året innan enligt Energimarknadsinspektionen. Av ökningen på ${h.kr(v.merFast * v.mo)} kommer en del från myndighetsavgifterna, som steg från ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms. Resten är bolagets egen höjning.` },
        { q: 'Lönar det sig att använda mer el med Göteborg Energis nya tariff?', a: `Varje kilowattimme har blivit ${h.ore(v.billigare)} billigare i överföring medan den fasta delen steg. Räknat på Ei:s siffror utan moms väger sänkningen upp höjningen först vid ungefär ${h.num(v.bryt)} kWh om året. En lägenhet som använder mindre än så betalar alltså mer för nätet ${h.P.year} än 2025, även om kilowattimmen är billigare.` },
        { q: 'Finns det villapris för Göteborg Energi hos Ei?', a: `Nej. Energimarknadsinspektionens tabell har varken för 2025 eller ${h.P.year} något totalbelopp för Göteborg Energis villafall med 16, 20 eller 25 ampere. Kalkylatorn visar därför lägenhetsfallet. Bor du i villa, hämta överföringsavgiften och abonnemanget ur nätbolagets prislista och lägg in dem själv, så räknas skatt och moms ändå rätt.` },
      ];
    },
    body: (h) => {
      const v = G(h);
      const r = (x: number) => h.kr(x * v.mo);
      return `<h2>Göteborg Energis prislista 2025 och ${h.P.year} sida vid sida</h2>
${h.table(['Del av nätavgiften, inkl. moms', '2025', String(h.P.year)], [['Abonnemang per år', r(v.ab25), r(v.ab)], ['Myndighetsavgifter per år', r(v.f.myndighet), r(v.t.myndighet)], ['Överföringsavgift', h.ore(v.f.rorligOre * v.mo), h.ore(v.t.rorligOre * v.mo)], ['Summa för 2 000 kWh', r(v.f.totalKrPerAr), r(v.t.totalKrPerAr)]], `Lägenhet 16 A, 2 000 kWh om året. Källa: Energimarknadsinspektionen; myndighetsavgifter enligt beslut för respektive år.`, ['l', 'r', 'r'])}
<p>Omläggningen flyttar kostnad från kilowattimmarna till det fasta. Den fasta delen har ökat med ${h.kr(v.merFast * v.mo)} om året inklusive moms, och varje kilowattimme överföring kostar ${h.ore(v.billigare * v.mo)} mindre med moms. Brytpunkten ligger kring ${h.num(v.bryt)} kWh om året. Typlägenheten ligger långt under den och får en högre nätkostnad än förra året; en stor lägenhet som använder mycket mer el ligger närmare och märker mindre av höjningen.</p>
<h2>Göteborg i den nationella jämförelsen</h2>
<p>Med ${h.kr(v.t.totalKrPerAr * v.mo)} om året för lägenhetsfallet hamnar Göteborg Energi på plats ${v.pl.plats} bland ${v.pl.av} nätområden som har ett pris för ${h.P.year}. Mittvärdet i landet är ${h.kr(v.med)} med moms, så en göteborgare betalar ${h.kr(v.med - v.t.totalKrPerAr * v.mo)} mindre än medianhushållet för samma förbrukning. Nätet är alltså inte dyrt här; det är elhandeln och skatten som väger tyngst. Fler nät hittar du i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>
<h2>Elhandeln i SE3 i år och förra året</h2>
<p>Från januari till ${MAN.sv[h.M.manadDelar(h.M.SENASTE_MANAD).man - 1]} i år har SCB:s rörliga lägenhetspris i SE3 legat på i snitt ${h.ore(v.s26.snitt)} utan moms, mot ${h.ore(v.s25.snitt)} för hela 2025. Det är alltså elhandeln som har ökat mest för göteborgarna, inte nätet. Den som funderar på att låsa priset kan läsa ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')}. Med timvis eller kvartsvis prissatt avtal sparar det mest att flytta tunga apparater som ${h.a('kostnad-torktumlare', 'torktumlaren')} till billiga kvartar. Jönköping, också i SE3, har ett eget nätbolag med andra villkor: se ${h.a('elpris-jonkoping', 'elpriset i Jönköping')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-gothenburg',
    nav: 'Gothenburg',
    card: 'Price per kWh in Gothenburg on Göteborg Energi’s grid, SE3.',
    title: 'Electricity Price Gothenburg 2026: Göteborg Energi per kWh',
    description: 'Electricity price in Gothenburg 2026: SE3, Göteborg Energi’s higher fixed fee and lower transfer fee. Find your price per kWh and a typical flat’s monthly bill.',
    h1: 'Electricity price in Gothenburg on Göteborg Energi’s grid',
    intro: 'Gothenburg sits in bidding zone SE3, and the city’s grid area belongs to Göteborg Energi Nät AB.',
    resume: (h) => {
      const v = G(h);
      return `A Gothenburg flat with a 16 A main fuse is paying around ${h.ore(v.p.total)} at the moment, taking the Statistics Sweden (SCB) average for a variable contract in SE3 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT. Göteborg Energi Nät AB owns the Göteborg grid area according to Nätområden.se, the grid-area map run by the national grid operator Svenska kraftnät, and the area is in SE3. The company reshaped its tariff for ${h.P.year}: the yearly subscription rose from ${h.kr(v.ab25 * v.mo)} to ${h.kr(v.ab * v.mo)} including VAT, while the transfer fee (överföringsavgift, the per-kWh grid charge) fell from ${h.ore(v.f.priser[0])} to ${h.ore(v.t.priser[0])} before VAT. For the regulator’s standard flat using 2,000 kWh, the grid comes to ${h.kr(v.t.totalKrPerAr * v.mo)} a year, ranking ${v.pl.plats} of ${v.pl.av}. With energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and 25% VAT, the monthly bill is roughly ${h.kr(v.man.total)}. Type your own spot price into the calculator to see yours.`;
    },
    faqs: (h) => {
      const v = G(h);
      return [
        { q: 'Who runs the power grid in Gothenburg?', a: `The Göteborg grid area, code GBG, belongs to Göteborg Energi Nät AB according to Nätområden.se. Neighbouring areas have their own owners: Mölndal is run by Mölndal Energi Nät AB and Partille by Partille Energi Nät AB. If you rent just outside the city, your grid fee may be quite different, so check the company named on your bill.` },
        { q: 'By how much did Göteborg Energi’s fixed charge rise in 2026?', a: `The subscription plus state authority charges total ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT in ${h.P.year}, against ${h.kr(v.f.fastKrPerAr * v.mo)} the year before, per the Energy Markets Inspectorate (Ei). Part of the ${h.kr(v.merFast * v.mo)} rise comes from the authority charges, up from ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT; the rest is the company’s own increase.` },
        { q: 'Does using more power pay off under Göteborg Energi’s new tariff?', a: `Each kilowatt-hour now costs ${h.ore(v.billigare)} less to transport, while the fixed part went up. On Ei’s figures before VAT, the cut only outweighs the rise at about ${h.num(v.bryt)} kWh a year. A flat using less than that pays more for its grid in ${h.P.year} than in 2025, even though each unit is cheaper.` },
        { q: 'Does Ei publish a house price for Göteborg Energi?', a: `No. The Energy Markets Inspectorate’s table has no total for Göteborg Energi’s house cases at 16, 20 or 25 A, neither for 2025 nor ${h.P.year}. The calculator therefore shows the flat case. In a house, take the transfer fee and subscription from the company’s own price list and enter them yourself; tax and VAT are still added correctly.` },
      ];
    },
    body: (h) => {
      const v = G(h);
      const r = (x: number) => h.kr(x * v.mo);
      return `<h2>Göteborg Energi’s tariff, 2025 against ${h.P.year}</h2>
${h.table(['Grid fee item, incl. VAT', '2025', String(h.P.year)], [['Subscription per year', r(v.ab25), r(v.ab)], ['Authority charges per year', r(v.f.myndighet), r(v.t.myndighet)], ['Transfer fee', h.ore(v.f.rorligOre * v.mo), h.ore(v.t.rorligOre * v.mo)], ['Total at 2,000 kWh', r(v.f.totalKrPerAr), r(v.t.totalKrPerAr)]], `Flat, 16 A, 2,000 kWh a year. Source: Energy Markets Inspectorate; authority charges as decided for each year.`, ['l', 'r', 'r'])}
<p>The new structure shifts cost from the units you use to the standing charge. The fixed part is up ${h.kr(v.merFast * v.mo)} a year including VAT, while every kilowatt-hour transported costs ${h.ore(v.billigare * v.mo)} less with VAT. The break-even sits near ${h.num(v.bryt)} kWh a year. The standard flat is far below that and pays more for its grid than last year; a large flat using far more power sits closer and feels the rise less.</p>
<h2>How Gothenburg compares nationally</h2>
<p>At ${h.kr(v.t.totalKrPerAr * v.mo)} a year for the flat case, Göteborg Energi ranks ${v.pl.plats} among the ${v.pl.av} grid areas with a ${h.P.year} price. The national median is ${h.kr(v.med)} with VAT, so a Gothenburg tenant pays ${h.kr(v.med - v.t.totalKrPerAr * v.mo)} less than the median household for the same use. The grid is not what makes power expensive here; retail energy and tax weigh more. Other grids appear in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>
<h2>Retail energy in SE3, this year and last</h2>
<p>From January to ${MAN.en[h.M.manadDelar(h.M.SENASTE_MANAD).man - 1]}, the SCB variable price for flats in SE3 averaged ${h.ore(v.s26.snitt)} before VAT, against ${h.ore(v.s25.snitt)} across 2025. For Gothenburg households, it is the energy part that has climbed most, not the grid. If you are weighing a locked price, read ${h.a('fast-eller-rorligt', 'fixed or variable price')}. On an hourly or quarter-hour contract, moving heavy loads such as the ${h.a('kostnad-torktumlare', 'tumble dryer')} to cheap slots saves the most. Jönköping, also in SE3, has its own grid company on different terms: see ${h.a('elpris-jonkoping', 'electricity in Jönköping')}.</p>`;
    },
  },
});
