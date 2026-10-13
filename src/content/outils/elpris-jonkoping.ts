import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Jönköping : nätområde JNK (« Jönköping Energi Nät AB », SE3, Nätområden.se) ; tarif Ei « Jönköping Energinät AB », seul le cas L16 en 2026 (villas présentes en 2025). */
const VILLOR = ['V16', 'V20', 'V25'] as const;
const J = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Jönköping Energinät')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const lnk = M.natTariff(M.hittaEnhet('Tekniska verken Linköping')!, 'L16')!;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const fast1 = M.varde('avtal1ar', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: M.FALL_KWH.L16 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const pl = M.placering(e, 'L16');
  const villa25 = VILLOR.map((k) => ({ k, t: M.natTariff(e, k, 2025), nu: M.natTariff(e, k) }));
  const ab = t.fastKrPerAr - t.myndighet, ab25 = f.fastKrPerAr - f.myndighet;
  return { mo, t, f, lnk, spot, fast1, p, man, pl, villa25, ab, ab25, med: pl.median * mo };
};
const NAMN = { sv: { V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-jonkoping',
  group: 'stad',
  order: 70,
  tool: 'pris',
  toolProps: { nat: 'Jönköping Energinät', zon: 'SE3', fall: 'L16' },
  related: ['elpris-se3', 'jamfor-natavgift', 'elpris-linkoping', 'kostnad-tvattmaskin', 'effektavgift'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'skvEl'],
  sv: {
    slug: 'elpris-jonkoping',
    nav: 'Jönköping',
    card: 'Elpriset i Jönköping med Jönköping Energinäts billiga lägenhetstariff, SE3.',
    title: 'Elpris Jönköping 2026: Jönköping Energinät och pris per kWh',
    description: 'Elpris i Jönköping 2026: SE3 och ett av de billigare elnäten för lägenheter, med oförändrad överföringsavgift. Räkna ut ditt pris per kWh och din månadsräkning.',
    h1: 'Elpris i Jönköping med Jönköping Energinäts avgifter',
    intro: 'Jönköping ligger i elområde SE3, och stadens nätområde ägs av Jönköping Energi Nät AB.',
    resume: (h) => {
      const v = J(h);
      return `Kring ${h.kr(v.man.total)} i månaden betalar en jönköpingslägenhet med 16 ampere och 2 000 kWh om året för elen, när elhandeln kostar som SCB:s snitt för rörligt avtal i SE3 i ${mn(h, h.M.SENASTE_MANAD)} (${h.ore(v.spot)} utan moms) och nätet följer Energimarknadsinspektionens siffror för ${h.P.year}. Nätområdet Jönköping ägs enligt Nätområden.se av Jönköping Energi Nät AB; hos Energimarknadsinspektionen redovisas samma nät som Jönköping Energinät AB. Nätet hör till de billigare i landet för lägenheter: ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, plats ${v.pl.plats} av ${v.pl.av}. Överföringsavgiften är oförändrad sedan 2025, ${h.ore(v.t.priser[0])} exklusive moms, medan abonnemanget höjdes. Per kilowattimme blir priset just nu ungefär ${h.ore(v.p.total)} med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms. För villor har myndigheten inget typfall ${h.P.year}, så villaägare lägger in sin egen överföringsavgift. Skriv in dagens spotpris i kalkylatorn för att se ditt pris.`;
    },
    faqs: (h) => {
      const v = J(h);
      return [
        { q: 'Heter nätbolaget i Jönköping Energinät eller Energi Nät?', a: `Båda namnen förekommer i officiella källor. Svenska kraftnäts Nätområden.se anger Jönköping Energi Nät AB som ägare av nätområdet Jönköping med koden JNK, medan Energimarknadsinspektionens tabell över nätavgifter skriver Jönköping Energinät AB. Det är samma nät; sök på Jönköping Energinät när du jämför avgifter i myndighetens statistik eller i vår kalkylator.` },
        { q: 'Varför saknas villapriser för Jönköping 2026?', a: `I Energimarknadsinspektionens tabell för 2025 finns totalbelopp för Jönköpings villafall med 16, 20 och 25 ampere, men för ${h.P.year} är fälten tomma. Myndigheten fyller inte i typfall som inte går att räkna fram ur prislistan, till exempel när en tariff har effektavgift. Vi gissar inte, utan visar lägenhetsfallet och låter villaägare skriva in sin egen avgift.` },
        { q: 'Hur mycket steg Jönköping Energinäts abonnemang?', a: `För lägenheten med 16 ampere gick abonnemanget från ${h.kr(v.ab25 * v.mo)} till ${h.kr(v.ab * v.mo)} om året inklusive moms mellan 2025 och ${h.P.year}. Myndighetsavgifterna steg samtidigt till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms. Överföringsavgiften rördes inte, så hela ökningen ligger i den fasta delen och märks lika mycket oavsett förbrukning.` },
        { q: 'Är nätavgiften lägre i Jönköping än i Linköping?', a: `Ja, för lägenhetsfallet. Jönköping Energinät kostar ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms och Tekniska verken i Linköping ${h.kr(v.lnk.totalKrPerAr * v.mo)}, enligt Energimarknadsinspektionens siffror för ${h.P.year}. Båda städerna ligger i SE3, så elhandeln kostar lika mycket. Skillnaden på ${h.kr((v.lnk.totalKrPerAr - v.t.totalKrPerAr) * v.mo)} om året kommer helt från nätet.` },
      ];
    },
    body: (h) => {
      const v = J(h);
      const tom = h.lang === 'sv' ? 'saknas' : 'n/a';
      return `<h2>Villorna som försvann ur tabellen</h2>
${h.table(['Typfall', 'Nät 2025 inkl. moms', `Nät ${h.P.year}`], [['Lägenhet 16 A, 2 000 kWh', h.kr(v.f.totalKrPerAr * v.mo), h.kr(v.t.totalKrPerAr * v.mo)], ...v.villa25.map((x) => [NAMN.sv[x.k], x.t ? h.kr(x.t.totalKrPerAr * v.mo) : tom, x.nu ? h.kr(x.nu.totalKrPerAr * v.mo) : tom])], `Jönköping Energinät AB. 2025 räknat med 2025 års myndighetsavgifter. Källa: Energimarknadsinspektionen.`, ['l', 'r', 'r'])}
<p>För 2025 gick det att jämföra jönköpingsvillor med resten av landet direkt i Energimarknadsinspektionens statistik. För ${h.P.year} finns bara lägenheten kvar. Det säger inget om att villorna fått det dyrare eller billigare, bara att typfallen inte längre räknas fram för dem. Villaägare som har en effektavgift kan läsa hur den fungerar under ${h.a('effektavgift', 'effektavgift')}.</p>
<h2>Lägenheten: billig överföring, högre abonnemang</h2>
<p>Med ${h.kr(v.t.totalKrPerAr * v.mo)} om året ligger Jönköping Energinät ${h.kr(v.med - v.t.totalKrPerAr * v.mo)} under landets median för lägenheter, ${h.kr(v.med)}. Överföringsavgiften på ${h.ore(v.t.rorligOre * v.mo)} med moms gör att varje sparad kilowattimme ger lite i nätet; elhandeln och skatten väger mer. En tvätt i eco-läge är därför i Jönköping mest elhandel och skatt, se ${h.a('kostnad-tvattmaskin', 'vad en tvätt kostar')}. Grannstaden i öster har ett något dyrare nät: ${h.a('elpris-linkoping', 'elpriset i Linköping')}.</p>
<h2>Fast eller rörligt i SE3 just nu</h2>
<p>SCB:s statistik för ${mn(h, h.M.SENASTE_MANAD)} visar att ettåriga fastprisavtal för lägenheter i SE3 tecknades till ${h.ore(v.fast1)}, mot ${h.ore(v.spot)} för rörligt, båda utan moms. Det fasta priset köper bort risken för en dyr vinter men har ett pris. Följ zonen på ${h.a('elpris-se3', 'sidan om SE3')} eller jämför nätet med andra orter i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-jonkoping',
    nav: 'Jönköping',
    card: 'Electricity price in Jönköping on Jönköping Energinät’s low-cost flat tariff, SE3.',
    title: 'Electricity Price Jönköping 2026: Jönköping Energinät Grid',
    description: 'Electricity price in Jönköping 2026: SE3 and one of the cheaper grids for flats, with an unchanged transfer fee. Work out your price per kWh and bill.',
    h1: 'Electricity price in Jönköping on Jönköping Energinät’s grid',
    intro: 'Jönköping is in bidding zone SE3, and its grid area belongs to Jönköping Energi Nät AB.',
    resume: (h) => {
      const v = J(h);
      return `About ${h.kr(v.man.total)} a month is what a Jönköping flat on a 16 A main fuse using 2,000 kWh a year pays for power, when retail energy costs the Statistics Sweden (SCB) variable-contract average for SE3 in ${mn(h, h.M.SENASTE_MANAD)} (${h.ore(v.spot)} before VAT) and the grid follows the Energy Markets Inspectorate’s ${h.P.year} figures. Nätområden.se gives Jönköping Energi Nät AB as owner of the Jönköping grid area; the regulator reports the same grid as Jönköping Energinät AB. For flats it is among the cheaper grids in Sweden: ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, rank ${v.pl.plats} of ${v.pl.av}. The transfer fee (per-kWh grid charge) is unchanged since 2025 at ${h.ore(v.t.priser[0])} before VAT, while the subscription went up. Per kilowatt-hour you currently pay around ${h.ore(v.p.total)} with energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT. The regulator has no house case for ${h.P.year}, so homeowners enter their own transfer fee.`;
    },
    faqs: (h) => {
      const v = J(h);
      return [
        { q: 'Is the Jönköping grid company called Energinät or Energi Nät?', a: `Both names appear in official sources. Svenska kraftnät’s Nätområden.se gives Jönköping Energi Nät AB as owner of the Jönköping grid area, code JNK, while the Energy Markets Inspectorate’s grid fee table writes Jönköping Energinät AB. It is the same grid; search for Jönköping Energinät when comparing fees in the regulator’s statistics or in our calculator.` },
        { q: 'Why are there no house prices for Jönköping in 2026?', a: `The regulator’s 2025 table has totals for Jönköping’s house cases at 16, 20 and 25 A, but for ${h.P.year} the fields are empty. The regulator leaves a case blank when it cannot be derived from the price list, for example under a tariff with a power charge (effektavgift). We do not guess; we show the flat case and let homeowners enter their own fee.` },
        { q: 'How much did Jönköping Energinät’s subscription rise?', a: `For the 16 A flat, the subscription went from ${h.kr(v.ab25 * v.mo)} to ${h.kr(v.ab * v.mo)} a year including VAT between 2025 and ${h.P.year}. State authority charges rose at the same time to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT. The transfer fee did not move, so the whole increase sits in the fixed part and hits light and heavy users equally.` },
        { q: 'Is the grid fee lower in Jönköping than in Linköping?', a: `Yes, for the flat case. Jönköping Energinät costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT and Tekniska verken in Linköping ${h.kr(v.lnk.totalKrPerAr * v.mo)}, according to the regulator’s ${h.P.year} figures. Both cities are in SE3, so retail energy costs the same. The gap of ${h.kr((v.lnk.totalKrPerAr - v.t.totalKrPerAr) * v.mo)} a year comes entirely from the grid.` },
      ];
    },
    body: (h) => {
      const v = J(h);
      const tom = 'n/a';
      return `<h2>The houses that dropped out of the table</h2>
${h.table(['Standard case', 'Grid 2025 incl. VAT', `Grid ${h.P.year}`], [['Flat 16 A, 2,000 kWh', h.kr(v.f.totalKrPerAr * v.mo), h.kr(v.t.totalKrPerAr * v.mo)], ...v.villa25.map((x) => [NAMN.en[x.k], x.t ? h.kr(x.t.totalKrPerAr * v.mo) : tom, x.nu ? h.kr(x.nu.totalKrPerAr * v.mo) : tom])], `Jönköping Energinät AB. 2025 computed with that year’s authority charges. Source: Energy Markets Inspectorate.`, ['l', 'r', 'r'])}
<p>For 2025 you could compare Jönköping houses with the rest of the country straight from the regulator’s statistics. For ${h.P.year} only the flat remains. That says nothing about whether houses now pay more or less, only that the standard cases are no longer worked out for them. Homeowners with a demand-based charge can read how it works under ${h.a('effektavgift', 'power tariff')}.</p>
<h2>The flat: cheap transfer, higher subscription</h2>
<p>At ${h.kr(v.t.totalKrPerAr * v.mo)} a year, Jönköping Energinät sits ${h.kr(v.med - v.t.totalKrPerAr * v.mo)} below the national median for flats, ${h.kr(v.med)}. A transfer fee of ${h.ore(v.t.rorligOre * v.mo)} with VAT means each kilowatt-hour saved does little for the grid part; energy and tax matter more. An eco wash in Jönköping is therefore mostly energy and tax, see ${h.a('kostnad-tvattmaskin', 'what a wash costs')}. The neighbouring city to the east has a slightly dearer grid: ${h.a('elpris-linkoping', 'electricity in Linköping')}.</p>
<h2>Fixed or variable in SE3 right now</h2>
<p>SCB figures for ${mn(h, h.M.SENASTE_MANAD)} show one-year fixed contracts for flats in SE3 signed at ${h.ore(v.fast1)}, against ${h.ore(v.spot)} on a variable price, both before VAT. A fixed price buys protection against a dear winter, at a cost. Follow the zone on the ${h.a('elpris-se3', 'SE3 page')} or compare the grid with other towns in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
