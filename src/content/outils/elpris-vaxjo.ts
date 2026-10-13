import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Växjö : nätområde VXO (Växjö Energi Elnät AB, SE4, Nätområden.se) ; Ei 2026 : cas lägenhet seulement.
 *  Angle : réseau presque entièrement fixe, forte hausse 2025→2026, rang qui dépend de la consommation. */
const NIVAER = [1000, 2000, 3000, 4000];
const X = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Växjö Energi')!;
  const t = M.natTariff(e, 'L16')!;
  const f = M.natTariff(e, 'L16', 2025)!;
  const pl = M.placering(e, 'L16');
  const alla = M.rangordna('L16');
  const niva = NIVAER.map((kwh) => {
    const egen = M.natKostnad(t, kwh);
    return { kwh, kr: egen * mo, plats: alla.filter((x) => M.natKostnad(x.t, kwh) < egen).length + 1 };
  });
  const okning = t.totalKrPerAr / f.totalKrPerAr - 1;
  const hojn = M.ENHETER.map((x) => { const a = M.natTariff(x, 'L16', 2025), b = M.natTariff(x, 'L16'); return a && b ? b.totalKrPerAr / a.totalKrPerAr - 1 : null; }).filter((x): x is number => x !== null);
  const fler = hojn.filter((x) => x > okning).length;
  const lagre = alla.filter((x) => x.t.rorligOre < t.rorligOre).length;
  const spot = M.varde('rorligt', 'SE4', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const stod = P.elstod.ore_per_kwh.SE4;
  return { mo, e, t, f, pl, niva, okning, fler, nHojn: hojn.length, medHojn: M.median(hojn), lagre, spot, p, man, stod, fastAndel: t.fastKrPerAr / t.totalKrPerAr, pkt: e.cas.L16!['2026'].punkter! };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-vaxjo',
  group: 'stad',
  order: 150,
  tool: 'pris',
  toolProps: { nat: 'Växjö Energi', zon: 'SE4', fall: 'L16' },
  related: ['elpris-se4', 'jamfor-natavgift', 'elpris-jonkoping', 'elstod', 'natavgift'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse', 'regElstod'],
  sv: {
    slug: 'elpris-vaxjo',
    nav: 'Växjö',
    card: 'Elpriset i Växjö, där nätavgiften nästan bara är ett fast abonnemang.',
    title: 'Elpris Växjö 2026: Växjö Energis nätavgift och pris per kWh',
    description: 'Elpris i Växjö 2026: SE4 och Växjö Energis elnät, där lägenhetens nätkostnad steg 13,4 % och nästan allt är fast. Räkna ut ditt eget pris per kWh i dag.',
    h1: 'Elpris i Växjö med Växjö Energis elnät',
    intro: 'Växjö ligger i elområde SE4 och nätområdet ägs av Växjö Energi Elnät AB.',
    resume: (h) => {
      const v = X(h);
      return `${h.pct(v.fastAndel)} av nätkostnaden för en lägenhet i Växjö är fast. Växjö Energi Elnät AB, som äger nätområdet Växjö i SE4 enligt Svenska kraftnäts Nätområden.se, tar enligt Energimarknadsinspektionen ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms i abonnemang och myndighetsavgifter, men bara ${h.ore(v.t.priser[0], 2)} i överföringsavgift före moms. För typfallet med 2 000 kWh blir nätet ${h.kr(v.t.totalKrPerAr * v.mo)} om året, plats ${v.pl.plats} av ${v.pl.av}, efter en höjning med ${h.pct(v.okning)} från 2025. Bara ${v.fler} av ${v.nHojn} nät höjde mer i procent. Elhandeln i SE4 kostade i ${mn(h, h.M.SENASTE_MANAD)} ${h.ore(v.spot)} före moms för lägenheter med rörligt avtal enligt SCB. Kronobergs län finns inte med bland länen med sänkt energiskatt, så skatten är ${h.ore(h.P.skatt.energiskatt_ore)}. Totalpriset per kilowattimme blir ${h.ore(v.p.total)} med moms, och en lägenhet med 2 000 kWh om året betalar ungefär ${h.kr(v.man.total)} i månaden. Byt till dagens spotpris i kalkylatorn för att räkna om.`;
    },
    faqs: (h) => {
      const v = X(h);
      return [
        { q: 'Hur mycket höjdes nätavgiften i Växjö till 2026?', a: `För lägenheten med 16 ampere och 2 000 kWh steg nätkostnaden från ${h.kr(v.f.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, alltså ${h.pct(v.okning)}. Medianhöjningen bland de ${v.nHojn} nät som har lägenhetspris båda åren var ${h.pct(v.medHojn)}. Abonnemanget gick upp mest, men även överföringsavgiften steg, från ${h.ore(v.f.priser[0], 2)} till ${h.ore(v.t.priser[0], 2)} före moms.` },
        { q: 'Varför spelar förbrukningen nästan ingen roll för nätavgiften i Växjö?', a: `Överföringsavgiften är så låg att bara ${v.lagre} av ${v.pl.av} nät tar mindre per kWh för lägenheter, enligt Energimarknadsinspektionens uppgifter för ${h.P.year}. Använder du 1 000 kWh mer om året ökar nätkostnaden därför med bara ${h.kr((1000 * v.t.rorligOre * v.mo) / 100)} med moms. Det mesta du sparar på att dra ned förbrukningen kommer i stället från elhandeln och energiskatten.` },
        { q: 'Hur mycket elstöd fick hushållen i Växjö för januari och februari 2026?', a: `Växjö ligger i SE4, där stödet var ${h.num(v.stod)} öre per kWh för förbrukningen i januari och februari 2026, det högsta beloppet av de fyra elområdena. Taket var ${h.num(h.P.elstod.tak_kwh)} kWh per bostad. En lägenhet som använde 500 kWh under de två månaderna fick alltså ${h.kr((v.stod * 500) / 100)}. Försäkringskassan betalade ut stödet utan ansökan till den som stod på elnätsavtalet den 28 februari.` },
        { q: 'Gäller sänkt energiskatt i Kronobergs län?', a: `Nej. Lagen om skatt på energi ger avdraget på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} i Norrbottens, Västerbottens och Jämtlands län och i utvalda kommuner i Västernorrland, Gävleborg, Dalarna och Värmland. Kronoberg finns inte med, så i Växjö betalar hushållen full energiskatt, ${h.ore(h.P.skatt.energiskatt_ore)} före moms och ${h.ore(h.P.skatt.energiskatt_ore * v.mo)} med moms, på varje kilowattimme.` },
      ];
    },
    body: (h) => {
      const v = X(h);
      return `<h2>Växjös placering beror på hur mycket el du använder</h2>
${h.table(['Förbrukning per år', 'Nätkostnad per år inkl. moms', 'Plats bland näten'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.kr), `${x.plats} av ${v.pl.av}`]), `Lägenhet 16 A. Varje näts fasta avgift plus dess snittpris per kWh i Energimarknadsinspektionens typfall ${h.P.year}, räknat på respektive förbrukning. Plats 1 = billigast.`, ['l', 'r', 'r'])}
<p>Myndighetens rangordning utgår från 2 000 kWh om året. Med den förbrukningen hamnar Växjö Energi Elnät på plats ${v.niva[1].plats}. En lägenhet som använder mindre betalar nästan samma belopp och halkar därför ned i jämförelsen, medan den som använder mer klättrar: vid ${h.num(v.niva[3].kwh)} kWh blir det plats ${v.niva[3].plats}. Det är samma pengar på fakturan, bara jämfört med nät som tar mer betalt per kWh.</p>
<p>Ei räknar ${h.num(v.pkt)} uttagspunkter i lägenhetsfallet hos Växjö Energi Elnät. Myndigheten har för ${h.P.year} inget totalbelopp för nätets villakunder, så villor räknas inte här. Ett villapris från bolagets prislista kan du lägga in som påslag i kalkylatorn.</p>
<h2>SE4 och elstödet</h2>
<p>Enligt Nätområden.se delar Växjö elområde med Malmö och Lund, medan ${h.a('elpris-jonkoping', 'Jönköping')} ligger i SE3. Stödet för vintern 2026 följde elområdena, och hushållen i ${h.a('elpris-se4', 'SE4')} fick ${h.num(v.stod)} öre per kWh mot ${h.num(h.P.elstod.ore_per_kwh.SE3)} öre i SE3. Läs mer om ${h.a('elstod', 'elstödet')}. Hur abonnemang och överföring hänger ihop förklaras under ${h.a('natavgift', 'nätavgiften')}, och alla nät jämförs i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-vaxjo',
    nav: 'Växjö',
    card: 'Electricity price in Växjö, where the grid fee is almost all fixed subscription.',
    title: 'Electricity Price Växjö 2026: Växjö Energi Grid Fee per kWh',
    description: 'Electricity price in Växjö 2026: SE4 and Växjö Energi’s grid, where a flat’s grid cost rose 13.4% and is almost all fixed. Work out your price per kWh.',
    h1: 'Electricity price in Växjö on Växjö Energi’s grid',
    intro: 'Växjö is in bidding zone SE4, and its grid area belongs to Växjö Energi Elnät AB.',
    resume: (h) => {
      const v = X(h);
      return `${h.pct(v.fastAndel)} of a Växjö flat’s grid cost is fixed. Växjö Energi Elnät AB, which owns the Växjö grid area in SE4 according to Svenska kraftnät’s Nätområden.se, charges ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT in subscription and authority charges, according to the Energy Markets Inspectorate, but only ${h.ore(v.t.priser[0], 2)} in transfer fee (överföringsavgift) before VAT. For the 2,000 kWh standard case the grid costs ${h.kr(v.t.totalKrPerAr * v.mo)} a year, rank ${v.pl.plats} of ${v.pl.av}, after a ${h.pct(v.okning)} rise from 2025; only ${v.fler} of ${v.nHojn} grids raised theirs by more. Retail energy in SE4 cost ${h.ore(v.spot)} before VAT for flats on a variable contract in ${mn(h, h.M.SENASTE_MANAD)}, per Statistics Sweden (SCB). Kronoberg county is not among those with reduced energy tax, so tax is ${h.ore(h.P.skatt.energiskatt_ore)}. The all-in price is ${h.ore(v.p.total)} with VAT, and a flat using 2,000 kWh a year pays about ${h.kr(v.man.total)} a month.`;
    },
    faqs: (h) => {
      const v = X(h);
      return [
        { q: 'How much did Växjö’s grid fee rise for 2026?', a: `For the 16 A flat using 2,000 kWh, the grid cost rose from ${h.kr(v.f.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, or ${h.pct(v.okning)}. The median rise among the ${v.nHojn} grids with a flat price in both years was ${h.pct(v.medHojn)}. The subscription rose most, but the transfer fee went up too, from ${h.ore(v.f.priser[0], 2)} to ${h.ore(v.t.priser[0], 2)} before VAT.` },
        { q: 'Why does usage barely affect the grid fee in Växjö?', a: `The transfer fee is so low that only ${v.lagre} of ${v.pl.av} grids charge flats less per kWh, in the regulator’s ${h.P.year} data. Using 1,000 kWh more a year therefore adds just ${h.kr((1000 * v.t.rorligOre * v.mo) / 100)} with VAT to the grid bill. Most of what you save by cutting use comes from the retail energy price and the energy tax instead.` },
        { q: 'How much support did Växjö households get for January and February 2026?', a: `Växjö is in SE4, where the support was ${h.num(v.stod)} öre per kWh used in January and February 2026, the highest rate of the four zones. The cap was ${h.num(h.P.elstod.tak_kwh)} kWh per home, so a flat that used 500 kWh in those two months received ${h.kr((v.stod * 500) / 100)}. Försäkringskassan paid it with no application to whoever held the grid contract on 28 February.` },
        { q: 'Does Kronoberg county get the reduced energy tax?', a: `No. The Energy Tax Act grants the ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction in Norrbotten, Västerbotten and Jämtland counties and in selected municipalities of Västernorrland, Gävleborg, Dalarna and Värmland. Kronoberg is not on the list, so Växjö households pay full energy tax, ${h.ore(h.P.skatt.energiskatt_ore)} before VAT and ${h.ore(h.P.skatt.energiskatt_ore * v.mo)} with VAT, on every kilowatt-hour.` },
      ];
    },
    body: (h) => {
      const v = X(h);
      return `<h2>Växjö’s rank depends on how much power you use</h2>
${h.table(['Use per year', 'Grid cost per year incl. VAT', 'Rank among grids'], v.niva.map((x) => [`${h.num(x.kwh)} kWh`, h.kr(x.kr), `${x.plats} of ${v.pl.av}`]), `Flat 16 A. Each grid’s fixed charge plus its average price per kWh in the Energy Markets Inspectorate’s ${h.P.year} standard case, applied to each level of use. Rank 1 = cheapest.`, ['l', 'r', 'r'])}
<p>The regulator ranks grids at 2,000 kWh a year, where Växjö Energi Elnät places ${v.niva[1].plats}. A flat using less pays almost the same amount and so slides down the table, while a heavier user climbs: at ${h.num(v.niva[3].kwh)} kWh it is rank ${v.niva[3].plats}. The money on your bill barely moves; it is the grids that charge more per kWh that change places around it.</p>
<p>Ei counts ${h.num(v.pkt)} connection points in Växjö Energi Elnät’s flat case. For ${h.P.year} the regulator has no total for the grid’s house customers, so houses are not covered here. You can add a house tariff from the company’s price list as a mark-up in the calculator.</p>
<h2>SE4 and the electricity support</h2>
<p>According to Nätområden.se, Växjö shares its zone with Malmö and Lund, while ${h.a('elpris-jonkoping', 'Jönköping')} is in SE3. The winter 2026 support followed the zones, and households in ${h.a('elpris-se4', 'SE4')} received ${h.num(v.stod)} öre per kWh against ${h.num(h.P.elstod.ore_per_kwh.SE3)} öre in SE3. More on the ${h.a('elstod', 'electricity support')}. How subscription and transfer fit together is under ${h.a('natavgift', 'the grid fee')}, and every grid is in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
