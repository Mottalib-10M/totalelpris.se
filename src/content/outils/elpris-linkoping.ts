import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Linköping : nätområde LNK (Tekniska Verken i Linköping Nät AB, SE3, Nätområden.se) ; tarif Ei « Tekniska verken Linköping Nät AB », seul le cas L16 en 2026. */
const K = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Tekniska verken Linköping')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const kwh = M.FALL_KWH.L16;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const delar = {
    handel: (spot * kwh / 100) * mo,
    fast: t.fastKrPerAr * mo,
    overforing: (t.rorligOre * kwh / 100) * mo,
    skatt: (P.skatt.energiskatt_ore * kwh / 100) * mo,
  };
  const ar = delar.handel + delar.fast + delar.overforing + delar.skatt;
  const pl = M.placering(e, 'L16');
  const ab = t.fastKrPerAr - t.myndighet, ab25 = f.fastKrPerAr - f.myndighet;
  const s = M.senaste('rorligt', 'SE3', '1', 12);
  const lag = s.reduce((a, b) => (b[1] < a[1] ? b : a)), hog = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { mo, t, f, kwh, spot, delar, ar, pl, ab, ab25, lag, hog, okning: t.totalKrPerAr / f.totalKrPerAr - 1, med: pl.median * mo };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-linkoping',
  group: 'stad',
  order: 50,
  tool: 'pris',
  toolProps: { nat: 'Tekniska verken Linköping', zon: 'SE3', fall: 'L16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-jonkoping', 'effektavgift', 'kostnad-diskmaskin'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-linkoping',
    nav: 'Linköping',
    card: 'Årskostnaden för el i Linköping, del för del, med Tekniska verkens nät.',
    title: 'Elpris Linköping 2026: Tekniska verkens nät och årskostnaden',
    description: 'Elpris i Linköping 2026: SE3 och Tekniska verkens nätavgift under landets median. Se hur en lägenhets årskostnad fördelas på elhandel, nät, skatt och moms.',
    h1: 'Elpris i Linköping: vad en lägenhet betalar för elen på ett år',
    intro: 'Linköping ligger i elområde SE3 och stadens nätområde ägs av Tekniska Verken i Linköping Nät AB.',
    resume: (h) => {
      const v = K(h);
      return `${h.kr(v.ar)} om året, eller omkring ${h.kr(v.ar / 12)} i månaden, kostar elen en linköpingslägenhet med 16 ampere och 2 000 kWh när elhandeln följer SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)} (${h.ore(v.spot)} utan moms). Nätområdet Linköping har koden LNK och ägs av Tekniska Verken i Linköping Nät AB enligt Nätområden.se; hos Energimarknadsinspektionen heter bolaget Tekniska verken Linköping Nät AB. Nätet är billigare än i större delen av landet: ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms för typlägenheten, plats ${v.pl.plats} av ${v.pl.av}, mot en median på ${h.kr(v.med)}. Mellan 2025 och ${h.P.year} steg nätkostnaden med ${h.pct(v.okning)}, en måttlig ökning där överföringsavgiften gick från ${h.ore(v.f.priser[0])} till ${h.ore(v.t.priser[0])} exklusive moms. Energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och momsen läggs ovanpå. Skriv in ditt eget spotpris i kalkylatorn för att få fram priset per kilowattimme i dag.`;
    },
    faqs: (h) => {
      const v = K(h);
      return [
        { q: 'Vem äger elnätet i Linköping?', a: `Nätområdet Linköping ägs av Tekniska Verken i Linköping Nät AB enligt Nätområden.se, Svenska kraftnäts karttjänst. Det är bolagets enda nätområde i den källan. I Energimarknadsinspektionens statistik står samma nät som Tekniska verken Linköping Nät AB. Ett annat bolag med Tekniska verken i namnet finns i Katrineholm, så sök på hela namnet när du jämför.` },
        { q: 'Hur stor del av elräkningen i Linköping är nätavgift?', a: `För typlägenheten med 2 000 kWh är nätet ${h.pct((v.delar.fast + v.delar.overforing) / v.ar)} av årskostnaden med SCB:s rörliga pris för SE3 i ${mn(h, h.M.SENASTE_MANAD)}. Elhandeln är ${h.pct(v.delar.handel / v.ar)} och energiskatten ${h.pct(v.delar.skatt / v.ar)}, allt med moms. Andelarna flyttar sig när spotpriset ändras, eftersom nätets fasta del ligger still.` },
        { q: 'Finns villapriser för Tekniska verken i Linköping?', a: `Energimarknadsinspektionens tabell har inget totalbelopp för Tekniska verkens villafall, varken 2025 eller ${h.P.year}. Fältet blir tomt när typfallet inte går att räkna fram, till exempel vid en tariff med effektavgift, eller när nätet saknar sådana kunder. Villaägare lägger därför in sin överföringsavgift från bolagets prislista i kalkylatorn i stället för att utgå från ett typfall.` },
        { q: 'När var elen billigast i Linköping det senaste året?', a: `Elhandeln följer SE3. Enligt SCB var det rörliga lägenhetspriset lägst i ${mn(h, v.lag[0])} med ${h.ore(v.lag[1])} och högst i ${mn(h, v.hog[0])} med ${h.ore(v.hog[1])}, utan moms och med påslag. Nätavgiften i Linköping är densamma året runt i Ei:s typfall, så det är spotpriset som får räkningen att svänga mellan månaderna.` },
      ];
    },
    body: (h) => {
      const v = K(h);
      return `<h2>Ett år med el i en linköpingslägenhet</h2>
${h.table(['Post', 'Kronor per år inkl. moms', 'Andel'], [['Elhandel, SCB-snitt rörligt SE3', h.kr(v.delar.handel), h.pct(v.delar.handel / v.ar)], ['Nät: abonnemang och myndighetsavgifter', h.kr(v.delar.fast), h.pct(v.delar.fast / v.ar)], ['Nät: överföring', h.kr(v.delar.overforing), h.pct(v.delar.overforing / v.ar)], ['Energiskatt', h.kr(v.delar.skatt), h.pct(v.delar.skatt / v.ar)], ['Summa', h.kr(v.ar), '']], `2 000 kWh om året, 16 A. Elhandel: SCB, ${mn(h, h.M.SENASTE_MANAD)}, utan fast månadsavgift från elhandlaren. Nät: Energimarknadsinspektionen ${h.P.year}.`, ['l', 'r', 'r'])}
<p>Uppställningen visar varför en liten förbrukning ger ett högt snittpris. Abonnemanget och myndighetsavgifterna kostar lika mycket vid 1 000 som vid 3 000 kWh, och i Linköping är det ${h.kr(v.delar.fast)} om året. Delat på 2 000 kWh blir det ${h.ore(v.delar.fast / v.kwh * 100)} bara för den fasta delen. Elhandlarens eventuella månadsavgift kommer ovanpå.</p>
<h2>Tekniska verkens prislista: små steg uppåt</h2>
<p>Abonnemanget för lägenheten gick från ${h.kr(v.ab25 * v.mo)} till ${h.kr(v.ab * v.mo)} med moms och överföringen höjdes med ${h.ore((v.t.rorligOre - v.f.rorligOre) * v.mo)}. Myndighetsavgifterna steg nästan lika mycket som abonnemanget, eftersom de höjdes för alla nät till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'] * v.mo)} med moms. Totalt ökade nätet med ${h.pct(v.okning)}, ungefär som mittfältet. Placeringen i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')} är fortfarande på den billiga halvan.</p>
<h2>Det du själv kan påverka</h2>
<p>Den rörliga delen, elhandel plus överföring plus skatt, är det som krymper när du använder mindre eller flyttar förbrukningen till billigare timmar. Kör ${h.a('kostnad-diskmaskin', 'diskmaskinen')} när kvartspriset är lågt om du har ett sådant avtal. I Jönköping, också SE3, har nätbolaget en annan fördelning mellan fast och rörligt, se ${h.a('elpris-jonkoping', 'elpriset i Jönköping')}. Villaägare med effektbaserad tariff hittar förklaringen under ${h.a('effektavgift', 'effektavgift')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-linkoping',
    nav: 'Linköping',
    card: 'A year of electricity in Linköping, item by item, on Tekniska verken’s grid.',
    title: 'Electricity Price Linköping 2026: Tekniska verken Grid Fee',
    description: 'Electricity price in Linköping 2026: SE3 and a Tekniska verken grid fee below the median. See how a flat’s yearly cost splits into energy, grid, tax and VAT.',
    h1: 'Electricity price in Linköping: a flat’s power bill over a year',
    intro: 'Linköping is in bidding zone SE3, and its grid area belongs to Tekniska Verken i Linköping Nät AB.',
    resume: (h) => {
      const v = K(h);
      return `${h.kr(v.ar)} a year, or roughly ${h.kr(v.ar / 12)} a month, is what power costs a Linköping flat on a 16 A main fuse using 2,000 kWh, when retail energy follows the Statistics Sweden (SCB) variable-contract average for SE3 in ${mn(h, h.M.SENASTE_MANAD)} (${h.ore(v.spot)} before VAT). The Linköping grid area, code LNK, belongs to Tekniska Verken i Linköping Nät AB according to Nätområden.se; in the Energy Markets Inspectorate’s statistics the company appears as Tekniska verken Linköping Nät AB. The grid is cheaper than in most of Sweden: ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT for the standard flat, rank ${v.pl.plats} of ${v.pl.av}, against a median of ${h.kr(v.med)}. Between 2025 and ${h.P.year} the grid cost rose ${h.pct(v.okning)}, a moderate step, with the transfer fee moving from ${h.ore(v.f.priser[0])} to ${h.ore(v.t.priser[0])} before VAT. Energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT come on top. Enter your own spot price in the calculator for today’s figure.`;
    },
    faqs: (h) => {
      const v = K(h);
      return [
        { q: 'Who owns the power grid in Linköping?', a: `The Linköping grid area belongs to Tekniska Verken i Linköping Nät AB according to Nätområden.se, the map service of Svenska kraftnät. It is the company’s only grid area in that source. The regulator’s statistics list it as Tekniska verken Linköping Nät AB. Another company with Tekniska verken in its name serves Katrineholm, so search the full name when comparing.` },
        { q: 'How much of a Linköping power bill is the grid fee?', a: `For the standard flat using 2,000 kWh, the grid is ${h.pct((v.delar.fast + v.delar.overforing) / v.ar)} of the yearly cost at the SCB variable price for SE3 in ${mn(h, h.M.SENASTE_MANAD)}. Retail energy is ${h.pct(v.delar.handel / v.ar)} and energy tax ${h.pct(v.delar.skatt / v.ar)}, all with VAT. The shares move when spot prices change, because the grid’s fixed part stays put.` },
        { q: 'Are there house prices for Tekniska verken in Linköping?', a: `The Energy Markets Inspectorate’s table has no total for Tekniska verken’s house cases, neither for 2025 nor ${h.P.year}. The field is left empty when the standard case cannot be worked out, for instance under a tariff with a power charge (effektavgift), or when a grid has no such customers. Homeowners should enter the transfer fee from the company’s own price list in the calculator instead.` },
        { q: 'When was power cheapest in Linköping over the past year?', a: `Retail energy follows SE3. According to SCB, the variable price for flats was lowest in ${mn(h, v.lag[0])} at ${h.ore(v.lag[1])} and highest in ${mn(h, v.hog[0])} at ${h.ore(v.hog[1])}, before VAT and with mark-up. The Linköping grid fee is flat across the year in the regulator’s cases, so it is the spot price that swings the bill from month to month.` },
      ];
    },
    body: (h) => {
      const v = K(h);
      return `<h2>A year of power in a Linköping flat</h2>
${h.table(['Item', 'Kronor per year incl. VAT', 'Share'], [['Retail energy, SCB variable average SE3', h.kr(v.delar.handel), h.pct(v.delar.handel / v.ar)], ['Grid: subscription and authority charges', h.kr(v.delar.fast), h.pct(v.delar.fast / v.ar)], ['Grid: transfer', h.kr(v.delar.overforing), h.pct(v.delar.overforing / v.ar)], ['Energy tax', h.kr(v.delar.skatt), h.pct(v.delar.skatt / v.ar)], ['Total', h.kr(v.ar), '']], `2,000 kWh a year, 16 A. Energy: SCB, ${mn(h, h.M.SENASTE_MANAD)}, without any retailer monthly fee. Grid: Energy Markets Inspectorate ${h.P.year}.`, ['l', 'r', 'r'])}
<p>The breakdown explains why light users see a high average price. The subscription and authority charges cost the same at 1,000 kWh as at 3,000 kWh, and in Linköping they come to ${h.kr(v.delar.fast)} a year. Spread over 2,000 kWh, that is ${h.ore(v.delar.fast / v.kwh * 100)} for the fixed part alone. Any monthly fee from your retailer is extra.</p>
<h2>Tekniska verken’s tariff: small steps up</h2>
<p>The flat subscription went from ${h.kr(v.ab25 * v.mo)} to ${h.kr(v.ab * v.mo)} with VAT, and transfer rose by ${h.ore((v.t.rorligOre - v.f.rorligOre) * v.mo)}. The state authority charges rose almost as much as the subscription, since they went up for every grid to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'] * v.mo)} with VAT. Overall the grid cost rose ${h.pct(v.okning)}, close to the middle of the field, and its place in the ${h.a('jamfor-natavgift', 'grid fee comparison')} is still on the cheaper half.</p>
<h2>What you can influence yourself</h2>
<p>The variable part, energy plus transfer plus tax, is what shrinks when you use less or shift use to cheaper hours. Run the ${h.a('kostnad-diskmaskin', 'dishwasher')} when the quarter-hour price (kvartspris) is low if your contract follows it. In Jönköping, also SE3, the grid company splits fixed and variable differently: see ${h.a('elpris-jonkoping', 'electricity in Jönköping')}. Homeowners on a demand-based tariff will find the mechanics under ${h.a('effektavgift', 'power tariff')}.</p>`;
    },
  },
});
