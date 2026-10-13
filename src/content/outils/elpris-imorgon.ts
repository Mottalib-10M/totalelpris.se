import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Elpris imorgon : planifier demain à partir des 96 prix collés ; exemple chiffré avec une liste fictive annoncée comme telle. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const e = M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!;
  const t = M.natTariff(e, 'V16')!;
  // Deux prix d'exemple saisis par le lecteur (pas des prix de marché) : 20 et 150 öre.
  const billig = M.totalpris({ spot: 20, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const dyr = M.totalpris({ spot: 150, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const tvatt = P.apparater.tvattmaskin.kwh;
  return { e, t, billig, dyr, tvatt, spann: dyr.total - billig.total, kvartar: 96 };
};

export default defineGuide({
  id: 'elpris-imorgon',
  group: 'pris',
  order: 20,
  tool: 'pris',
  toolProps: { mode: 'imorgon', nat: 'Vattenfall Eldistribution|Syd', zon: 'SE3', fall: 'V16' },
  related: ['billigaste-tiden', 'kvartspris', 'spotpris', 'kostnad-tvattmaskin', 'ladda-elbil'],
  sources: ['svkDagenFore', 'embKvartNyhet', 'entsoe', 'eiNat'],
  sv: {
    slug: 'elpris-imorgon',
    nav: 'Elpris imorgon',
    card: 'Klistra in morgondagens 96 kvartspriser och se totalpriset och billigaste tiden.',
    title: 'Elpris imorgon 2026: totalpris per kvart med skatt och nät',
    description: 'Elpris imorgon 2026: priserna sätts vid auktionen kl. 12 dagen före. Klistra in morgondagens 96 kvartspriser och se ditt totalpris och billigaste tiden.',
    h1: 'Elpris imorgon: planera morgondagen med totalpriset',
    intro: 'Morgondagens priser sätts vid elbörsens auktion klockan tolv. Här gör du om dem till det du faktiskt betalar.',
    resume: (h) => {
      const v = V(h);
      return `Morgondagens elpriser bestäms vid auktionen på dagen före-marknaden klockan ${h.P.marknad.auktion_kl}, där köp- och säljbud för varje kvart mellan midnatt och midnatt matchas, och sedan den 1 oktober 2025 får varje dygn ${v.kvartar} priser i stället för 24. Priset du ser i appen är spotpriset utan moms. Det du betalar för en kvart med billig el är ändå långt ifrån noll: med Vattenfall Eldistributions överföringsavgift på ${h.ore(v.t.rorligOre)} för en villa med 16 ampere, energiskatten och momsen kostar en kvart med spotpris 20 öre ${h.ore(v.billig.total)}, och en kvart med 150 öre ${h.ore(v.dyr.total)}. Klistra in morgondagens lista från din elhandlares app i kalkylatorn, välj ditt elnät och hur länge disken eller laddningen ska pågå, så får du totalpriset för varje kvart och den billigaste starttiden.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vilken tid kommer elpriset för imorgon?', a: `Svenska kraftnät beskriver att handeln för nästa dygn avgörs i en auktion klockan ${h.P.marknad.auktion_kl} dagen före leveransdagen. Priserna blir kända efter auktionen, i början av eftermiddagen. Exakt minut varierar, så räkna inte med morgondagens pris före lunch. Därefter ändras de inte under dygnet.` },
        { q: 'Hur mycket sparar jag på att tvätta när elen är billig imorgon?', a: `Skillnaden mellan två kvartar är skillnaden i spotpris plus moms, eftersom skatt och nätavgift per kWh är desamma. Med spotpris 20 och 150 öre blir det ${h.ore(v.spann)}. En tvätt på ${h.num(v.tvatt)} kWh i ecoprogrammet kostar då ungefär ${h.kr((v.spann * v.tvatt) / 100, 2)} mindre. Det märks bara på fakturan om du har kvartsprisavtal.` },
        { q: 'Kan jag klistra in priser i euro?', a: `Ja. Står det €/MWh eller EUR i texten du klistrar in läser kalkylatorn listan som euro per megawattimme och ber dig ange växelkursen. En euro per megawattimme är en tiondels cent per kilowattimme, så 50 €/MWh blir 55 öre med kursen 11 kronor. Lägg sedan till ditt påslag.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Varför ett billigt spotpris inte betyder billig el</h2>
<p>Energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och nätets överföringsavgift tas ut per kilowattimme oavsett vad börsen säger. När spotpriset faller mot noll en blåsig natt finns de kvar, och momsen läggs på dem också. Därför är skillnaden mellan morgondagens dyraste och billigaste kvart mindre i procent än börstavlan antyder, men den är lika stor i kronor.</p>
${h.table(['Spotpris imorgon (exempel)', 'Totalpris inkl. moms', 'Varav nät och skatt'], [['20 öre', h.ore(v.billig.total), h.ore((v.billig.natOverforing + v.billig.energiskatt) * (1 + h.P.skatt.moms))], ['150 öre', h.ore(v.dyr.total), h.ore((v.dyr.natOverforing + v.dyr.energiskatt) * (1 + h.P.skatt.moms))]], `Villa 16 A, Vattenfall Eldistribution, Energimarknadsinspektionen ${h.P.year}. Spotpriserna är exempel, inga marknadspriser.`, ['l', 'r', 'r'])}
<h2>Så klistrar du in morgondagens lista</h2>
<ol>
<li>Öppna din elhandlares app eller ${h.src('entsoe', 'ENTSO-E:s transparensplattform')} efter auktionen och välj ditt elområde.</li>
<li>Markera de ${v.kvartar} priserna, eller 24 timpriser om tjänsten visar timmar, och kopiera dem. Klockslag på samma rad gör inget: kalkylatorn tar talet efter tiden.</li>
<li>Öppna rutan under kalkylatorn och klistra in. Välj hur många timmar apparaten ska gå.</li>
</ol>
<p>Du får totalpriset per kvart med din nätavgift, morgondagens lägsta och högsta pris och när den billigaste perioden börjar. Allt räknas i din webbläsare; listan skickas ingenstans.</p>
<h2>När morgondagen spelar roll och när den inte gör det</h2>
<p>Med kvartsprisavtal betalar du varje kvarts pris, och då lönar det sig att lägga ${h.a('ladda-elbil', 'laddningen av elbilen')} eller ${h.a('kostnad-torktumlare', 'torktumlaren')} i morgondagens billigaste timmar. Med rörligt månadspris betalar du månadens snitt, och då ändrar en flyttad tvätt inte fakturan. Läs ${h.a('kvartspris', 'guiden om kvartspris')} för skillnaden och ${h.a('billigaste-tiden', 'när elen brukar vara billigast')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-tomorrow',
    nav: 'Price tomorrow',
    card: 'Paste tomorrow’s 96 quarter-hour prices to see the all-in price and the cheapest time.',
    title: 'Electricity Price Tomorrow 2026: All-in per Quarter Hour',
    description: 'Electricity price tomorrow in Sweden, 2026: set at the 12:00 day-ahead auction. Paste the 96 quarter-hour prices to see the all-in price and cheapest time.',
    h1: 'Electricity price tomorrow: plan the day on the all-in price',
    intro: 'Tomorrow’s prices are set in the exchange auction at noon. Here you turn them into what you actually pay.',
    resume: (h) => {
      const v = V(h);
      return `Tomorrow’s Swedish electricity prices are fixed in the day-ahead auction at ${h.P.marknad.auktion_kl}, where buy and sell bids for every quarter hour from midnight to midnight are matched, and since 1 October 2025 each day has ${v.kvartar} prices instead of 24. The figure in your app is the spot price before VAT. A cheap quarter still costs you far more than nothing: with Vattenfall Eldistribution’s transfer fee of ${h.ore(v.t.rorligOre)} for a 16 A house, energy tax and VAT, a quarter at a 20 öre spot price costs ${h.ore(v.billig.total)}, and one at 150 öre costs ${h.ore(v.dyr.total)}. Paste tomorrow’s list from your retailer’s app into the calculator, choose your grid and how long the dishwasher or the car will run, and you get the all-in price of every quarter and the cheapest start time.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'When are tomorrow’s Swedish prices published?', a: `Svenska kraftnät explains that trading for the next day is settled in an auction at ${h.P.marknad.auktion_kl} the day before delivery. Prices become known after the auction, early in the afternoon; the exact minute varies, so do not count on tomorrow’s price before lunch. After that they do not change.` },
        { q: 'How much do I save by running the washer in tomorrow’s cheap hours?', a: `The gap between two quarters is the spot difference plus VAT, because tax and grid fee per kWh stay the same. With spot prices of 20 and 150 öre that is ${h.ore(v.spann)}, so an eco wash of ${h.num(v.tvatt)} kWh costs about ${h.kr((v.spann * v.tvatt) / 100, 2)} less. It only shows on your bill on a quarter-hour contract.` },
        { q: 'Can I paste prices quoted in euros?', a: `Yes. If the pasted text contains €/MWh or EUR, the calculator reads the list as euros per megawatt-hour and asks for the exchange rate. One euro per MWh is a tenth of a cent per kWh, so 50 €/MWh becomes 55 öre at 11 kronor to the euro. Then add your retailer’s mark-up.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>A cheap spot price is not cheap electricity</h2>
<p>Energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and the grid transfer fee are charged per kilowatt-hour whatever the exchange does. When the spot price drops towards zero on a windy night they remain, with VAT on top. So the gap between tomorrow’s dearest and cheapest quarter looks smaller in percentage terms than the exchange board suggests, though it is just as large in kronor.</p>
${h.table(['Spot price tomorrow (example)', 'All-in price incl. VAT', 'Of which grid and tax'], [['20 öre', h.ore(v.billig.total), h.ore((v.billig.natOverforing + v.billig.energiskatt) * (1 + h.P.skatt.moms))], ['150 öre', h.ore(v.dyr.total), h.ore((v.dyr.natOverforing + v.dyr.energiskatt) * (1 + h.P.skatt.moms))]], `16 A house, Vattenfall Eldistribution, Energy Markets Inspectorate ${h.P.year}. Spot prices are examples, not market prices.`, ['l', 'r', 'r'])}
<h2>How to paste tomorrow’s list</h2>
<ol>
<li>After the auction, open your retailer’s app or the ${h.src('entsoe', 'ENTSO-E transparency platform')} and select your bidding zone (elområde).</li>
<li>Select the ${v.kvartar} prices, or 24 hourly prices if the service shows hours, and copy them. Times on the same line are fine: the calculator takes the number after the time.</li>
<li>Open the box under the calculator and paste. Choose how many hours the appliance will run.</li>
</ol>
<p>You get the all-in price per quarter with your grid fee, tomorrow’s lowest and highest price and when the cheapest window starts. Everything runs in your browser; the list goes nowhere.</p>
<h2>When tomorrow matters, and when it does not</h2>
<p>On a quarter-hour contract (kvartsprisavtal) you pay each quarter’s price, so it pays to put ${h.a('ladda-elbil', 'charging the car')} or the ${h.a('kostnad-torktumlare', 'tumble dryer')} in tomorrow’s cheapest hours. On a variable monthly price you pay the month’s average, so moving a wash does not change the bill. The guide to ${h.a('kvartspris', 'quarter-hour prices')} explains the difference, and ${h.a('billigaste-tiden', 'when power tends to be cheapest')} gives the patterns.</p>`;
    },
  },
});
