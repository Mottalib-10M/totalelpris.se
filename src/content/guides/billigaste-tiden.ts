import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Billigaste tiden : méthode de la fenêtre glissante sur la liste collée ; aucune affirmation sur des profils de prix typiques. */
const V = (h: Helpers) => {
  const { M, P } = h;
  // Liste d'exemple fictive (pas un prix de marché) pour illustrer la méthode : 24 heures.
  const ex = [62, 58, 55, 52, 50, 54, 80, 110, 125, 98, 70, 45, 30, 28, 35, 60, 95, 140, 150, 130, 105, 90, 78, 66];
  const st = M.statistik(ex);
  const w1 = M.billigasteFonster(ex, 60, 60), w3 = M.billigasteFonster(ex, 60, 180), w6 = M.billigasteFonster(ex, 60, 360);
  const mo = 1 + P.skatt.moms;
  return { ex, st, w1, w3, w6, mo, kl: M.klockslag };
};

export default defineGuide({
  id: 'billigaste-tiden',
  group: 'guide',
  order: 60,
  mini: 'billigasteTid',
  miniHref: 'elpris-imorgon',
  related: ['elpris-imorgon', 'kvartspris', 'ladda-elbil', 'kostnad-diskmaskin', 'effektavgift'],
  sources: ['embKvartNyhet', 'svkDagenFore', 'embKvart', 'entsoe'],
  sv: {
    slug: 'billigaste-tiden-for-el',
    nav: 'Billigaste tiden för el',
    card: 'Så hittar du dygnets billigaste period för disk, tvätt och laddning.',
    title: 'Billigaste tiden för el 2026: så hittar du dygnets lägsta',
    description: 'Billigaste tiden för el 2026: priset sätts per kvart, 96 gånger per dygn. Så hittar du den billigaste perioden för disk, tvätt och laddning och vad det är värt.',
    h1: 'Billigaste tiden för el: hitta dygnets billigaste period',
    intro: 'Det billigaste ögonblicket är inte alltid den billigaste perioden. Det beror på hur länge apparaten ska gå.',
    resume: (h) => {
      const v = V(h);
      return `Sedan den 1 oktober 2025 sätts elpriset för varje kvart, och dygnets 96 priser bestäms vid auktionen klockan ${h.P.marknad.auktion_kl} dagen före. Den billigaste tiden att köra en apparat är därför inte en fast klocktid som gäller varje dag, utan något du räknar ut på morgondagens lista. Det viktiga är att leta efter den billigaste sammanhängande perioden av samma längd som apparaten behöver, inte bara den billigaste kvarten. I ett påhittat exempel med 24 timpriser är den billigaste timmen klockan ${v.kl(v.w1.start, 60)}, men den billigaste perioden på sex timmar börjar klockan ${v.kl(v.w6.start, 60)}. Kalkylatorn gör samma sökning med de priser du klistrar in, och räknar om dem till totalpris med ditt nät och din skatt. Det lönar sig bara om du har kvartsprisavtal; med rörligt eller fast pris påverkar tiden inte fakturan.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Finns det en tid på dygnet då elen alltid är billigast?', a: 'Nej. Priserna sätts på nytt för varje dygn vid auktionen dagen före, utifrån utbud, efterfrågan och överföringen mellan elområdena. En tid som var billig i går kan vara dyr i morgon. Därför räknar vi på den lista som gäller för just det dygn du planerar, i stället för att ange en fast klocktid.' },
        { q: 'Varför är billigaste timmen inte samma som billigaste perioden?', a: `För att en apparat som går i flera timmar betalar för alla kvartar den går. I exemplet är timmen klockan ${v.kl(v.w1.start, 60)} billigast, men en period på sex timmar som börjar där skulle ta med dyrare timmar efteråt. Kalkylatorn jämför alla perioder av rätt längd och väljer den med lägst snitt.` },
        { q: 'Vilka apparater är värda att flytta?', a: 'De som drar mycket energi och kan vänta: laddning av elbil, torktumlare, diskmaskin och tvättmaskin med timer, och en varmvattenberedare som kan styras. Frysen och kylen går när termostaten vill, och matlagning sker när du äter. Ju fler kWh som flyttas, desto mer är det värt, och en laddning på flera tiotal kWh väger mer än en tvätt eller torkning på 1 till 3 kWh.' },
        { q: 'Hur klistrar jag in priserna rätt?', a: 'Kopiera listan från elhandlarens app eller ENTSO-E:s plattform, med ett pris per rad. Klockslag på samma rad gör inget, kalkylatorn tar talet efter tiden. Öre, kronor och euro per megawattimme känns igen; för euro anger du växelkursen. 24 priser tolkas som timmar och 96 som kvartar.' },
        { q: 'Hur ofta behöver jag räkna om billigaste tiden?', a: 'Varje dygn, eftersom priserna sätts på nytt vid varje auktion. Det tar en minut: hämta morgondagens lista på eftermiddagen, klistra in den och läs av starttiden för den apparat du vill köra. Har du flera apparater, räkna en i taget och sprid ut dem om ditt nät har effektavgift.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [[1, v.w1], [3, v.w3], [6, v.w6]].map(([n, w]) => { const x = w as { start: number; snitt: number }; return [`${n} ${n === 1 ? 'timme' : 'timmar'}`, v.kl(x.start, 60), h.ore(x.snitt), h.ore((x.snitt + 25 + h.P.skatt.energiskatt_ore) * v.mo)]; });
      return `<h2>Så fungerar sökningen efter billigaste perioden</h2>
<p>Tänk dig ett fönster som är lika långt som programmet. Kalkylatorn lägger det på dygnets första kvart, räknar snittpriset, flyttar fönstret en kvart fram och räknar igen, tills det har prövat alla lägen. Det läge som ger lägst snitt är den billigaste starttiden. Metoden tar hänsyn till att en lång laddning måste betala även för de dyrare kvartarna i början eller slutet.</p>
${h.table(['Längd', 'Billigast att starta', 'Snittpris i perioden', 'Totalpris inkl. moms'], rows, `Påhittade timpriser i öre/kWh exkl. moms, för att visa metoden; dygnets lägsta ${h.ore(v.st.min)}, högsta ${h.ore(v.st.max)}. Totalpris med 25 öre överföring och energiskatt.`, ['l', 'l', 'r', 'r'])}
<p>Exemplet visar hur valet ändras med längden, och varför det inte räcker att titta på dygnets lägsta pris i appen. För en kort disk passar den enskilt billigaste timmen. För en lång laddning är det en annan del av dygnet som ger lägst snitt, eftersom den billigaste timmen omges av dyra timmar.</p>
<h2>Kvartar, timmar och dygn med omställd klocka</h2>
<p>Klistrar du in 96 priser räknar kalkylatorn med kvartar, och klistrar du in 24 räknar den med timmar. Båda fungerar, men kvartarna ger en skarpare bild: en period kan börja och sluta mitt i en timme, och det billigaste fönstret för en disk på två och en halv timme hittas exaktare. De dygn då klockan ställs om till sommartid eller vintertid har dygnet 92 eller 100 kvartar. Kalkylatorn räknar då med det antal priser du klistrat in och visar klockslagen från midnatt, så kontrollera starttiden en extra gång just de dygnen.</p>
<p>Kalkylatorn visar också dygnets lägsta och högsta totalpris och vid vilken tid de inträffar. De räknas ur samma lista som fönstret, så de kan aldrig hamna i fel ordning.</p>
<p>Har du bara en del av dygnet, till exempel kvällens och nattens priser, går det också bra. Kalkylatorn letar då i den lista du gett den. Ett fönster kan inte vara längre än listan: vill du ladda i åtta timmar behöver listan täcka minst åtta timmar.</p>
<h2>Från starttid till timer</h2>
<p>Diskmaskiner, tvättmaskiner och laddboxar har ofta antingen en starttid eller en fördröjd start. Med starttid ställer du in klockslaget som kalkylatorn föreslår. Med fördröjd start räknar du antalet timmar från nu till det klockslaget. Tänk på att vissa maskiner anger när programmet ska vara klart, inte när det börjar; dra då av programmets längd. För elbilen kan laddningen ofta styras i bilens app eller i laddboxens app, och där anger du starttid eller sluttid.</p>
<h2>Var priserna kommer ifrån</h2>
<p>Morgondagens priser blir kända efter auktionen på dagen före-marknaden, som Svenska kraftnät beskriver: köp- och säljbud för varje kvart matchas klockan ${h.P.marknad.auktion_kl} dagen före. Den exakta tiden då listorna dyker upp i apparna varierar, så räkna med eftermiddagen. Vi visar inga spotpriser själva, eftersom de inte får återpubliceras fritt; hämta dem hos din elhandlare eller på ${h.src('entsoe', 'ENTSO-E:s transparensplattform')}.</p>
<h2>Från spotpris till totalpris</h2>
<p>Skillnaden mellan två perioder är bara skillnaden i spotpris, plus moms. Energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och nätets överföringsavgift är desamma dygnet runt, om inte ditt nät har olika pris för höglast och låglast. Därför ser procentskillnaderna mindre ut i totalpris än på börstavlan. Kalkylatorn visar båda: den kurva du ser är totalpris per period, med ditt nät.</p>
<h2>Tre fällor att undvika</h2>
<ul>
<li><strong>Fel avtal.</strong> Med rörligt månadspris eller fast pris betalar du samma pris per kWh vilken tid du än använder elen. Då ger flyttad förbrukning ingenting på din faktura. Se ${h.a('kvartspris', 'kvartspris')}.</li>
<li><strong>Allt på en gång.</strong> Har ditt nät en ${h.a('effektavgift', 'effektavgift')} kan det bli dyrt att starta laddning, disk och tvätt i samma billiga period. Sprid ut dem.</li>
<li><strong>Fel elområde.</strong> Priserna du klistrar in måste gälla ditt elområde. Kontrollera att appen visar rätt område.</li>
</ul>
<h2>Vad det är värt i kronor</h2>
<p>Värdet beror på hur många kilowattimmar du kan flytta och hur stor skillnaden är. En disk på 1 kWh som flyttas till en period som är 60 öre billigare sparar 75 öre med moms. En laddning på 30 kWh med samma skillnad sparar ${h.kr((30 * 60 * v.mo) / 100, 2)}. Mini-kalkylatorn ovan räknar på din egen förbrukning per dag, med de snittpriser du själv anger för den tid du brukar använda elen och för det billigaste fönstret; ${h.a('ladda-elbil', 'laddkalkylatorn')} och ${h.a('kostnad-diskmaskin', 'diskmaskinens kalkylator')} visar den billigaste starttiden direkt när du klistrar in priserna.</p>`;
    },
  },
  en: {
    slug: 'cheapest-time-for-electricity',
    nav: 'Cheapest time for power',
    card: 'How to find the day’s cheapest window for dishes, laundry and charging.',
    title: 'Cheapest Time for Electricity 2026: Find the Day’s Lowest',
    description: 'Cheapest time for electricity in Sweden, 2026: priced per quarter hour, 96 times a day. How to find the cheapest window for dishes, laundry and car charging.',
    h1: 'The cheapest time for electricity: find the day’s cheapest window',
    intro: 'The cheapest moment is not always the cheapest window. It depends on how long the appliance runs.',
    resume: (h) => {
      const v = V(h);
      return `Since 1 October 2025 Swedish electricity has been priced per quarter hour, and the day’s 96 prices are set in the auction at ${h.P.marknad.auktion_kl} the day before. So the cheapest time to run an appliance is not a fixed clock time that holds every day, but something you work out from tomorrow’s list. The key is to look for the cheapest continuous window as long as the appliance needs, not just the cheapest quarter. In an invented example with 24 hourly prices, the cheapest hour is at ${v.kl(v.w1.start, 60)}, but the cheapest six-hour window starts at ${v.kl(v.w6.start, 60)}. The calculator runs the same search on the prices you paste and turns them into all-in prices with your grid and tax. It only pays on a quarter-hour contract; on a variable or fixed price, timing does not change the bill.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Is there a time of day when power is always cheapest?', a: 'No. Prices are set afresh for each day in the auction the day before, from supply, demand and transmission between zones. A time that was cheap yesterday may be dear tomorrow. That is why we work from the list for the exact day you are planning rather than giving a fixed clock time.' },
        { q: 'Why is the cheapest hour not the cheapest window?', a: `Because an appliance running for several hours pays for every quarter it runs. In the example the hour at ${v.kl(v.w1.start, 60)} is cheapest, but a six-hour window starting there would include dearer hours afterwards. The calculator compares every window of the right length and picks the lowest average.` },
        { q: 'Which appliances are worth shifting?', a: 'Those that use a lot of energy and can wait: car charging, the tumble dryer, the dishwasher and washer on a timer, and a controllable water heater. Fridges and freezers run when their thermostat wants, and cooking happens when you eat. The more kWh you move, the more it is worth, and a car charge of several tens of kWh outweighs a wash or dryer cycle of 1 to 3 kWh.' },
        { q: 'How do I paste the prices correctly?', a: 'Copy the list from your retailer’s app or the ENTSO-E platform, one price per line. Times on the same line are fine; the calculator takes the number after the time. Öre, kronor and euros per megawatt-hour are recognised; for euros you enter the exchange rate. 24 prices are read as hours and 96 as quarters.' },
        { q: 'How often do I need to redo the calculation?', a: 'Every day, since prices are set afresh at each auction. It takes a minute: fetch tomorrow’s list in the afternoon, paste it and read off the start time for the appliance you want to run. With several appliances, do one at a time and spread them out if your grid has a power charge.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [[1, v.w1], [3, v.w3], [6, v.w6]].map(([n, w]) => { const x = w as { start: number; snitt: number }; return [`${n} ${n === 1 ? 'hour' : 'hours'}`, v.kl(x.start, 60), h.ore(x.snitt), h.ore((x.snitt + 25 + h.P.skatt.energiskatt_ore) * v.mo)]; });
      return `<h2>How the search for the cheapest window works</h2>
<p>Picture a window as long as the programme. The calculator places it on the day’s first quarter, works out the average price, moves it on by one quarter and repeats, until it has tried every position. The position with the lowest average is the cheapest start time. The method accounts for a long charge having to pay for the dearer quarters at its start or end too.</p>
${h.table(['Length', 'Cheapest start', 'Average in the window', 'All-in incl. VAT'], rows, `Invented hourly prices in öre/kWh before VAT, to show the method; the day’s lowest ${h.ore(v.st.min)}, highest ${h.ore(v.st.max)}. All-in with a 25 öre transfer fee and energy tax.`, ['l', 'l', 'r', 'r'])}
<p>The example shows how the choice changes with length, and why looking at the day’s lowest price in the app is not enough. For a short dishwasher run the single cheapest hour fits. For a long charge another part of the day gives the lowest average, because the cheapest hour is surrounded by dear ones.</p>
<h2>Quarters, hours and clock-change days</h2>
<p>Paste 96 prices and the calculator works in quarters; paste 24 and it works in hours. Both work, but quarters give a sharper picture: a window can start and end mid-hour, and the cheapest slot for a two-and-a-half-hour dishwasher run is found more precisely. On the days the clocks change to summer or winter time, the day has 92 or 100 quarters. The calculator then uses the number of prices you pasted and shows times from midnight, so double-check the start time on those days.</p>
<p>If you only have part of the day, say the evening and night prices, that works too: the calculator searches the list you gave it. A window cannot be longer than the list, so an eight-hour charge needs at least eight hours of prices.</p>
<h2>From start time to timer</h2>
<p>Dishwashers, washing machines and wallboxes often offer a start time or a delayed start. With a start time you set the clock time the calculator suggests. With a delayed start you count the hours from now until then. Some machines set when the programme should finish rather than start; subtract the programme length. For an electric car, charging can often be controlled in the car’s or the wallbox’s app, where you set a start or end time.</p>
<h2>Where the prices come from</h2>
<p>Tomorrow’s prices are known after the day-ahead auction, which Svenska kraftnät describes: buy and sell bids for each quarter hour are matched at ${h.P.marknad.auktion_kl} the day before. The exact time lists appear in apps varies, so count on the afternoon. We show no spot prices ourselves, since they may not be freely republished; get them from your retailer or the ${h.src('entsoe', 'ENTSO-E transparency platform')}.</p>
<h2>From spot price to all-in price</h2>
<p>The gap between two windows is only the spot gap, plus VAT. Energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and the grid transfer fee are the same around the clock unless your grid has peak and off-peak rates. That is why percentage gaps look smaller in all-in prices than on the exchange board. The calculator shows both: the curve you see is the all-in price per period, on your grid.</p>
<h2>Three traps to avoid</h2>
<ul>
<li><strong>The wrong contract.</strong> On a variable monthly or fixed price you pay the same per kWh whenever you use power, so shifting gains nothing on your bill. See ${h.a('kvartspris', 'quarter-hour prices')}.</li>
<li><strong>Everything at once.</strong> If your grid has a ${h.a('effektavgift', 'power charge')}, starting charging, dishes and laundry in the same cheap window can cost you. Spread them out.</li>
<li><strong>The wrong zone.</strong> The prices you paste must be for your bidding zone. Check the app shows the right one.</li>
</ul>
<h2>What it is worth in kronor</h2>
<p>The value depends on how many kilowatt-hours you can move and how wide the gap is. A 1 kWh dishwasher run moved to a window 60 öre cheaper saves 75 öre with VAT. A 30 kWh charge with the same gap saves ${h.kr((30 * 60 * v.mo) / 100, 2)}. The mini-calculator above works from your own daily use; the ${h.a('ladda-elbil', 'charging calculator')} and the ${h.a('kostnad-diskmaskin', 'dishwasher calculator')} show the cheapest start directly once you paste the prices.</p>`;
    },
  },
});
