import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Effektavgift : principe, abrogation d'EIFS 2022:1 (juin 2026), proposition d'Ei au plus tard le 12 avril 2027. Faits : faits-taxes.md §8.2. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const saknas = (['V16', 'V20', 'V25'] as const).map((f) => ({ f, med: M.rangordna(f).length, av: M.ENHETER.filter((e) => e.cas[f]?.['2026'] !== undefined).length }));
  const ex = (kw: number, pris: number) => kw * pris * mo;
  return { mo, saknas, ex, l16: M.rangordna('L16').length };
};

export default defineGuide({
  id: 'effektavgift',
  group: 'nat',
  order: 60,
  mini: 'effektavgift',
  miniHref: 'jamfor-natavgift',
  related: ['natavgift', 'jamfor-natavgift', 'ellevio', 'kvartspris', 'ladda-elbil'],
  sources: ['eiEffekt', 'embEffekt', 'eiNat', 'embForbrukning'],
  sv: {
    slug: 'effektavgift',
    nav: 'Effektavgift',
    card: 'Vad en effektavgift är och varför kravet för 2027 försvann.',
    title: 'Effektavgift el 2026: kravet upphävt, så fungerar avgiften',
    description: 'Effektavgift på el 2026: Ei upphävde i juni kravet att alla elnät ska ha effekttariff från 2027. Hur avgiften fungerar och hur du sänker din egen topp.',
    h1: 'Effektavgift: vad den är och vad som gäller efter juni 2026',
    intro: 'En effektavgift tar betalt för hur mycket el du använder samtidigt, inte bara hur mycket totalt.',
    resume: (h) => {
      return `En effektavgift är en del av nätavgiften som beräknas på din högsta effekt, i kilowatt, under en period, i stället för eller utöver hur många kilowattimmar du använder. Energimarknadsinspektionen hade i föreskriften EIFS 2022:1 krävt att alla elnätsföretag skulle införa effektavgifter senast den 1 januari 2027. I mars ${h.P.year} fick myndigheten regeringens uppdrag att upphäva kravet, och föreskrifterna upphävdes i juni ${h.P.year}. Det finns alltså inte längre något krav på effektavgifter, men enligt Energimarknadsinspektionen säger inget i lagstiftningen att de är otillåtna, så nätföretag som redan har dem kan behålla dem. Energimarknadsbyrån skriver att effekttariffer därmed inte kommer att införas generellt från 2027. Myndigheten ska senast den 12 april 2027 föreslå en ny modell. Har ditt nät en effektavgift kostar varje kilowatt i din topp ett fast belopp; mini-kalkylatorn räknar på din egen prislista.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Måste mitt elnätsföretag införa effektavgift 2027?', a: 'Nej, inte längre. Energimarknadsinspektionen upphävde i juni 2026 de föreskrifter som krävde att alla elnätsföretag skulle ha effektavgifter senast den 1 januari 2027. Nätföretag får ändå välja att ha eller införa dem, eftersom inget i lagen förbjuder det. Vad som gäller för dig står i ditt nätföretags prislista.' },
        { q: 'Hur mäts effekten i en effektavgift?', a: 'Det bestäms av varje nätföretag och står i prislistan: vilka timmar eller kvartar som räknas, hur många av de högsta som tas med, och om vissa tider eller månader undantas. Eftersom metoden skiljer sig mellan nätföretagen kan du inte jämföra två nät utan att läsa båda prislistorna noga.' },
        { q: 'Varför saknas villapriser för vissa nät i jämförelsen?', a: `Energimarknadsinspektionens typfall räknar en årskostnad bara när tariffen går att räkna så. ${h.P.year} finns ett lägenhetspris för ${h.num(v.l16)} nätområden men ett pris för villa med 16 ampere för ${h.num(v.saknas[0].med)}. För resten redovisar tabellen inget totalbelopp; det gäller ofta nät med effektavgift, men tabellen anger inte orsaken.` },
        { q: 'Hur sänker jag min effektavgift?', a: 'Genom att undvika att många stora apparater går samtidigt under den period som räknas. Starta inte disk, tvätt, ugn och elbilsladdning på samma timme; låt laddboxen vänta till natten om nätet bara räknar dagtid. En smart styrning kan också begränsa laddningen när annat drar mycket. Sänkt topp med en kilowatt sparar det belopp per kW som står i prislistan.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Energi och effekt är två olika saker</h2>
<p>Energimarknadsbyrån förklarar skillnaden med ett enkelt exempel: en apparat med effekten 1 kW som används i en timme förbrukar 1 kWh. Energin, i kilowattimmar, är hur mycket el du använt totalt. Effekten, i kilowatt, är hur mycket du använder i ett visst ögonblick. En vattenkokare har hög effekt men används i några minuter; en frys har låg effekt men går hela tiden. Elnätet måste dimensioneras för de stunder när många använder mycket samtidigt, och en effektavgift sätter ett pris på just det.</p>
<h2>Vad som hände med kravet på effektavgifter</h2>
<ol>
<li>Energimarknadsinspektionens föreskrift EIFS 2022:1 krävde att alla elnätsföretag skulle införa effektavgifter senast den 1 januari 2027.</li>
<li>Den 13 mars ${h.P.year} meddelade myndigheten att den fått regeringens uppdrag att upphäva föreskrifterna senast den 30 juni och att ta fram förslag till en ny modell.</li>
<li>I juni ${h.P.year} upphävdes föreskrifterna. Det finns inget krav kvar, men heller inget förbud.</li>
<li>Senast den 12 april 2027 ska Energimarknadsinspektionen lämna sitt förslag om ny utformning av effektavgifter till regeringen.</li>
</ol>
<p>För dig som kund betyder det, med Energimarknadsbyråns ord, att effekttariffer inte längre kommer att införas generellt från 2027, men att ditt nätföretag kan välja att fortsätta använda dem. Några prislistor som redan har en effektdel ligger alltså kvar, andra nät har aldrig haft någon.</p>
<h2>Så räknas en effektavgift i princip</h2>
<p>Nätföretaget mäter din förbrukning och räknar fram en effekt i kilowatt för månaden enligt sina egna regler. Den multipliceras med ett pris per kilowatt. Med en topp på 6 kW och ett pris på 50 kronor per kW exklusive moms blir avgiften ${h.kr(v.ex(6, 50))} för månaden med moms; med 4 kW blir den ${h.kr(v.ex(4, 50))}. Beloppen är exempel. Ditt eget pris och hur toppen mäts står i nätföretagets prislista.</p>
<h2>Ett räkneexempel: samla eller sprida</h2>
<p>Anta, som ett exempel, att ditt nät tar ${h.kr(50)} per kW exklusive moms och räknar månadens högsta timme. En vardagskväll laddar du bilen med 11 kW samtidigt som hushållet i övrigt drar 3 kW. Timmen ger en topp på 14 kW och en effektavgift på ${h.kr(v.ex(14, 50))} för månaden med moms. Startar laddboxen i stället vid midnatt, när resten av hemmet bara drar 1 kW, blir toppen kanske 12 kW, och sänker du laddeffekten till 3,7 kW blir den runt 7 kW: ${h.kr(v.ex(7, 50))}. Energin som laddas är densamma i alla tre fallen; det enda som ändras är hur snabbt den tas ut.</p>
<p>Exemplet visar varför laddning med lägre effekt under en längre tid ofta är det som påverkar effektavgiften mest. Laddtiden för din bil vid olika effekt räknar du ut i ${h.a('ladda-elbil', 'kalkylatorn för laddning')}.</p>
<h2>Effektavgift och kvartspris samtidigt</h2>
<p>Har du både kvartsprisavtal hos elhandlaren och effektavgift hos nätföretaget drar de två åt olika håll. Kvartspriset belönar att du samlar förbrukningen i de billigaste kvartarna; effektavgiften straffar att du gör allt på en gång. Ett sätt att möta båda är att lägga stora laster i billiga perioder men inte samtidigt, till exempel diskmaskinen tidigt på natten och laddningen senare. Räkna på båda delarna innan du ställer in timrarna. Att flytta en enda apparat en timme kan räcka för att toppen ska sjunka, och skillnaden i kvartspris mellan två närliggande timmar är ibland liten. Börja med den största lasten i ditt hem, till exempel elbilen om du har en, eftersom den påverkar toppen mer än småapparaterna gör. Titta sedan på fakturan nästa månad för att se vilken effekt som räknades.</p>
<h2>Hushåll som påverkas mest</h2>
<ul>
<li><strong>Elvärmda villor</strong>, där en direktverkande elvärme eller en värmepump med elpatron kan ge höga toppar kalla dagar.</li>
<li><strong>Hushåll med elbil</strong>, där laddning med 11 kW samtidigt som spisen och tvättmaskinen går kan bli månadens topp.</li>
<li><strong>Hushåll med bastu</strong> eller andra stora laster som används en stund i taget.</li>
</ul>
<p>En lägenhet med låg förbrukning och få stora apparater påverkas sällan mycket. För den som har ett ${h.a('kvartspris', 'kvartsprisavtal')} kan det vara frestande att lägga allt på de billigaste kvartarna, men med effektavgift kan det bli dyrare om alla apparater startar på samma gång. Sprid ut lasterna.</p>
<h2>Effektavgiften i våra kalkylatorer</h2>
<p>Energimarknadsinspektionens typfall, som vi använder i ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')} och i kalkylatorn på startsidan, innehåller ett totalbelopp bara när tariffen går att räkna fram för typkunden. För ${h.P.year} har ${h.num(v.l16)} nätområden ett pris för lägenhet men ${h.num(v.saknas[0].med)} för villa med 16 ampere och ${h.num(v.saknas[1].med)} för villa med 20 ampere. Där priset saknas visar vi inget i stället för att gissa. Har ditt nät en effektavgift, använd mini-kalkylatorn ovan med dina egna siffror och lägg till beloppet till nätavgiften. Grunderna i nätavgiften förklaras i ${h.a('natavgift', 'nätavgiften förklarad')}.</p>`;
    },
  },
  en: {
    slug: 'power-tariff-sweden',
    nav: 'Power charge',
    card: 'What a power charge is and why the 2027 requirement was dropped.',
    title: 'Power Tariff Sweden 2026: Requirement Dropped, How It Works',
    description: 'Power tariff (effektavgift) in Sweden, 2026: Ei repealed the rule that every grid needs one by 2027. How the charge works and how to lower your own peak.',
    h1: 'Power charges: what they are and what applies after June 2026',
    intro: 'A power charge bills how much electricity you use at once, not only how much in total.',
    resume: (h) => {
      return `A power charge (effektavgift) is part of the grid fee that is based on your highest load, in kilowatts, during a period, instead of or on top of how many kilowatt-hours you use. The Energy Markets Inspectorate (Ei) had required, in regulation EIFS 2022:1, that every grid company introduce power charges by 1 January 2027. In March ${h.P.year} the regulator was instructed by the government to repeal that requirement, and the regulation was repealed in June ${h.P.year}. So there is no longer any obligation, but according to Ei nothing in law makes power charges unlawful, and grid companies that already have them may keep them. Energimarknadsbyrån writes that power tariffs will therefore not be introduced across the board from 2027. Ei must propose a new model by 12 April 2027. If your grid has a power charge, every kilowatt of your peak costs a fixed amount; the mini-calculator works it out from your own price list.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Must my grid company introduce a power charge in 2027?', a: 'No, not any more. In June 2026 the Energy Markets Inspectorate repealed the regulation that required every grid company to have power charges by 1 January 2027. Grid companies may still choose to keep or introduce them, since nothing in law forbids it. What applies to you is in your grid company’s price list.' },
        { q: 'How is the load measured in a power charge?', a: 'Each grid company decides and states it in its price list: which hours or quarters count, how many of the highest values are included, and whether certain times or months are excluded. Because methods differ between companies, you cannot compare two grids without reading both price lists carefully.' },
        { q: 'Why are house prices missing for some grids in the comparison?', a: `The regulator’s standard cases give an annual cost only where the tariff can be computed that way. In ${h.P.year}, ${h.num(v.l16)} grid areas have a flat price but ${h.num(v.saknas[0].med)} have a price for a 16 A house. For the rest the table shows no total; that often concerns grids with a power charge, though the table gives no reason.` },
        { q: 'How can I lower my power charge?', a: 'By avoiding many large appliances running at once during the counted period. Do not start the dishwasher, washer, oven and car charging in the same hour; let the wallbox wait for the night if your grid only counts daytime. Smart control can also throttle charging when other loads are high. Each kilowatt off your peak saves the price per kW in your list.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      return `<h2>Energy and power are two different things</h2>
<p>Energimarknadsbyrån explains the difference with a simple example: a 1 kW appliance used for one hour consumes 1 kWh. Energy, in kilowatt-hours, is how much power you used in total. Power, in kilowatts, is how much you draw at a given moment. A kettle has high power but runs for minutes; a freezer has low power but runs all the time. The grid has to be sized for the moments when many people draw a lot at once, and a power charge prices exactly that.</p>
<h2>What happened to the power-charge requirement</h2>
<ol>
<li>The regulator’s rule EIFS 2022:1 required every grid company to introduce power charges by 1 January 2027.</li>
<li>On 13 March ${h.P.year} the regulator announced it had been instructed by the government to repeal the rule by 30 June and to propose a new model.</li>
<li>In June ${h.P.year} the rule was repealed. No requirement remains, but no ban either.</li>
<li>By 12 April 2027 the regulator must submit its proposal for a new design of power charges to the government.</li>
</ol>
<p>For customers this means, in Energimarknadsbyrån’s words, that power tariffs will not be introduced across the board from 2027, but your grid company may choose to keep using them. Some price lists that already have a power component therefore stay as they are; other grids never had one.</p>
<h2>How a power charge works in principle</h2>
<p>The grid company meters your use and derives a load in kilowatts for the month according to its own rules, which is multiplied by a price per kilowatt. With a peak of 6 kW and a price of 50 kronor per kW before VAT, the charge is ${h.kr(v.ex(6, 50))} for the month with VAT; at 4 kW it is ${h.kr(v.ex(4, 50))}. These amounts are examples. Your own price and how the peak is measured are in the grid company’s price list.</p>
<h2>A worked example: bunch or spread</h2>
<p>Suppose, as an example, that your grid charges ${h.kr(50)} per kW before VAT and counts the month’s highest hour. One weekday evening you charge the car at 11 kW while the rest of the home draws 3 kW. That hour makes a 14 kW peak and a charge of ${h.kr(v.ex(14, 50))} for the month with VAT. Start the wallbox at midnight instead, when the home draws 1 kW, and the peak may be 12 kW; cut the charging power to 3.7 kW and it falls to around 7 kW: ${h.kr(v.ex(7, 50))}. The energy charged is the same in all three cases; only the rate at which it is drawn changes.</p>
<p>That is why slower charging over a longer time often has the biggest effect on a power charge. Work out your car’s charging time at different powers in the ${h.a('ladda-elbil', 'charging calculator')}.</p>
<h2>A power charge and a quarter-hour price at once</h2>
<p>With both a quarter-hour contract at the retailer and a power charge at the grid company, the two pull in opposite directions. The quarter-hour price rewards bunching use in the cheapest quarters; the power charge penalises doing everything at once. One way to satisfy both is to put large loads in cheap periods but not simultaneously, for instance the dishwasher early in the night and charging later. Work out both parts before setting the timers.</p>
<h2>Households most affected</h2>
<ul>
<li><strong>Electrically heated houses</strong>, where direct electric heating or a heat pump with an immersion heater can create high peaks on cold days.</li>
<li><strong>Households with an electric car</strong>, where 11 kW charging while the hob and washer run can become the month’s peak.</li>
<li><strong>Households with a sauna</strong> or other large loads used for a while at a time.</li>
</ul>
<p>A low-use flat with few large appliances is rarely affected much. On a ${h.a('kvartspris', 'quarter-hour contract')} it is tempting to put everything in the cheapest quarters, but with a power charge that can backfire if every appliance starts at once. Spread the loads.</p>
<h2>Power charges in our calculators</h2>
<p>The regulator’s standard cases, used in the ${h.a('jamfor-natavgift', 'grid-fee comparison')} and the home-page calculator, contain an annual total only when the tariff can be computed for the standard customer. For ${h.P.year}, ${h.num(v.l16)} grid areas have a flat price but ${h.num(v.saknas[0].med)} have one for a 16 A house and ${h.num(v.saknas[1].med)} for a 20 A house. Where the price is missing we show nothing rather than guess. If your grid has a power charge, use the mini-calculator above with your own figures and add the amount to the grid fee. The basics of the grid fee are in ${h.a('natavgift', 'the grid fee explained')}.</p>`;
    },
  },
});
