import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Spotpris : ce qu'il est, l'enchère de midi, les quarts d'heure, pourquoi le site ne le republie pas, où le voir. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const ex = (spot: number) => M.totalpris({ spot, natOverforing: 25, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const rader = [0, 50, 100, 200].map((s) => ({ s, d: ex(s) }));
  const scb = M.varde('rorligt', 'SE3', '2')!;
  return { mo, rader, scb, m: P.marknad };
};

export default defineGuide({
  id: 'spotpris',
  group: 'guide',
  order: 30,
  mini: 'spotpris',
  related: ['elpris-imorgon', 'kvartspris', 'elomraden', 'negativa-elpriser', 'paslag'],
  sources: ['svkDagenFore', 'svkKvart', 'embKvartNyhet', 'entsoe', 'svkElomraden'],
  sv: {
    slug: 'spotpris',
    nav: 'Spotpris',
    card: 'Vad spotpriset är, när det sätts och var du ser det gratis.',
    title: 'Spotpris el 2026: så sätts det och var du ser det gratis',
    description: 'Spotpris el 2026: priset sätts vid auktionen kl. 12 dagen före, ett per kvart sedan oktober 2025. Vad det betyder för din räkning och var du ser det gratis.',
    h1: 'Spotpriset på el: vad det är och hur det blir ditt pris',
    intro: 'Spotpriset är elbörsens pris för nästa dygn. Det är grunden för rörliga avtal men bara en del av det du betalar.',
    resume: (h) => {
      const v = V(h);
      const r = v.rader[2];
      return `Spotpriset är det pris som sätts på elbörsens dagen före-marknad, där köp- och säljbud för varje kvart under nästa dygn matchas vid en auktion klockan ${v.m.auktion_kl} dagen före leveransdagen. Sedan den 1 oktober 2025 får varje dygn 96 kvartspriser i stället för 24 timpriser, och priset är detsamma inom hela elområdet. Spotpriset anges utan moms, utan energiskatt och utan nätavgift. Därför är 100 öre på börstavlan inte 100 öre på din faktura: med energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)}, en överföringsavgift på 25 öre och 25 procent moms blir det ${h.ore(r.d.total)}. Den här sajten visar inte dagens spotpris, eftersom det inte får återpubliceras fritt. Du ser det gratis i din elhandlares app eller på ENTSO-E:s transparensplattform och kan sedan skriva in det, eller klistra in hela dygnet, i vår kalkylator.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Varför visar Elpriskollen inte dagens spotpris?', a: 'Day-ahead-priserna ägs av elbörsen. ENTSO-E publicerar dem på sin transparensplattform, men villkoren för fri återanvändning omfattar en lista med data där dagspriserna inte ingår, och börsen säljer licenser för att visa dem. Vi återpublicerar därför inga spotpriser och visar i stället vad de betyder för din räkning.' },
        { q: 'Var kan jag se spotpriset gratis?', a: 'I din elhandlares app eller på Mina sidor, där priset för ditt elområde brukar visas per kvart eller timme, och på ENTSO-E:s transparensplattform, där du väljer day-ahead-priser och elområde SE1, SE2, SE3 eller SE4. Kopiera listan och klistra in den i kalkylatorn för att få totalpriset.' },
        { q: 'Är spotpriset samma sak som mitt rörliga elpris?', a: `Nej. Ett rörligt månadspris är ett snitt av månadens spotpriser, viktat efter hur kunderna i elområdet använder el, plus elhandlarens påslag. SCB:s snitt för rörligt avtal till en villa utan elvärme i SE3 var senast ${h.ore(v.scb)} exklusive moms, påslaget inräknat. Ett kvartsprisavtal följer däremot varje kvarts spotpris.` },
        { q: 'Kan spotpriset ändras efter auktionen?', a: `Nej, dagen före-priset för en kvart ändras inte efter auktionen klockan ${v.m.auktion_kl}. Det som kan ändras är priset på intradagmarknaden, där el handlas närmare leveransen, men hushållens avtal bygger på dagen före-priset. Den som har kvartsprisavtal vet alltså morgondagens priser redan på eftermiddagen.` },
        { q: 'Varför skiljer spotpriset mellan elområdena?', a: 'Svenska kraftnät förklarar att elområdena finns för att el ska kunna föras från norr till söder utan driftstörningar, och att gränserna går där det finns flaskhalsar. Inom ett elområde är priset alltid detsamma. När ledningarna mellan områdena räcker till blir priserna lika; när de inte gör det skiljer de sig.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rader.map((x) => [`${h.num(x.s)} öre`, h.ore(x.d.spot * v.mo), h.ore((x.d.natOverforing + x.d.energiskatt) * v.mo), h.ore(x.d.total)]);
      return `<h2>Hur auktionen går till</h2>
<p>Svenska kraftnät beskriver dagen före-marknaden så här: köpare och säljare anger hur mycket el de vill köpa eller sälja varje kvart mellan klockan 00 och 24 under nästa dygn, och till vilket pris. Klockan ${v.m.auktion_kl} dagen före matchas alla bud i en gemensam auktion. För varje kvart och varje elområde blir resultatet ett pris och en volym. Priset gäller sedan alla som handlat i det området den kvarten.</p>
<p>Övergången till kvartar gjordes i hela Norden samtidigt. Energimarknadsbyrån skrev den 1 oktober 2025 att elpriset nu uppdateras fyra gånger per timme i stället för en gång, och Svenska kraftnät att 15 minuters tidsupplösning är införd både på dagen före-marknaden och intradagmarknaden. För dig betyder det 96 priser per dygn, 92 eller 100 de dygn då klockan ställs om.</p>
<h2>Från börspris till totalpris</h2>
${h.table(['Spotpris', 'Spotpris med moms', 'Nät och skatt med moms', 'Totalpris per kWh'], rows, `Exempel med överföringsavgift 25 öre exkl. moms och energiskatt ${h.ore(h.P.skatt.energiskatt_ore)}. Påslag ingår inte.`, ['l', 'r', 'r', 'r'])}
<p>Tabellen visar varför ett spotpris på noll inte betyder gratis el. Nätets överföringsavgift och energiskatten är fasta per kWh, och momsen läggs på dem också. När spotpriset dubblas från 100 till 200 öre ökar totalpriset med 125 öre men inte dubbelt. Kalkylatorn gör samma uträkning med ditt riktiga nät och ditt påslag.</p>
<h2>Varför sajten inte återpublicerar spotpriset</h2>
<p>Dagspriserna räknas fram av elbörserna, som äger resultatet. ENTSO-E, de europeiska stamnätsoperatörernas organisation, visar priserna på sin ${h.src('entsoe', 'transparensplattform')}, men villkoren för fri återanvändning gäller en uppräknad lista med data. Day-ahead-priserna finns inte på den listan, så den som vill visa dem offentligt behöver börsens tillstånd. Flera prissajter visar dem ändå utan att redovisa någon licens. Vi väljer att inte göra det.</p>
<p>Det är också skälet till att våra historiska siffror kommer från SCB, inte från börsen. SCB publicerar vad elhandlarna faktiskt har fakturerat hushållen per månad, under licensen CC0, och det är den statistiken som förifyller kalkylatorn och visas på sidan ${h.a('elpriser-per-manad', 'elpriser per månad')}.</p>
<h2>Så använder du spotpriset i kalkylatorn</h2>
<ol>
<li>Öppna din elhandlares app eller ENTSO-E:s plattform och välj ditt elområde. Är du osäker på vilket, se ${h.a('elomraden', 'elområden')}.</li>
<li>Skriv in priset för den kvart du är intresserad av, i öre per kWh utan moms. Visar appen priset med moms, dela det med 1,25 först.</li>
<li>Vill du se hela dygnet, kopiera alla priser och klistra in dem i rutan under kalkylatorn. Öre, kronor och euro per megawattimme känns igen.</li>
<li>Välj ditt nätområde och din säkring. Totalpriset, dygnets lägsta och högsta pris och den billigaste perioden räknas fram direkt.</li>
</ol>
<p>Med morgondagens priser fungerar det likadant; se ${h.a('elpris-imorgon', 'elpris imorgon')}.</p>
<h2>Dygnssnitt, månadssnitt och vad som syns i appen</h2>
<p>Många appar visar ett enda tal för dagen. Det är oftast ett enkelt snitt av dygnets 96 kvartar, där en kvart klockan tre på natten väger lika mycket som en kvart klockan sex på kvällen. Ett rörligt månadspris är däremot viktat efter när kunderna i elområdet faktiskt använder el. Används mycket el under de dyra kvartarna, till exempel en kall vinterkväll, blir det viktade priset högre än appens enkla snitt, och tvärtom om förbrukningen ligger på billiga kvartar. Det är också därför SCB:s månadspriser, som bygger på vad som fakturerats, är bättre att jämföra avtal med än ett snitt av börspriser.</p>
<p>Spotpriset spelar dessutom roll för statens stöd. Regeringens högkostnadsskydd för ${h.P.year} gäller om månadsmedelvärdet av spotpriset i ett elområde överstiger ${h.num(h.P.elstod.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh. Det är alltså ett snitt för hela månaden och elområdet, inte en enskild dyr kvart. Läs mer i ${h.a('elstod', 'elstöd')}.</p>
<h2>När spotpriset blir negativt</h2>
<p>Ibland blir spotpriset under noll några kvartar, när det finns mer el än någon vill använda. För ett hushåll med kvartsprisavtal sänker det totalpriset, men energiskatten och nätavgiften ligger kvar. Hur långt ned priset måste gå innan du får betalt för att använda el räknar vi på i guiden om ${h.a('negativa-elpriser', 'negativa elpriser')}.</p>
<h2>Spotpris, påslag och avtalstyper</h2>
<p>Hur mycket spotpriset påverkar din räkning beror på avtalet. Med ${h.a('kvartspris', 'kvartsprisavtal')} betalar du varje kvarts pris plus påslag. Med rörligt månadspris betalar du månadens viktade snitt plus påslag, och då spelar det ingen roll för fakturan när på dygnet du använder elen. Med fast pris påverkar spotpriset dig först när avtalet ska förnyas, eftersom elhandlarens erbjudande då bygger på vad marknaden väntar sig för de kommande åren. Elhandlarens påslag och avgifter förklaras i ${h.a('paslag', 'påslag och avgifter')}.</p>`;
    },
  },
  en: {
    slug: 'spot-price-explained',
    nav: 'Spot price',
    card: 'What the spot price is, when it is set and where to see it free.',
    title: 'Spot Price Electricity 2026: How It Is Set, Where to See It',
    description: 'Spot price of electricity in Sweden, 2026: set at the 12:00 day-ahead auction, one price per quarter hour since October 2025. What it means for your bill.',
    h1: 'The electricity spot price: what it is and how it becomes your price',
    intro: 'The spot price is the power exchange’s price for the next day. It drives variable contracts but is only part of what you pay.',
    resume: (h) => {
      const v = V(h);
      const r = v.rader[2];
      return `The spot price (spotpris) is the price set on the power exchange’s day-ahead market, where buy and sell bids for every quarter hour of the next day are matched in an auction at ${v.m.auktion_kl} the day before delivery. Since 1 October 2025 each day has 96 quarter-hour prices instead of 24 hourly ones, and the price is the same across the whole bidding zone. The spot price is quoted before VAT, energy tax and grid fee. So 100 öre on the exchange board is not 100 öre on your bill: with energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, a 25 öre transfer fee and 25% VAT it becomes ${h.ore(r.d.total)}. This site does not show today’s spot price, because it may not be freely republished. You can see it free in your retailer’s app or on the ENTSO-E transparency platform, then type it, or paste the whole day, into our calculator.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Why does Elpriskollen not show today’s spot price?', a: 'Day-ahead prices belong to the power exchange. ENTSO-E publishes them on its transparency platform, but its free re-use terms cover a listed set of data that does not include day-ahead prices, and the exchange sells licences to display them. So we republish no spot prices and show what they mean for your bill instead.' },
        { q: 'Where can I see the spot price for free?', a: 'In your retailer’s app or customer pages, which usually show your zone’s price per quarter hour or hour, and on the ENTSO-E transparency platform, where you choose day-ahead prices and zone SE1, SE2, SE3 or SE4. Copy the list and paste it into the calculator to get the all-in price.' },
        { q: 'Is the spot price the same as my variable price?', a: `No. A variable monthly price is an average of the month’s spot prices, weighted by how customers in the zone use power, plus the retailer’s mark-up. Statistics Sweden’s latest average for a variable contract for a house without electric heating in SE3 was ${h.ore(v.scb)} before VAT, mark-up included. A quarter-hour contract follows each quarter’s spot price instead.` },
        { q: 'Can the spot price change after the auction?', a: `No, the day-ahead price for a quarter hour does not change after the ${v.m.auktion_kl} auction. Prices on the intraday market, where power is traded closer to delivery, can move, but household contracts are based on the day-ahead price. On a quarter-hour contract you therefore know tomorrow’s prices by the afternoon.` },
        { q: 'Why do spot prices differ between Swedish zones?', a: 'Svenska kraftnät explains that the zones exist so power can be moved from north to south without disturbances, with borders where the grid has bottlenecks. Within one zone the price is always the same. When the lines between zones are big enough, prices match; when they are not, prices diverge.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rader.map((x) => [`${h.num(x.s)} öre`, h.ore(x.d.spot * v.mo), h.ore((x.d.natOverforing + x.d.energiskatt) * v.mo), h.ore(x.d.total)]);
      return `<h2>How the auction works</h2>
<p>Svenska kraftnät describes the day-ahead market like this: buyers and sellers state how much power they want to buy or sell for each quarter hour between 00:00 and 24:00 of the next day, and at what price. At ${v.m.auktion_kl} the day before, all bids are matched in a joint auction. For each quarter hour and each bidding zone the result is a price and a volume, and that price then applies to everyone who traded in that zone for that quarter.</p>
<p>The switch to quarter hours happened across the Nordic region at once. Energimarknadsbyrån wrote on 1 October 2025 that the price is now updated four times an hour instead of once, and Svenska kraftnät that 15-minute resolution now applies on both the day-ahead and intraday markets. For you that means 96 prices a day, or 92 or 100 on the days the clocks change.</p>
<h2>From exchange price to all-in price</h2>
${h.table(['Spot price', 'Spot with VAT', 'Grid and tax with VAT', 'All-in per kWh'], rows, `Example with a 25 öre transfer fee before VAT and energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}. Mark-up not included.`, ['l', 'r', 'r', 'r'])}
<p>The table shows why a zero spot price does not mean free electricity. The grid transfer fee and energy tax are fixed per kWh, and VAT goes on them too. When the spot price doubles from 100 to 200 öre, the all-in price rises by 125 öre but does not double. The calculator does the same sum with your real grid and mark-up.</p>
<h2>Why this site does not republish the spot price</h2>
<p>Day-ahead prices are computed by the power exchanges, which own the result. ENTSO-E, the association of European transmission operators, shows the prices on its ${h.src('entsoe', 'transparency platform')}, but its free re-use terms apply to a listed set of data. Day-ahead prices are not on that list, so displaying them publicly needs the exchange’s permission. Several price sites show them anyway without stating any licence. We choose not to.</p>
<p>That is also why our historical figures come from Statistics Sweden rather than the exchange. Statistics Sweden publishes what retailers actually billed households each month under a CC0 licence; those statistics pre-fill the calculator and appear on ${h.a('elpriser-per-manad', 'electricity prices by month')}.</p>
<h2>Using the spot price in the calculator</h2>
<ol>
<li>Open your retailer’s app or the ENTSO-E platform and choose your bidding zone. If you are not sure which one, see ${h.a('elomraden', 'bidding zones')}.</li>
<li>Type the price for the quarter hour you care about, in öre per kWh before VAT. If the app shows it with VAT, divide by 1.25 first.</li>
<li>To see the whole day, copy all the prices and paste them into the box under the calculator. Öre, kronor and euros per megawatt-hour are recognised.</li>
<li>Choose your grid area and main fuse. The all-in price, the day’s lowest and highest price and the cheapest window appear at once.</li>
</ol>
<p>Tomorrow’s prices work the same way; see ${h.a('elpris-imorgon', 'electricity price tomorrow')}.</p>
<h2>Daily averages, monthly averages and what the app shows</h2>
<p>Many apps show a single number for the day. That is usually a simple average of the 96 quarters, where a quarter at three in the morning weighs as much as one at six in the evening. A variable monthly price, however, is weighted by when customers in the zone actually use power. If much power is used in the expensive quarters, say on a cold winter evening, the weighted price ends up above the app’s simple average, and the reverse when use falls in cheap quarters. That is also why Statistics Sweden’s monthly figures, based on what was billed, are better for comparing contracts.</p>
<p>The spot price also matters for state support. The government’s high-cost protection for ${h.P.year} applies if the monthly average spot price in a zone exceeds ${h.num(h.P.elstod.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh: a whole-month, whole-zone average, not a single expensive quarter. More in ${h.a('elstod', 'electricity support')}.</p>
<h2>When the spot price goes negative</h2>
<p>Sometimes the spot price drops below zero for a few quarters, when there is more power than anyone wants to use. On a quarter-hour contract that lowers your all-in price, but energy tax and grid fee remain. How far the price must fall before you are paid to use power is worked out in the guide to ${h.a('negativa-elpriser', 'negative electricity prices')}.</p>
<h2>Spot price, mark-up and contract types</h2>
<p>How much the spot price moves your bill depends on the contract. On a ${h.a('kvartspris', 'quarter-hour contract')} you pay each quarter’s price plus mark-up. On a variable monthly price you pay the month’s weighted average plus mark-up, so the time of day you use power does not affect the bill. On a fixed price the spot price only reaches you when the contract is renewed. The retailer’s mark-up and fees are explained in ${h.a('paslag', 'mark-up and fees')}.</p>`;
    },
  },
});
