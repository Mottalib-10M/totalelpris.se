import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Negativa elpriser : ce qu'un spot négatif change sur la facture (formule du site, taxes et réseau inchangés). Aucune statistique de marché. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const tot = (spot: number, nat: number, skatt = P.skatt.energiskatt_ore) => M.totalpris({ spot, natOverforing: nat, energiskatt: skatt, momsSats: P.skatt.moms }).total;
  const rL = M.rangordna('L16');
  const natMin = Math.min(...rL.map((x) => x.t.rorligOre)), natMed = M.median(rL.map((x) => x.t.rorligOre));
  const natMax = Math.max(...rL.map((x) => x.t.rorligOre));
  return { mo, tot, natMin, natMed, natMax, skatt: P.skatt.energiskatt_ore, sankt: P.skatt.energiskatt_sankt_ore };
};

export default defineGuide({
  id: 'negativa-elpriser',
  group: 'guide',
  order: 70,
  mini: 'negativaPriser',
  related: ['spotpris', 'kvartspris', 'energiskatt', 'salja-solel', 'billigaste-tiden'],
  sources: ['svkDagenFore', 'skvEl', 'lse', 'eiNat', 'embKvart'],
  sv: {
    slug: 'negativa-elpriser',
    nav: 'Negativa elpriser',
    card: 'Vad ett spotpris under noll betyder för din faktura.',
    title: 'Negativa elpriser 2026: därför blir din el sällan gratis',
    description: 'Negativa elpriser 2026: när spotpriset går under noll ligger energiskatten 36 öre och nätavgiften kvar. Så långt måste priset falla innan du får betalt.',
    h1: 'Negativa elpriser: vad ett pris under noll betyder för dig',
    intro: 'Ett negativt spotpris låter som gratis el. För ett hushåll är det sällan så, och här är skälet.',
    resume: (h) => {
      const v = V(h);
      return `Ett negativt elpris betyder att spotpriset för en kvart har satts under noll vid auktionen på dagen före-marknaden. För ett hushåll med kvartsprisavtal sänker det priset för den kvarten, men elen blir sällan gratis. Energiskatten på ${h.ore(v.skatt)} exklusive moms och nätets överföringsavgift tas ut per kWh oavsett spotpriset, och momsen på 25 procent läggs på summan. Med en överföringsavgift på 25 öre måste spotpriset alltså gå under minus ${h.num(v.skatt + 25, 1)} öre innan totalpriset blir negativt. Med ett spotpris på minus 10 öre betalar du fortfarande ${h.ore(v.tot(-10, 25))} per kWh. I kommunerna med sänkt energiskatt i norr ligger gränsen lägre, eftersom skatten är ${h.ore(v.sankt)}. Med rörligt månadspris eller fast pris märks en negativ kvart bara som ett lägre månadssnitt, eller inte alls. Räkna på din egen nätavgift i mini-kalkylatorn.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Får jag betalt för att använda el när priset är negativt?', a: `Bara om totalpriset blir negativt, och det kräver att spotpriset är lägre än minus summan av energiskatt, nätavgift och påslag. Med energiskatten ${h.ore(v.skatt)} och en överföringsavgift på 25 öre betyder det under minus ${h.num(v.skatt + 25, 1)} öre exklusive moms. Hur din elhandlare hanterar negativa priser står i avtalsvillkoren.` },
        { q: 'Gäller sänkt energiskatt i norr även när priset är negativt?', a: `Ja. Avdraget på ${h.ore(h.P.skatt.norrlandsavdrag_ore)} gäller varje förbrukad kWh i de kommuner som räknas upp i lagen, oavsett spotpris. Där är skatten ${h.ore(v.sankt)} exklusive moms, och gränsen för när totalpriset blir negativt ligger därför ${h.ore(h.P.skatt.norrlandsavdrag_ore)} närmare noll än i resten av landet, med samma nätavgift.` },
        { q: 'Betalar man moms när spotpriset är negativt?', a: 'Momsen räknas på summan av spotpris, påslag, nätavgift och energiskatt. Så länge summan är positiv betalar du moms på den. Är spotpriset negativt blir summan och därmed momsen lägre. Kalkylatorn räknar på samma sätt: allt exklusive moms läggs ihop och sedan läggs 25 procent på.' },
        { q: 'Märks negativa priser om jag har rörligt avtal?', a: 'Bara indirekt. Med rörligt månadspris betalar du ett snitt av månadens priser viktat efter hur kunderna i elområdet använder el. Några negativa kvartar drar ned snittet något, men du får inte deras pris just när du använder elen. Med fast pris påverkar de inte din faktura.' },
        { q: 'Kan nätavgiften också bli negativ?', a: 'Nej. Nätföretagets överföringsavgift och fasta avgift följer nätföretagets prislista och påverkas inte av spotpriset. Energiskatten är också fast per kWh. Det är bara elhandelns del, spotpriset, som kan gå under noll, och därför blir totalpriset för ett hushåll nästan alltid positivt.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [0, -10, -30, -60, -100].map((s) => [`${h.num(s)} öre`, h.ore(v.tot(s, 25)), h.ore(v.tot(s, 25, v.sankt))]);
      return `<h2>Totalpriset vid olika negativa spotpriser</h2>
${h.table(['Spotpris', 'Normal energiskatt', 'Sänkt energiskatt (norr)'], rader, `Överföringsavgift 25 öre exkl. moms, inget påslag, moms 25 %. Energiskatt ${h.ore(v.skatt)} respektive ${h.ore(v.sankt)}. Spotpriserna är exempel.`, ['l', 'r', 'r'])}
<p>Tabellen visar att totalpriset sjunker i samma takt som spotpriset, men från en hög nivå. Först när spotpriset är mer negativt än skatt och nät tillsammans blir totalen under noll. I Energimarknadsinspektionens sammanställning för ${h.P.year} är medianen för överföringsavgiften i lägenhetsfallet ${h.ore(v.natMed)} och den lägsta ${h.ore(v.natMin)}, exklusive moms. Även med det billigaste nätet krävs alltså ett kraftigt negativt spotpris.</p>
<h2>Gränsen för gratis el i olika nät</h2>
${h.table(['Nät (lägenhet 16 A)', 'Överföring exkl. moms', 'Spotpris där totalen blir noll, utan påslag', 'Med 5 öre påslag'], [['Lägsta i landet', h.ore(v.natMin), h.ore(-(v.natMin + v.skatt)), h.ore(-(v.natMin + v.skatt + 5))], ['Median', h.ore(v.natMed), h.ore(-(v.natMed + v.skatt)), h.ore(-(v.natMed + v.skatt + 5))], ['Högsta i landet', h.ore(v.natMax), h.ore(-(v.natMax + v.skatt)), h.ore(-(v.natMax + v.skatt + 5))]], `Energimarknadsinspektionen ${h.P.year}, snittpris per kWh i lägenhetsfallet. Normal energiskatt ${h.ore(v.skatt)}.`, ['l', 'r', 'r', 'r'])}
<p>Gränsen beror alltså mest på nätet. I det nät som har lägst överföringsavgift räcker ett lägre minuspris, i det dyraste krävs ett mycket kraftigt negativt pris. Påslaget flyttar gränsen ytterligare några öre. Har du ett nät med olika pris för höglast och låglast, räkna med det pris som gäller den tid då spotpriset är negativt; vilket som gäller när står i nätets prislista.</p>
<h2>Ett räkneexempel med ett påhittat dygn</h2>
<p>Anta att morgondagens lista har fyra kvartar med spotpris minus 5 öre mitt på dagen och att resten av dygnet ligger på 40 öre eller mer. Priserna är exempel, inte marknadspriser. Du har kvartsprisavtal, ett nät med 25 öre i överföringsavgift och ingen sänkt skatt. Under de negativa kvartarna kostar elen dig ${h.ore(v.tot(-5, 25))} per kWh, mot ${h.ore(v.tot(40, 25))} vid 40 öre. En timmes torkning på 3 kWh blir ${h.kr((3 * (v.tot(40, 25) - v.tot(-5, 25))) / 100, 2)} billigare. Det är en verklig besparing, men den kommer från att kvarten är billig, inte från att elen är gratis. Klistrar du in den verkliga listan i kalkylatorn ser du direkt hur stor skillnaden blir med ditt eget nät och ditt påslag.</p>
<h2>Varför priset kan bli negativt</h2>
<p>Spotpriset sätts vid auktionen när köp- och säljbud för varje kvart matchas, som Svenska kraftnät beskriver dagen före-marknaden. Om säljarna under en kvart hellre betalar för att bli av med elen än stänger av sin produktion, och efterfrågan är låg, kan det pris där buden möts hamna under noll. Vi visar inga spotpriser och för ingen statistik över hur ofta det händer, eftersom vi inte har någon fri officiell källa för det.</p>
<h2>Vad du kan göra en negativ kvart</h2>
<p>Har du ${h.a('kvartspris', 'kvartsprisavtal')} är en negativ kvart helt enkelt en mycket billig kvart. Det är ett bra tillfälle att ladda elbilen, köra torktumlaren eller värma varmvattnet, om du ändå behöver göra det. Det är däremot sällan värt att använda el bara för att priset är negativt, eftersom du i de flesta fall ändå betalar skatt och nät. Klistra in dygnets priser i kalkylatorn så ser du totalpriset för varje kvart, med ditt nät och din skatt, och var den billigaste perioden börjar.</p>
<h2>Negativa kvartar och effektavgift</h2>
<p>Det är frestande att samla allt man kan under några negativa kvartar: ladda bilen, torka tvätt och värma varmvatten på en gång. Har ditt nät en ${h.a('effektavgift', 'effektavgift')} kan det ändå bli dyrt, eftersom den högsta effekten under månaden kostar ett fast belopp per kilowatt. Den besparing du gör på några billiga kvartar kan då ätas upp av en högre effekttopp. Fördela därför lasterna över de billiga kvartarna i stället för att starta allt samtidigt, och räkna på båda delarna innan du bestämmer dig.</p>
<h2>Negativa priser och solceller</h2>
<p>För den som har solceller och säljer överskott är ett negativt spotpris det motsatta: ersättningen för såld el kan bli låg eller noll. Sedan den 1 januari 2026 finns inte heller skattereduktionen för mikroproduktion kvar. Det gör det mer intressant att använda den egna solelen själv, eftersom varje kilowattimme du slipper köpa är värd hela totalpriset med skatt och nät, medan en såld kilowattimme bara ger det köparen betalar. Läs mer i ${h.a('salja-solel', 'sälja solel')}.</p>
<h2>Så räknar kalkylatorn med negativa priser</h2>
<p>Kalkylatorn tar emot negativa tal i fältet för spotpris och i listan du klistrar in. Ett minustecken framför talet räcker. Den lägger ihop spotpris, påslag, överföringsavgift och energiskatt och lägger på moms, precis som när priset är positivt. Lägsta och högsta pris räknas ur samma lista, så en negativ kvart visas alltid som dygnets lägsta. Läs mer om hur priset sätts i ${h.a('spotpris', 'spotpris')} och om skatten i ${h.a('energiskatt', 'energiskatt på el')}.</p>`;
    },
  },
  en: {
    slug: 'negative-electricity-prices',
    nav: 'Negative prices',
    card: 'What a spot price below zero means for your bill.',
    title: 'Negative Electricity Prices 2026: Why Power Is Rarely Free',
    description: 'Negative electricity prices in Sweden, 2026: when the spot price drops below zero, the 36 öre energy tax and grid fee remain. How far it must fall to get paid.',
    h1: 'Negative electricity prices: what a price below zero means for you',
    intro: 'A negative spot price sounds like free electricity. For a household it rarely is, and here is why.',
    resume: (h) => {
      const v = V(h);
      return `A negative electricity price means the spot price for a quarter hour was set below zero in the day-ahead auction. For a household on a quarter-hour contract it lowers the price of that quarter, but power is rarely free. Energy tax of ${h.ore(v.skatt)} before VAT and the grid transfer fee are charged per kWh whatever the spot price, and 25% VAT goes on the sum. With a 25 öre transfer fee, the spot price must therefore drop below minus ${h.num(v.skatt + 25, 1)} öre before the all-in price turns negative. At a spot price of minus 10 öre you still pay ${h.ore(v.tot(-10, 25))} per kWh. In the northern municipalities with reduced energy tax the threshold is lower, since the tax is ${h.ore(v.sankt)}. On a variable monthly or fixed price, a negative quarter only shows as a slightly lower monthly average, or not at all. Try your own grid fee in the mini-calculator.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Do I get paid to use power when the price is negative?', a: `Only if the all-in price turns negative, which requires the spot price to be below minus the sum of energy tax, grid fee and mark-up. With energy tax of ${h.ore(v.skatt)} and a 25 öre transfer fee, that means below minus ${h.num(v.skatt + 25, 1)} öre before VAT. How your retailer handles negative prices is in its contract terms.` },
        { q: 'Does the northern tax reduction still apply at negative prices?', a: `Yes. The ${h.ore(h.P.skatt.norrlandsavdrag_ore)} deduction applies to every kWh used in the municipalities listed in the Act, whatever the spot price. There the tax is ${h.ore(v.sankt)} before VAT, so the point where the all-in price turns negative sits ${h.ore(h.P.skatt.norrlandsavdrag_ore)} closer to zero than elsewhere on the same grid fee.` },
        { q: 'Is VAT charged when the spot price is negative?', a: 'VAT is calculated on the sum of spot price, mark-up, grid fee and energy tax. As long as that sum is positive you pay VAT on it; a negative spot price lowers the sum and so the VAT. The calculator works the same way: everything before VAT is added up and then 25% goes on top.' },
        { q: 'Do negative prices show on a variable contract?', a: 'Only indirectly. On a variable monthly price you pay an average of the month’s prices weighted by how customers in the zone use power. A few negative quarters pull the average down a little, but you do not get their price at the moment you use power. On a fixed price they do not affect your bill.' },
        { q: 'Can the grid fee turn negative too?', a: 'No. The grid company’s transfer fee and fixed fee follow its price list and are unaffected by the spot price, and energy tax is fixed per kWh as well. Only the retail part, the spot price, can drop below zero, which is why a household’s all-in price almost always stays positive.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [0, -10, -30, -60, -100].map((s) => [`${h.num(s)} öre`, h.ore(v.tot(s, 25)), h.ore(v.tot(s, 25, v.sankt))]);
      return `<h2>The all-in price at different negative spot prices</h2>
${h.table(['Spot price', 'Standard energy tax', 'Reduced energy tax (north)'], rader, `Transfer fee 25 öre before VAT, no mark-up, 25% VAT. Energy tax ${h.ore(v.skatt)} and ${h.ore(v.sankt)} respectively. Spot prices are examples.`, ['l', 'r', 'r'])}
<p>The table shows the all-in price falling in step with the spot price, but from a high level. Only when the spot price is more negative than tax and grid combined does the total drop below zero. In the Energy Markets Inspectorate’s ${h.P.year} data, the median transfer fee in the flat case is ${h.ore(v.natMed)} and the lowest ${h.ore(v.natMin)}, before VAT. Even on the cheapest grid a steeply negative spot price is needed.</p>
<h2>The free-power threshold on different grids</h2>
${h.table(['Grid (16 A flat)', 'Transfer before VAT', 'Spot where total hits zero, no mark-up', 'With 5 öre mark-up'], [['Lowest in Sweden', h.ore(v.natMin), h.ore(-(v.natMin + v.skatt)), h.ore(-(v.natMin + v.skatt + 5))], ['Median', h.ore(v.natMed), h.ore(-(v.natMed + v.skatt)), h.ore(-(v.natMed + v.skatt + 5))], ['Highest in Sweden', h.ore(v.natMax), h.ore(-(v.natMax + v.skatt)), h.ore(-(v.natMax + v.skatt + 5))]], `Energy Markets Inspectorate ${h.P.year}, average per kWh in the flat case. Standard energy tax ${h.ore(v.skatt)}.`, ['l', 'r', 'r', 'r'])}
<p>The threshold depends mostly on the grid. On the grid with the lowest transfer fee a smaller negative price suffices; on the dearest a very steep one is needed. The mark-up moves the line a few öre further. If your grid has peak and off-peak rates, which one applies when is in its price list.</p>
<h2>A worked example with an invented day</h2>
<p>Suppose tomorrow’s list has four quarters at minus 5 öre around midday and the rest of the day at 40 öre or more. The prices are examples, not market prices. You are on a quarter-hour contract, a grid with a 25 öre transfer fee and no reduced tax. During the negative quarters power costs you ${h.ore(v.tot(-5, 25))} per kWh, against ${h.ore(v.tot(40, 25))} at 40 öre. An hour of drying at 3 kWh comes out ${h.kr((3 * (v.tot(40, 25) - v.tot(-5, 25))) / 100, 2)} cheaper. A real saving, but it comes from the quarter being cheap, not from power being free.</p>
<h2>Why the price can go negative</h2>
<p>The spot price is set in the auction where buy and sell bids for each quarter are matched, as Svenska kraftnät describes the day-ahead market. If, for a quarter, sellers would rather pay to offload power than switch off production, and demand is low, the price where bids meet can fall below zero. We show no spot prices and publish no statistics on how often it happens, because we have no free official source for that.</p>
<h2>What to do in a negative quarter</h2>
<p>On a ${h.a('kvartspris', 'quarter-hour contract')} a negative quarter is simply a very cheap quarter: a good moment to charge the car, run the dryer or heat water if you need to anyway. It is rarely worth using power just because the price is negative, since in most cases you still pay tax and grid. Paste the day’s prices into the calculator to see the all-in price of every quarter on your grid and with your tax, and where the cheapest window starts.</p>
<h2>Negative quarters and power charges</h2>
<p>It is tempting to pile everything into a few negative quarters: charge the car, dry laundry and heat water at once. If your grid has a ${h.a('effektavgift', 'power charge')}, that can still cost you, because the month’s highest load is billed per kilowatt. The saving on a few cheap quarters can be eaten by a higher peak, so spread the loads over the cheap quarters rather than starting everything together.</p>
<h2>Negative prices and solar panels</h2>
<p>For anyone with solar panels selling surplus, a negative spot price is the reverse: payment for power sold can be low or zero. Since 1 January 2026 the tax reduction for micro-production no longer exists either, which makes using your own solar power more attractive. More in ${h.a('salja-solel', 'selling solar power')}.</p>
<h2>How the calculator handles negative prices</h2>
<p>The calculator accepts negative numbers in the spot-price field and in the pasted list; a minus sign in front of the number is enough. It adds spot price, mark-up, transfer fee and energy tax and then applies VAT, exactly as when the price is positive. Lowest and highest come from the same list, so a negative quarter always shows as the day’s lowest. More on how the price is set in ${h.a('spotpris', 'spot price')} and on the tax in ${h.a('energiskatt', 'energy tax on electricity')}.</p>`;
    },
  },
});
