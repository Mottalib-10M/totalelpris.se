import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Kvartspris : contrats au quart d'heure, comparaison avec rörligt et fast, qui gagne à déplacer sa consommation. */
const V = (h: Helpers) => {
  const { P } = h;
  const mo = 1 + P.skatt.moms;
  const a = P.apparater;
  const flytt = (kwh: number, diff: number) => (kwh * diff * mo) / 100;
  return { mo, a, flytt, kvartFran: P.marknad.kvart_fran };
};

export default defineGuide({
  id: 'kvartspris',
  group: 'guide',
  order: 40,
  mini: 'kvartspris',
  related: ['billigaste-tiden', 'fast-eller-rorligt', 'spotpris', 'ladda-elbil', 'elpris-imorgon'],
  sources: ['embKvart', 'embKvartNyhet', 'svkKvart', 'svkDagenFore'],
  sv: {
    slug: 'kvartspris',
    nav: 'Kvartspris',
    card: 'Kvartsprisavtal mot rörligt och fast: när det lönar sig att flytta förbrukning.',
    title: 'Kvartspris el 2026: 96 priser per dygn och när det lönar sig',
    description: 'Kvartspris på el 2026: sedan 1 oktober 2025 sätts elpriset per kvart, 96 priser per dygn. Vad ett kvartsprisavtal innebär och när det lönar sig att flytta elen.',
    h1: 'Kvartspris på el: vad det betyder och vem som tjänar på det',
    intro: 'Elpriset sätts per kvart sedan oktober 2025. Det märks bara om ditt avtal följer kvartarna.',
    resume: (h) => {
      const v = V(h);
      return `Sedan den 1 oktober 2025 sätts elpriset på dagen före-marknaden för varje kvart i stället för varje timme, vilket ger 96 priser per dygn. Ett kvartsprisavtal, som ersatte det gamla timprisavtalet, innebär enligt Energimarknadsbyrån att du betalar spotpriset för den el du använder under varje kvart, plus elhandlarens påslag och moms. Med fast eller rörligt elprisavtal märks övergången inte alls. Kvartspriset lönar sig för den som kan flytta förbrukning till billiga perioder: laddning av elbil, torktumlare, diskmaskin och varmvattenberedare. En skillnad på 100 öre i spotpris mellan en dyr och en billig kvart blir 125 öre med moms, medan energiskatten och nätets överföringsavgift är desamma. Att flytta 10 kWh i veckan på det sättet sparar ${h.kr(v.flytt(10 * 52, 100))} om året. Räkna på dina egna priser med kalkylatorn.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Blev mitt timprisavtal ett kvartsprisavtal?', a: 'Enligt Energimarknadsbyrån kunde timprisavtal gå över till kvartsprisavtal den 1 oktober 2025, när elbörserna i Norden började handla el i 15-minutersintervaller. Hur just ditt avtal hanteras står i avtalsvillkoren eller hos din elhandlare. Har du fast eller rörligt månadspris ändrades ingenting för dig.' },
        { q: 'Behöver jag en ny elmätare för kvartspris?', a: 'Det är elnätsföretaget som sköter elmätaren och rapporterar mätvärdena till elhandlaren. Fråga därför ditt nätföretag hur din förbrukning mäts och rapporteras innan du byter till kvartspris, och fråga elhandlaren om avtalet går att teckna för just din anläggning. Själva bytet av avtal gör du hos elhandlaren.' },
        { q: 'Hur mycket sparar man med kvartspris jämfört med rörligt?', a: `Det beror helt på hur mycket förbrukning du kan flytta och hur stora skillnaderna är mellan kvartarna. Flyttar du en laddning på 30 kWh från en kvart med 150 öre till en med 30 öre spotpris sparar du ${h.kr(v.flytt(30, 120))} med moms. Utan flyttad förbrukning blir resultatet ungefär som rörligt pris.` },
        { q: 'Kan kvartspris bli dyrare än rörligt pris?', a: 'Ja, om du använder mycket el när priset är högt, till exempel värme en kall vinterkväll som inte går att flytta. Rörligt månadspris är ett snitt viktat efter alla kunders förbrukning i elområdet. Den som använder mer än snittet under dyra kvartar betalar då mer med kvartspris än med rörligt.' },
        { q: 'Hur vet jag vilka kvartar som blir billiga imorgon?', a: 'Priserna för hela nästa dygn bestäms vid auktionen klockan tolv dagen före och publiceras under eftermiddagen. Hämta dem i elhandlarens app, klistra in listan i vår kalkylator för morgondagen och välj hur länge apparaten ska gå. Kalkylatorn visar då när den billigaste sammanhängande perioden börjar.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [
        [v.a.tvattmaskin.namn_sv, h.num(v.a.tvattmaskin.kwh), h.kr(v.flytt(v.a.tvattmaskin.kwh, 100), 2), h.kr(v.flytt(v.a.tvattmaskin.kwh * v.a.tvattmaskin.ggr_vecka * 52, 100))],
        [v.a.torktumlare.namn_sv, h.num(v.a.torktumlare.kwh), h.kr(v.flytt(v.a.torktumlare.kwh, 100), 2), h.kr(v.flytt(v.a.torktumlare.kwh * v.a.torktumlare.ggr_vecka * 52, 100))],
        [v.a.diskmaskin.namn_sv, h.num(v.a.diskmaskin.kwh), h.kr(v.flytt(v.a.diskmaskin.kwh, 100), 2), h.kr(v.flytt(v.a.diskmaskin.kwh * v.a.diskmaskin.ggr_vecka * 52, 100))],
        ['Elbil, 30 kWh', h.num(30), h.kr(v.flytt(30, 100), 2), h.kr(v.flytt(30 * 3 * 52, 100))],
      ];
      return `<h2>Från timpris till kvartspris</h2>
<p>Den 1 oktober 2025 gick elbörserna i Norden över till att handla el i 15-minutersintervaller. Energimarknadsbyrån beskrev det som att elpriset nu uppdateras fyra gånger per timme i stället för en gång, och Svenska kraftnät att 15 minuters tidsupplösning är införd på både dagen före-marknaden och intradagmarknaden. Även balanseringen av elsystemet sker varje kvart. Auktionen för nästa dygn hålls fortfarande klockan ${h.P.marknad.auktion_kl} dagen före.</p>
<p>För hushållen ändrade det ingenting som inte redan följde timpriset. Rörliga månadspriser räknas fortsatt som ett snitt för månaden, och fasta priser är fasta. Det är bara den som har eller tecknar ett kvartsprisavtal som betalar olika pris för olika kvartar.</p>
<h2>Tre avtalstyper sida vid sida</h2>
<ul>
<li><strong>Kvartsprisavtal</strong>: spotpriset för varje kvart, plus påslag och moms. Billigast för den som använder el när den är billig, dyrast för den som inte kan välja.</li>
<li><strong>Rörligt månadspris</strong>: månadens snitt, viktat efter hur alla kunder i elområdet använder el, plus påslag. När på dygnet du använder elen påverkar inte fakturan.</li>
<li><strong>Fast pris</strong>: samma pris per kWh under hela avtalstiden, ett, två eller tre år. SCB:s statistik över vad de har kostat finns i ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')}.</li>
</ul>
<h2>Vad det är värt att flytta en apparat</h2>
${h.table(['Apparat', 'kWh per gång', 'Per gång vid 100 öre skillnad', 'Per år'], rader, 'Energi enligt Energimyndigheten (övre värdet för ecoprogram), användning per vecka enligt kalkylatorns standardvärden, elbilen tre laddningar i veckan som exempel. Skillnad i spotpris 100 öre, moms 25 % inräknad.', ['l', 'r', 'r', 'r'])}
<p>Tvätt och disk ger små belopp per gång, eftersom ett ecoprogram enligt Energimyndigheten bara drar 0,5 till 1 kWh. Det som gör skillnad är stora och flyttbara laster: laddning av elbil, en varmvattenberedare med timer och en torktumlare. Uppvärmning går sällan att flytta mer än några timmar utan att det blir kallt.</p>
<h2>Ett räkneexempel: en vecka med elbil</h2>
<p>Anta att en familj laddar elbilen tre gånger i veckan med 30 kWh varje gång. Priserna nedan är exempel, inte marknadspriser: dygnets snitt är 90 öre, de dyraste kvällskvartarna ligger på 160 öre och de billigaste nattkvartarna på 40 öre, allt exklusive moms. Laddar familjen direkt när de kommer hem på kvällen betalar de för elen ${h.kr(v.flytt(90, 160))} i veckan, räknat på spotpriset med moms. Med timer till natten blir samma laddning ${h.kr(v.flytt(90, 40))}. Skillnaden är ${h.kr(v.flytt(90, 120))} i veckan, eller ${h.kr(v.flytt(90 * 52, 120))} om året om mönstret håller. Nätavgift och energiskatt är lika i båda fallen och påverkar inte jämförelsen.</p>
<p>Med rörligt månadspris hade familjen betalat samma sak oavsett när de laddade, ungefär månadens viktade snitt. Det är därför kvartspris är ett val för den som faktiskt tänker styra sin förbrukning, inte ett avtal som i sig är billigare. Räkna med dina egna priser i ${h.a('ladda-elbil', 'kalkylatorn för laddning')}.</p>
<h2>Var skillnaden mellan kvartarna inte hamnar</h2>
<p>Energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och nätets överföringsavgift tas ut per kWh oavsett tid, om inte ditt nätföretag har olika pris för höglast och låglast eller en ${h.a('effektavgift', 'effektavgift')}. Det betyder att en flyttad kWh bara sparar skillnaden i spotpris, med moms. Har nätet en effektavgift kan det däremot löna sig att sprida ut förbrukningen, så att den högsta timmen blir lägre; det är en annan sak än att jaga det billigaste spotpriset.</p>
<h2>Så hittar du de billiga kvartarna</h2>
<ol>
<li>Efter auktionen klockan ${h.P.marknad.auktion_kl} publiceras morgondagens priser. Hämta dem i din elhandlares app.</li>
<li>Klistra in dem i ${h.a('elpris-imorgon', 'kalkylatorn för morgondagen')} och välj hur länge apparaten ska gå.</li>
<li>Ställ in tvättmaskinens, diskmaskinens eller laddboxens timer på den starttid kalkylatorn föreslår.</li>
</ol>
<p>Mönstren för när elen brukar vara billig beskrivs i ${h.a('billigaste-tiden', 'billigaste tiden för el')}. Om spotpriset och varför vi inte visar det, se ${h.a('spotpris', 'spotpris')}.</p>
<h2>Vem bör välja kvartspris?</h2>
<p>Ett kvartsprisavtal passar den som har en stor last som kan vänta: en elbil som står hemma på natten, en varmvattenberedare, en pool eller en värmepump som kan styras. Den som bor i lägenhet med låg förbrukning och inga flyttbara laster har lite att vinna och kan förlora om förbrukningen råkar hamna på dyra kvartar. Ett rörligt månadspris är då enklare, och för den som vill veta beloppet i förväg finns fast pris.</p>
<p>Innan du byter: läs villkoren om uppsägningstid och eventuella avgifter, särskilt om du vill lämna ett fast pris i förtid. Det är ditt eget avtal som avgör vad bytet kostar, så fråga elhandlaren om något är oklart. Jämför också påslag och månadsavgift, eftersom de betalas oavsett hur väl du lyckas flytta förbrukningen.</p>`;
    },
  },
  en: {
    slug: 'quarter-hour-electricity-prices',
    nav: 'Quarter-hour prices',
    card: 'Quarter-hour contracts against variable and fixed: when shifting use pays.',
    title: 'Quarter-Hour Electricity Prices 2026: 96 a Day, When It Pays',
    description: 'Quarter-hour electricity prices in Sweden, 2026: priced per quarter hour since 1 October 2025, 96 a day. What the contract means and when shifting use pays.',
    h1: 'Quarter-hour electricity prices: what they mean and who gains',
    intro: 'Prices have been set per quarter hour since October 2025. You only notice if your contract follows the quarters.',
    resume: (h) => {
      const v = V(h);
      return `Since 1 October 2025 the Swedish day-ahead price has been set for each quarter hour instead of each hour, giving 96 prices a day. A quarter-hour contract (kvartsprisavtal), which replaced the old hourly contract, means according to Energimarknadsbyrån that you pay the spot price for the power used in each quarter, plus the retailer’s mark-up and VAT. On a fixed or variable contract the change went unnoticed. Quarter-hour pricing pays off for those who can move consumption into cheap periods: charging an electric car, the tumble dryer, the dishwasher, a water heater. A 100 öre spot gap between an expensive and a cheap quarter becomes 125 öre with VAT, while energy tax and the grid transfer fee stay the same. Moving 10 kWh a week that way saves ${h.kr(v.flytt(10 * 52, 100))} a year. Try your own prices in the calculator.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Did my hourly contract turn into a quarter-hour one?', a: 'According to Energimarknadsbyrån, hourly contracts could move to quarter-hour contracts on 1 October 2025, when the Nordic exchanges started trading in 15-minute intervals. How your own contract was handled is in its terms or can be confirmed by your retailer. On a fixed or variable monthly price nothing changed.' },
        { q: 'Do I need a new meter for quarter-hour pricing?', a: 'The grid company runs the meter and reports the readings to your retailer. So ask your grid company how your consumption is measured and reported before switching to quarter-hour pricing, and ask the retailer whether the contract is available for your connection. The switch itself is done with the retailer.' },
        { q: 'How much does a quarter-hour contract save over variable?', a: `It depends entirely on how much use you can move and how far apart the quarters are. Moving a 30 kWh car charge from a quarter at 150 öre to one at 30 öre spot saves ${h.kr(v.flytt(30, 120))} with VAT. With no use moved, the result is roughly that of a variable price.` },
        { q: 'Can a quarter-hour contract cost more than a variable one?', a: 'Yes, if you use a lot of power when prices are high, such as heating on a cold winter evening that cannot wait. A variable monthly price is an average weighted by all customers’ use in the zone, so anyone using more than average in expensive quarters pays more on quarter-hour pricing.' },
        { q: 'How do I know which quarters will be cheap tomorrow?', a: 'Prices for the whole next day are set at the noon auction the day before and published during the afternoon. Get them from your retailer’s app, paste the list into our calculator for tomorrow and choose how long the appliance will run. The calculator then shows when the cheapest continuous window starts.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [
        [v.a.tvattmaskin.namn_en, h.num(v.a.tvattmaskin.kwh), h.kr(v.flytt(v.a.tvattmaskin.kwh, 100), 2), h.kr(v.flytt(v.a.tvattmaskin.kwh * v.a.tvattmaskin.ggr_vecka * 52, 100))],
        [v.a.torktumlare.namn_en, h.num(v.a.torktumlare.kwh), h.kr(v.flytt(v.a.torktumlare.kwh, 100), 2), h.kr(v.flytt(v.a.torktumlare.kwh * v.a.torktumlare.ggr_vecka * 52, 100))],
        [v.a.diskmaskin.namn_en, h.num(v.a.diskmaskin.kwh), h.kr(v.flytt(v.a.diskmaskin.kwh, 100), 2), h.kr(v.flytt(v.a.diskmaskin.kwh * v.a.diskmaskin.ggr_vecka * 52, 100))],
        ['Electric car, 30 kWh', h.num(30), h.kr(v.flytt(30, 100), 2), h.kr(v.flytt(30 * 3 * 52, 100))],
      ];
      return `<h2>From hourly to quarter-hour prices</h2>
<p>On 1 October 2025 the Nordic power exchanges switched to trading in 15-minute intervals. Energimarknadsbyrån described it as the price now updating four times an hour instead of once, and Svenska kraftnät as 15-minute resolution introduced on both the day-ahead and intraday markets; balancing the power system also happens every quarter. The auction for the next day is still held at ${h.P.marknad.auktion_kl} the day before.</p>
<p>For households, nothing changed that did not already follow the hourly price. Variable monthly prices are still a monthly average and fixed prices stay fixed. Only those with, or signing, a quarter-hour contract pay different prices in different quarters.</p>
<h2>Three contract types side by side</h2>
<ul>
<li><strong>Quarter-hour contract</strong> (kvartsprisavtal): each quarter’s spot price, plus mark-up and VAT. Cheapest for those who use power when it is cheap, dearest for those who cannot choose.</li>
<li><strong>Variable monthly price</strong> (rörligt månadspris): the month’s average, weighted by all customers’ use in the zone, plus mark-up. When you use power during the day does not change the bill.</li>
<li><strong>Fixed price</strong> (fast pris): the same price per kWh for the contract term, one, two or three years. Statistics Sweden figures on what they cost are in ${h.a('fast-eller-rorligt', 'fixed or variable price')}.</li>
</ul>
<h2>What moving an appliance is worth</h2>
${h.table(['Appliance', 'kWh per use', 'Per use at a 100 öre gap', 'Per year'], rader, 'Energy per the Swedish Energy Agency (upper value for eco programmes), weekly use from the calculator defaults, the car three charges a week as an example. Spot gap 100 öre, 25% VAT included.', ['l', 'r', 'r', 'r'])}
<p>Washing and dishes give small sums per use, because an eco programme draws only 0.5 to 1 kWh according to the Swedish Energy Agency. What makes a difference are large loads that can move: car charging, a water heater on a timer, a tumble dryer. Heating can rarely be shifted more than a few hours before the house cools.</p>
<h2>A worked example: one week with an electric car</h2>
<p>Suppose a family charges its car three times a week, 30 kWh each time. The prices below are examples, not market prices: the daily average is 90 öre, the dearest evening quarters 160 öre and the cheapest night quarters 40 öre, all before VAT. Charging straight after getting home in the evening costs ${h.kr(v.flytt(90, 160))} a week for the energy, on the spot price with VAT. With a timer set for the night, the same charging costs ${h.kr(v.flytt(90, 40))}. The difference is ${h.kr(v.flytt(90, 120))} a week, or ${h.kr(v.flytt(90 * 52, 120))} a year if the pattern holds. Grid fee and energy tax are the same either way and do not affect the comparison.</p>
<p>On a variable monthly price the family would have paid the same whenever it charged, roughly the month’s weighted average. That is why a quarter-hour contract is a choice for people who will actually steer their use, not a contract that is cheaper in itself. Try your own prices in the ${h.a('ladda-elbil', 'car charging calculator')}.</p>
<h2>Where the gap between quarters does not land</h2>
<p>Energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and the grid transfer fee are charged per kWh whatever the time, unless your grid company has peak and off-peak rates or a ${h.a('effektavgift', 'power charge')}. So a moved kWh saves only the spot gap, with VAT. If your grid has a power charge, spreading use out to lower your highest hour can pay as well; that is a different thing from chasing the cheapest spot price.</p>
<h2>Finding the cheap quarters</h2>
<ol>
<li>After the ${h.P.marknad.auktion_kl} auction, tomorrow’s prices are published. Get them from your retailer’s app.</li>
<li>Paste them into the ${h.a('elpris-imorgon', 'calculator for tomorrow')} and choose how long the appliance will run.</li>
<li>Set the timer on the washing machine, dishwasher or wallbox to the start time the calculator suggests.</li>
</ol>
<p>Patterns of when power tends to be cheap are covered in ${h.a('billigaste-tiden', 'the cheapest time for electricity')}. On the spot price and why we do not show it, see ${h.a('spotpris', 'spot price')}.</p>
<h2>Who should choose quarter-hour pricing?</h2>
<p>A quarter-hour contract suits households with a large load that can wait: an electric car parked at home overnight, a water heater, a pool or a heat pump that can be controlled. Someone in a low-use flat with nothing to shift has little to gain and may lose if use happens to fall in expensive quarters. A variable monthly price is simpler then, and a fixed price suits those who want to know the amount in advance.</p>`;
    },
  },
});
