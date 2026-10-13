import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Sälja solel : fin de la skattereduktion de 60 öre au 1er janvier 2026 (Skatteverket) ; autoconsommation contre vente. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const m = P.marknad;
  const mo = 1 + P.skatt.moms;
  const e = M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!;
  const t = M.natTariff(e, 'V16')!;
  const egen = (spot: number) => M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms }).total;
  const sommar = M.serie('rorligt', 'SE3', '2').filter(([x]) => /M(05|06|07)$/.test(x) && x >= '2025');
  const somSnitt = sommar.reduce((a, [, y]) => a + y, 0) / sommar.length;
  return { m, mo, t, egen, somSnitt, maxKwh: m.mikroproduktion_max_kr / (m.mikroproduktion_ore / 100) };
};

export default defineGuide({
  id: 'salja-solel',
  group: 'guide',
  order: 80,
  mini: 'solel',
  related: ['negativa-elpriser', 'energiskatt', 'kvartspris', 'elpris-se3', 'paslag'],
  sources: ['skvMikro', 'skvEl', 'eiNat', 'scbElpriser'],
  sv: {
    slug: 'salja-solel',
    nav: 'Sälja solel',
    card: 'Skattereduktionen är borta 2026. Vad såld och egen solel är värd nu.',
    title: 'Sälja solel 2026: skattereduktionen borta, vad gäller nu',
    description: 'Sälja solel 2026: skattereduktionen på 60 öre per kWh slopades den 1 januari 2026. Vad en såld kWh nu är värd jämfört med en kWh som du använder själv.',
    h1: 'Sälja solel 2026: när skattereduktionen har försvunnit',
    intro: 'Från 2026 får du ingen skattereduktion för solel du matar ut på nätet. Det ändrar räkningen för solcellsägare.',
    resume: (h) => {
      const v = V(h);
      return `Skattereduktionen för mikroproduktion av förnybar el, ${h.num(v.m.mikroproduktion_ore)} öre per kilowattimme som matades in på elnätet, försvann från och med den 1 januari 2026 enligt Skatteverket. För el som du matade in till och med den 31 december 2025 får du reduktionen i deklarationen 2026, högst ${h.kr(v.m.mikroproduktion_max_kr)} om året, men för el som matas in under 2026 finns ingen reduktion i deklarationen 2027. Det betyder att en såld kilowattimme nu bara är värd det som köparen betalar dig enligt avtalet. En kilowattimme som du använder själv är däremot värd hela det totalpris du slipper betala: spotpris, påslag, nätets överföringsavgift, energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms. Med Vattenfall Eldistributions nät och ett spotpris på 50 öre är det ${h.ore(v.egen(50))}. Därför lönar det sig mer än tidigare att använda solelen när den produceras.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Får jag skattereduktion för solel 2026?', a: `Nej. Skatteverket skriver att riksdagen har beslutat att skattereduktionen för mikroproduktion av förnybar el försvinner från och med den 1 januari 2026. För el som matas in på nätet under 2026 får du alltså ingen reduktion. För el som matades in till och med den 31 december 2025 gäller ${h.num(v.m.mikroproduktion_ore)} öre per kWh i deklarationen 2026.` },
        { q: 'Hur mycket var skattereduktionen värd som mest?', a: `${h.num(v.m.mikroproduktion_ore)} öre per inmatad kWh, för högst så många kWh som du tog ut från nätet under året och högst ${h.num(v.maxKwh)} kWh. Skatteverket räknar fram maxbeloppet till ${h.kr(v.m.mikroproduktion_max_kr)} om året. Det gäller produktionen till och med 2025, som redovisas i deklarationen 2026.` },
        { q: 'Vad är en såld kWh solel värd nu?', a: 'Det som din elhandlare eller köparen betalar enligt avtalet, som kan vara kopplat till spotpriset. Det kan bli lågt när många solcellsanläggningar producerar samtidigt och priset sjunker. Kontrollera ersättningen i ditt avtal och jämför den med ditt totalpris per köpt kWh, som mini-kalkylatorn räknar ut.' },
        { q: 'Lönar det sig att ladda elbilen med solel?', a: 'Om bilen står hemma när solen lyser, ja: varje kWh som går till bilen i stället för ut på nätet är värd ditt totalpris i stället för köparens ersättning. Ladda med den effekt som motsvarar överskottet om laddboxen kan styras så. Annars kan laddningen dra el från nätet samtidigt som solcellerna producerar.' },
        { q: 'Ska jag fortfarande sälja mitt solelsöverskott?', a: 'Ja, det du inte kan använda själv är bättre att sälja än att inte få något för. Men det lönar sig nu mer att flytta förbrukning till soltimmarna, eftersom en egen kWh är värd ditt totalpris med skatt och nät. Jämför köparens ersättning med ditt totalpris i mini-kalkylatorn för att se skillnaden per år.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [20, 50, 100].map((s) => [`${h.num(s)} öre`, h.ore(v.egen(s)), `${h.num(s)} öre ${h.lang === 'sv' ? '(exempel)' : ''}`.trim()]);
      return `<h2>Egen kWh mot såld kWh</h2>
${h.table(['Spotpris', 'Värde av en kWh du använder själv', 'Värde av en såld kWh om du får spotpriset'], rows, `Egen förbrukning: undvikt totalpris med Vattenfall Eldistributions överföringsavgift för villa 16 A, energiskatt och moms. Försäljning: ingen skattereduktion från ${h.date(v.m.mikroproduktion_slopad)}. Ersättningen i ditt avtal kan skilja sig.`, ['l', 'r', 'r'])}
<p>Skillnaden mellan kolumnerna är skatt, nät och moms på den el du hade behövt köpa. Den skillnaden försvinner inte när spotpriset är lågt, och därför är en kilowattimme som du använder själv alltid värd mer än en som du säljer till spotpris. Före 2026 krympte gapet med skattereduktionen på ${h.num(v.m.mikroproduktion_ore)} öre; nu gör det inte det längre.</p>
<h2>Vad som ändrades den 1 januari 2026</h2>
<p>Skattereduktionen för mikroproduktion gav ${h.num(v.m.mikroproduktion_ore)} öre för varje kWh som matades in på nätet, med två tak: inte fler kWh än du tog ut från nätet samma år, och högst ${h.num(v.maxKwh)} kWh. Skatteverket skriver att riksdagen beslutat att reduktionen försvinner från och med den 1 januari 2026, och att den sista gången den räknas är i deklarationen 2026 för produktionen 2025. Du behöver inte göra något för att den ska upphöra. För en anläggning som matade ut 3 000 kWh om året innebär förändringen att ${h.kr(3000 * v.m.mikroproduktion_ore / 100)} om året inte längre kommer tillbaka via deklarationen, så länge villan köpte minst lika mycket el från nätet.</p>
<h2>Ett räkneexempel: 3 000 kWh överskott</h2>
<p>Anta att en villa matar ut 3 000 kWh överskott om året och får 45 öre per kWh av köparen. Siffrorna är exempel. Under 2025 gav samma överskott dessutom skattereduktion: 3 000 × ${h.num(v.m.mikroproduktion_ore)} öre = ${h.kr(3000 * v.m.mikroproduktion_ore / 100)}, förutsatt att villan köpte minst lika många kWh från nätet. Från 2026 försvinner den delen, och försäljningen ger bara ${h.kr(3000 * 0.45)}. Kan villan i stället använda 1 000 av de 3 000 kWh själv, när solen lyser, slipper den köpa dem. Med ett totalpris på ${h.ore(v.egen(50))} är de värda ${h.kr(1000 * v.egen(50) / 100)}, mot ${h.kr(1000 * 0.45)} om de hade sålts. Det är skälet till att egen förbrukning har blivit viktigare än försäljningen. Räkna med dina egna siffror i mini-kalkylatorn: ange spotpriset de timmar du producerar, vad köparen betalar och hur stort överskottet är, så ser du hur mycket mer en egen kilowattimme är värd under ett år.</p>
<h2>Det som inte har ändrats</h2>
<p>Du kan fortfarande sälja ditt överskott till en elhandlare, och ersättningen bestäms som tidigare i avtalet med köparen. Det som har försvunnit är bara statens skattereduktion på ${h.num(v.m.mikroproduktion_ore)} öre. Produktionen under 2025 redovisas som vanligt i deklarationen 2026; Skatteverkets sida om mikroproduktion beskriver hur reduktionen räknas och vilka tak som gäller. Har du frågor om ditt avtal för såld el, vänd dig till köparen; om skattereduktionen för 2025, till Skatteverket.</p>
<h2>Så får du ut mer av solelen</h2>
<ul>
<li><strong>Flytta förbrukning till soltimmarna</strong>: kör tvättmaskin, diskmaskin och torktumlare mitt på dagen när panelerna producerar. Det kräver inget särskilt elavtal, eftersom det är den köpta elen du slipper.</li>
<li><strong>Styr laddningen av elbilen</strong> mot överskottet om bilen står hemma dagtid.</li>
<li><strong>Värm varmvatten</strong> med överskottet om beredaren kan styras.</li>
<li><strong>Kontrollera avtalet för såld el</strong>: ersättningen bestäms av köparen, och villkoren skiljer sig.</li>
<li><strong>Se över storleken vid en ny anläggning</strong>: utan skattereduktion är en kWh som säljs värd mindre än tidigare, så det är förbrukningen dagtid som avgör hur mycket av produktionen som får fullt värde.</li>
</ul>
<h2>Sommarens priser i SCB:s statistik</h2>
<p>SCB redovisar inget spotpris per timme, men snittet för rörligt avtal till en villa utan elvärme i SE3 under maj till juli sedan 2025 var ${h.ore(v.somSnitt)} exklusive moms, påslaget inräknat. Det ger en uppfattning om nivån på den el du köper under solcellernas bästa månader. Värdet av såld el beror däremot på spotpriset just de timmar du matar ut, som kan vara lägre. Se ${h.a('negativa-elpriser', 'negativa elpriser')} för vad som händer när priset går under noll, och ${h.a('energiskatt', 'energiskatt på el')} för skatten du slipper på egen förbrukning.</p>
<h2>Solel och nätavgiften</h2>
<p>Den el du producerar och använder själv behöver du inte köpa: du slipper elhandelns pris och den överföringsavgift, energiskatt och moms som ligger på köpt el. Den fasta nätavgiften och abonnemanget betalar du som förut. Har ditt nät en ${h.a('effektavgift', 'effektavgift')} kan solelen sänka din topp de timmar den produceras, men inte en kall vinterkväll när panelerna inte ger något. Räkna din nätavgift i ${h.a('jamfor-natavgift', 'jämförelsen')}.</p>`;
    },
  },
  en: {
    slug: 'selling-solar-power-sweden',
    nav: 'Selling solar power',
    card: 'The tax reduction is gone in 2026. What sold and self-used solar power is worth now.',
    title: 'Selling Solar Power 2026: Tax Reduction Gone, What Applies',
    description: 'Selling solar power in Sweden, 2026: the 60 öre per kWh tax reduction ended on 1 January 2026. What a sold kWh is now worth against one you use yourself.',
    h1: 'Selling solar power in 2026, after the tax reduction',
    intro: 'From 2026 there is no tax reduction for solar power you feed into the grid. That changes the sums for panel owners.',
    resume: (h) => {
      const v = V(h);
      return `The tax reduction for micro-production of renewable electricity, ${h.num(v.m.mikroproduktion_ore)} öre per kilowatt-hour fed into the grid, ended on 1 January 2026, according to the Swedish Tax Agency. For power fed in up to 31 December 2025 you still get it in the 2026 tax return, at most ${h.kr(v.m.mikroproduktion_max_kr)} a year, but power fed in during 2026 earns nothing in the 2027 return. A sold kilowatt-hour is now worth only what the buyer pays you under the contract. A kilowatt-hour you use yourself, though, is worth the whole all-in price you avoid: spot price, mark-up, the grid transfer fee, energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT. On Vattenfall Eldistribution’s grid with a 50 öre spot price that is ${h.ore(v.egen(50))}. That is why using solar power as it is produced pays more than before.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Is there a tax reduction for solar power in 2026?', a: `No. The Swedish Tax Agency states that parliament decided the tax reduction for micro-production of renewable electricity ends from 1 January 2026, so power fed into the grid during 2026 earns none. For power fed in up to 31 December 2025, ${h.num(v.m.mikroproduktion_ore)} öre per kWh applies in the 2026 return.` },
        { q: 'What was the tax reduction worth at most?', a: `${h.num(v.m.mikroproduktion_ore)} öre per kWh fed in, for no more kWh than you drew from the grid that year and at most ${h.num(v.maxKwh)} kWh. The Tax Agency puts the maximum at ${h.kr(v.m.mikroproduktion_max_kr)} a year. It covers production up to 2025, reported in the 2026 return.` },
        { q: 'What is a sold kWh of solar power worth now?', a: 'Whatever your retailer or buyer pays under the contract, which may be linked to the spot price. It can be low when many solar installations produce at once and the price drops. Check the payment in your contract and compare it with your all-in price per bought kWh, which the mini-calculator works out.' },
        { q: 'Is it worth charging the car with solar power?', a: 'If the car is at home while the sun shines, yes: each kWh going into the car instead of out to the grid is worth your all-in price rather than the buyer’s payment. Charge at a power matching the surplus if the wallbox can be controlled that way; otherwise charging may draw from the grid while the panels produce.' },
        { q: 'Should I still sell my solar surplus?', a: 'Yes, what you cannot use yourself is better sold than given away. But shifting use into sunny hours now pays more, since a kWh used is worth your all-in price with tax and grid fee. Compare the buyer’s payment with your all-in price in the mini-calculator to see the difference per year.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [20, 50, 100].map((s) => [`${h.num(s)} öre`, h.ore(v.egen(s)), `${h.num(s)} öre`]);
      return `<h2>A kWh used against a kWh sold</h2>
${h.table(['Spot price', 'Value of a kWh you use yourself', 'Value of a kWh sold at spot'], rows, `Own use: all-in price avoided with Vattenfall Eldistribution’s transfer fee for a 16 A house, energy tax and VAT. Sale: no tax reduction from ${h.date(v.m.mikroproduktion_slopad)}. The payment in your contract may differ.`, ['l', 'r', 'r'])}
<p>The gap between the columns is the tax, grid fee and VAT on power you would otherwise have bought. That gap does not vanish when spot prices are low, which is why a kilowatt-hour you use yourself is always worth more than one sold at the spot price. Before 2026 the tax reduction of ${h.num(v.m.mikroproduktion_ore)} öre narrowed it; now it no longer does.</p>
<h2>What changed on 1 January 2026</h2>
<p>The micro-production tax reduction paid ${h.num(v.m.mikroproduktion_ore)} öre for each kWh fed into the grid, with two caps: no more kWh than you drew from the grid that year, and at most ${h.num(v.maxKwh)} kWh. The Tax Agency says parliament decided it ends from 1 January 2026, and that it counts for the last time in the 2026 return for 2025 production. You need do nothing for it to stop. For an installation exporting 3,000 kWh a year, the change means ${h.kr(3000 * v.m.mikroproduktion_ore / 100)} a year no longer comes back through the tax return.</p>
<h2>A worked example: 3,000 kWh of surplus</h2>
<p>Suppose a house exports 3,000 kWh of surplus a year and the buyer pays 45 öre per kWh; the figures are examples. In 2025 the same surplus also earned the tax reduction: 3,000 × ${h.num(v.m.mikroproduktion_ore)} öre = ${h.kr(3000 * v.m.mikroproduktion_ore / 100)}, provided the house bought at least as many kWh from the grid. From 2026 that part is gone, and selling brings only ${h.kr(3000 * 0.45)}. If the house can instead use 1,000 of those 3,000 kWh itself while the sun shines, it avoids buying them. At an all-in price of ${h.ore(v.egen(50))} they are worth ${h.kr(1000 * v.egen(50) / 100)}, against ${h.kr(1000 * 0.45)} if sold. That is why self-use now matters more than selling. Try your own figures in the mini-calculator.</p>
<h2>What has not changed</h2>
<p>You can still sell your surplus to a retailer, with payment set as before in the contract with the buyer. What has gone is only the state’s ${h.num(v.m.mikroproduktion_ore)} öre tax reduction. Production in 2025 is reported as usual in the 2026 return; the Tax Agency’s page on micro-production explains how the reduction is calculated and its caps. Questions about your sale contract go to the buyer; about the 2025 reduction, to the Tax Agency.</p>
<h2>Getting more out of your solar power</h2>
<ul>
<li><strong>Shift use into sunny hours</strong>: run the washer, dishwasher and dryer at midday while the panels produce. No special contract is needed, since it is bought power you avoid.</li>
<li><strong>Steer car charging</strong> towards the surplus if the car is at home in the daytime.</li>
<li><strong>Heat hot water</strong> with the surplus if the heater can be controlled.</li>
<li><strong>Check the contract for sold power</strong>: the buyer sets the payment and terms differ.</li>
<li><strong>Reconsider sizing for a new installation</strong>: without the tax reduction a sold kWh is worth less than before, so daytime use decides how much of the output gets full value.</li>
</ul>
<h2>Summer prices in Statistics Sweden’s data</h2>
<p>Statistics Sweden publishes no hourly spot price, but the average variable price for a house without electric heating in SE3 from May to July since 2025 was ${h.ore(v.somSnitt)} before VAT, mark-up included. That gives a sense of the price of power you buy in the panels’ best months. The value of power sold depends on the spot price in the exact hours you export, which may be lower. See ${h.a('negativa-elpriser', 'negative electricity prices')} for what happens below zero, and ${h.a('energiskatt', 'energy tax on electricity')} for the tax you avoid on your own use.</p>
<h2>Solar power and the grid fee</h2>
<p>Power you produce and use yourself is power you do not buy: you avoid the retail price and the transfer fee, energy tax and VAT that come with bought power. The fixed grid fee and subscription stay as before. If your grid has a ${h.a('effektavgift', 'power charge')}, solar output may lower your peak in the hours it produces, but not on a cold winter evening when the panels deliver nothing. Check your grid fee in the ${h.a('jamfor-natavgift', 'comparison')}.</p>`;
    },
  },
});
