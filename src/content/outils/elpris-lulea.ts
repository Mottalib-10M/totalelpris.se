import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Luleå : nätområde LUL (Luleå Energi Elnät AB, SE1, Nätområden.se) ; Norrbotten = avdrag (LSE 11 kap. 4 §).
 *  Angle : Ei donne 0 öre de transfert pour lägenhet et villa 20/25 A, le réseau est entièrement fixe. */
const L = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Luleå Energi')!;
  const t = M.natTariff(e, 'L16')!;
  const t25 = M.natTariff(e, 'L16', 2025)!;
  const v16 = M.natTariff(e, 'V16')!;
  const v20 = M.natTariff(e, 'V20')!;
  const pl = M.placering(e, 'L16');
  const r25 = M.rangordna('L16', 2025);
  const pl25 = { plats: r25.findIndex((x) => x.e.id === e.id) + 1, av: r25.length };
  const noll = M.rangordna('L16').map((x, i) => ({ ...x, plats: i + 1 })).filter((x) => x.t.rorligOre < 0.001);
  const spot = M.varde('rorligt', 'SE1', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const man = M.manadskostnad({ kwh: 2000 / 12, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const extra = (2000 * p.total) / 100;
  const medRor = M.median(M.rangordna('L16').map((x) => x.t.rorligOre));
  return { mo, e, t, t25, v16, v20, pl, pl25, noll, spot, p, man, extra, medRor, okning: t.totalKrPerAr / t25.totalKrPerAr - 1, pkt: e.cas.L16!['2026'].punkter! };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-lulea',
  group: 'stad',
  order: 120,
  tool: 'pris',
  toolProps: { nat: 'Luleå Energi', zon: 'SE1', fall: 'L16', skatt: 1 },
  related: ['elpris-se1', 'jamfor-natavgift', 'elpris-umea', 'energiskatt', 'natavgift'],
  sources: ['eiNat', 'natomraden', 'scbElpriser', 'lse'],
  sv: {
    slug: 'elpris-lulea',
    nav: 'Luleå',
    card: 'Elpriset i Luleå, där lägenhetens elnät bara har en fast avgift.',
    title: 'Elpris Luleå 2026: elnät utan överföringsavgift per kWh',
    description: 'Elpris i Luleå 2026: SE1, energiskatt 26,4 öre och Luleå Energis elnät, där lägenheter betalar 0 öre per kWh i överföring. Se vad ytterligare en kWh kostar.',
    h1: 'Elpris i Luleå med Luleå Energis fasta nätavgift',
    intro: 'Luleå ligger i elområde SE1 och nätområdet ägs av Luleå Energi Elnät AB.',
    resume: (h) => {
      const v = L(h);
      return `${h.ore(v.p.total)} med moms kostar varje kilowattimme för en lägenhet i Luleå när elhandeln ligger på SCB:s snitt för rörligt avtal i SE1 i ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} före moms, och i det priset finns ingen nätdel alls. Luleå Energi Elnät AB, som äger nätområdet Luleå i SE1 enligt Svenska kraftnäts Nätområden.se, redovisar till Energimarknadsinspektionen noll öre i överföringsavgift för lägenheter med 16 ampere. Hela nätkostnaden, ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms, är fast. Det placerar nätet på plats ${v.pl.plats} av ${v.pl.av} för lägenheter, alltså bland de allra billigaste. Det rörliga priset består därför bara av elhandeln och energiskatten, som i Norrbottens län är sänkt till ${h.ore(h.P.skatt.energiskatt_sankt_ore)}, plus moms. Med 2 000 kWh om året blir elräkningen ungefär ${h.kr(v.man.total)} i månaden. Skriv in dagens spotpris i kalkylatorn för att se priset på nästa kilowattimme.`;
    },
    faqs: (h) => {
      const v = L(h);
      return [
        { q: 'Betalar man ingen överföringsavgift alls hos Luleå Energi?', a: `För lägenheten med 16 ampere och för villorna med 20 och 25 ampere står noll öre per kWh i Energimarknadsinspektionens uppgifter för ${h.P.year}. Villan med 16 ampere är undantaget: där tar Luleå Energi Elnät ${h.ore(v.v16.priser[0])} före moms. Kontrollera vilken tariff som står på din nätfaktura, eftersom det är den som avgör vad du betalar.` },
        { q: 'Vad kostar en extra kilowattimme i en Luleålägenhet?', a: `Med SCB:s snittpris för SE1 kostar nästa kilowattimme ${h.ore(v.p.total)} med moms: elhandel, sänkt energiskatt och moms, men inget till nätet. Fördubblar lägenheten förbrukningen från 2 000 till 4 000 kWh om året ökar kostnaden med ungefär ${h.kr(v.extra)}, medan nätavgiften på ${h.kr(v.t.fastKrPerAr * v.mo)} är oförändrad. Snittpriset per kWh sjunker alltså ju mer du använder.` },
        { q: 'Vilka andra elnät tar bara fast avgift av lägenheter?', a: `I Energimarknadsinspektionens sammanställning för ${h.P.year} har ${v.noll.length} nät noll öre i överföringsavgift för lägenhetsfallet: ${v.noll.map((x) => x.e.foretag).join(', ')}. Deras nätområden Luleå, Pitebygden och Boden ligger alla i SE1 enligt Nätområden.se. Medianen bland alla ${v.pl.av} nät är ${h.ore(v.medRor)} före moms, så nollan är ovanlig.` },
        { q: 'Hur mycket dyrare blev Luleå Energis abonnemang 2026?', a: `Lägenhetens nätkostnad steg från ${h.kr(v.t25.totalKrPerAr * v.mo)} till ${h.kr(v.t.totalKrPerAr * v.mo)} om året med moms, ${h.pct(v.okning)}. Eftersom överföringsavgiften är noll ligger hela höjningen i den fasta delen, där också de statliga myndighetsavgifterna ingår; de gick upp till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} om året för alla nät. År 2025 var nätet på plats ${v.pl25.plats} av ${v.pl25.av}.` },
      ];
    },
    body: (h) => {
      const v = L(h);
      return `<h2>Vad en Luleålägenhet betalar per kWh</h2>
${h.table(['Del av priset', 'Inkl. moms'], [['Elhandel, SCB-snitt rörligt SE1', h.ore(v.spot * v.mo)], ['Överföringsavgift, Luleå Energi Elnät', h.ore(v.t.rorligOre * v.mo)], ['Energiskatt med avdrag', h.ore(h.P.skatt.energiskatt_sankt_ore * v.mo)], ['Rörligt pris totalt', h.ore(v.p.total)], ['Fast nätavgift per månad', h.kr((v.t.fastKrPerAr * v.mo) / 12)]], `Lägenhet 16 A. Elhandel: SCB, ${mn(h, h.M.SENASTE_MANAD)}. Nät: Energimarknadsinspektionen ${h.P.year}. Elhandlarens eventuella månadsavgift ingår inte.`, ['l', 'r'])}
<p>I de flesta städer har nätet en del i varje kilowattimme. I Luleå är den raden noll, och elhandeln står för ${h.pct((v.spot * v.mo) / v.p.total)} av det rörliga priset. Spotpriset slår därför igenom tydligare på räkningen här än där nätet tar betalt per kWh. Ei räknar ${h.num(v.pkt)} uttagspunkter i lägenhetsfallet hos Luleå Energi Elnät.</p>
<h2>Näten som bara tar fast avgift</h2>
${h.table(['Nätföretag', 'Kostnad per år inkl. moms', 'Plats'], v.noll.map((x) => [x.e.namn, h.kr(x.t.totalKrPerAr * v.mo), `${x.plats} av ${v.pl.av}`]), `Lägenhet 16 A, 2 000 kWh. Nät med 0 öre i överföringsavgift i Energimarknadsinspektionens uppgifter för ${h.P.year}.`, ['l', 'r', 'r'])}
<p>Samma upplägg finns hos Luleå Energi för villor med 20 och 25 ampere, där den fasta avgiften för 20 ampere är ${h.kr(v.v20.fastKrPerAr * v.mo)} om året med moms. Hur abonnemang och överföring kan fördelas förklaras under ${h.a('natavgift', 'nätavgiften')}.</p>
<h2>Skatten och elområdet</h2>
<p>Avdraget i energiskatten gäller hela Norrbottens län; varför och för vilka står i guiden om ${h.a('energiskatt', 'energiskatt på el')}. Hur SE1 skiljer sig från resten av landet visar sidan om ${h.a('elpris-se1', 'elpris i SE1')}. ${h.a('elpris-umea', 'Umeå')} har ett nät som är ännu något billigare för lägenheter, och alla nät jämförs i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-lulea',
    nav: 'Luleå',
    card: 'Electricity price in Luleå, where the flat grid tariff is a fixed fee only.',
    title: 'Electricity Price Luleå 2026: Grid with No Transfer Fee',
    description: 'Electricity price in Luleå 2026: SE1, 26.4 öre energy tax and Luleå Energi’s grid, where flats pay 0 öre per kWh for transfer. See what one more kWh costs.',
    h1: 'Electricity price in Luleå on Luleå Energi’s flat-rate grid',
    intro: 'Luleå is in bidding zone SE1, and its grid area belongs to Luleå Energi Elnät AB.',
    resume: (h) => {
      const v = L(h);
      return `${h.ore(v.p.total)} with VAT is what each kilowatt-hour costs a Luleå flat when retail energy is at the Statistics Sweden (SCB) variable-contract average for SE1 in ${mn(h, h.M.SENASTE_MANAD)}, ${h.ore(v.spot)} before VAT, and that price contains no grid element at all. Luleå Energi Elnät AB, which owns the Luleå grid area in SE1 according to Svenska kraftnät’s Nätområden.se, reports a transfer fee (överföringsavgift, the per-kWh grid charge) of zero öre for 16 A flats to the Energy Markets Inspectorate. The whole grid cost, ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT, is fixed, ranking the grid ${v.pl.plats} of ${v.pl.av} for flats. Your variable price is therefore just energy plus energy tax, which in Norrbotten county is reduced to ${h.ore(h.P.skatt.energiskatt_sankt_ore)}, plus VAT. At 2,000 kWh a year the bill is roughly ${h.kr(v.man.total)} a month. Enter today’s spot price to see what your next unit costs.`;
    },
    faqs: (h) => {
      const v = L(h);
      return [
        { q: 'Is there really no transfer fee with Luleå Energi?', a: `For the 16 A flat and the 20 A and 25 A houses, the regulator’s ${h.P.year} data shows zero öre per kWh. The 16 A house is the exception: there Luleå Energi Elnät charges ${h.ore(v.v16.priser[0])} before VAT. Check which tariff is printed on your grid bill, since that is what you actually pay, and pick the matching case in the calculator.` },
        { q: 'What does one more kilowatt-hour cost in a Luleå flat?', a: `At the SCB average for SE1 the next kilowatt-hour costs ${h.ore(v.p.total)} with VAT: energy, reduced energy tax and VAT, with nothing for the grid. Doubling a flat’s use from 2,000 to 4,000 kWh a year adds about ${h.kr(v.extra)}, while the ${h.kr(v.t.fastKrPerAr * v.mo)} grid fee stays the same. Your average price per kWh falls the more you use.` },
        { q: 'Which other grids charge flats a fixed fee only?', a: `In the regulator’s ${h.P.year} compilation, ${v.noll.length} grids show zero öre transfer fee for the flat case: ${v.noll.map((x) => x.e.foretag).join(', ')}. Their grid areas, Luleå, Pitebygden and Boden, all lie in SE1 according to Nätområden.se. The median across all ${v.pl.av} grids is ${h.ore(v.medRor)} before VAT, so a zero is unusual in Sweden.` },
        { q: 'How much did Luleå Energi’s subscription go up in 2026?', a: `The flat’s grid cost rose from ${h.kr(v.t25.totalKrPerAr * v.mo)} to ${h.kr(v.t.totalKrPerAr * v.mo)} a year with VAT, ${h.pct(v.okning)}. With a zero transfer fee the whole rise sits in the fixed part, which also contains the state authority charges; those went up to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'], 2)} a year for every grid. In 2025 the grid ranked ${v.pl25.plats} of ${v.pl25.av}.` },
      ];
    },
    body: (h) => {
      const v = L(h);
      return `<h2>What a Luleå flat pays per kWh</h2>
${h.table(['Part of the price', 'Incl. VAT'], [['Energy, SCB variable average SE1', h.ore(v.spot * v.mo)], ['Transfer fee, Luleå Energi Elnät', h.ore(v.t.rorligOre * v.mo)], ['Energy tax after deduction', h.ore(h.P.skatt.energiskatt_sankt_ore * v.mo)], ['Total variable price', h.ore(v.p.total)], ['Fixed grid fee per month', h.kr((v.t.fastKrPerAr * v.mo) / 12)]], `Flat 16 A. Energy: Statistics Sweden, ${mn(h, h.M.SENASTE_MANAD)}. Grid: Energy Markets Inspectorate ${h.P.year}. Any monthly retailer fee is not included.`, ['l', 'r'])}
<p>In most Swedish cities the grid takes a slice of every kilowatt-hour. In Luleå that line is zero, and energy makes up ${h.pct((v.spot * v.mo) / v.p.total)} of the variable price. Spot price swings therefore show up more directly on the bill here than where the grid charges per kWh. Ei counts ${h.num(v.pkt)} connection points in Luleå Energi Elnät’s flat case.</p>
<h2>The grids that charge a fixed fee only</h2>
${h.table(['Grid company', 'Cost per year incl. VAT', 'Rank'], v.noll.map((x) => [x.e.namn, h.kr(x.t.totalKrPerAr * v.mo), `${x.plats} of ${v.pl.av}`]), `Flat 16 A, 2,000 kWh. Grids with a 0 öre transfer fee in the Energy Markets Inspectorate’s ${h.P.year} data.`, ['l', 'r', 'r'])}
<p>Luleå Energi uses the same model for 20 A and 25 A houses; the fixed fee on 20 A is ${h.kr(v.v20.fastKrPerAr * v.mo)} a year with VAT. How a grid fee can be split between subscription and transfer is explained under ${h.a('natavgift', 'the grid fee')}.</p>
<h2>Tax and bidding zone</h2>
<p>The energy tax deduction covers all of Norrbotten county; who qualifies is set out in the guide to ${h.a('energiskatt', 'energy tax on electricity')}. How SE1 differs from the rest of Sweden is on the ${h.a('elpris-se1', 'SE1 price page')}. ${h.a('elpris-umea', 'Umeå')} has a grid that is slightly cheaper still for flats, and all grids are compared in the ${h.a('jamfor-natavgift', 'grid fee comparison')}.</p>`;
    },
  },
});
