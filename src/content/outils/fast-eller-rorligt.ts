import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Fast ou rörligt : comparaison SCB sur 12 mois, par zone et type de logement (énergie seule). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const zoner = ['SE1', 'SE2', 'SE3', 'SE4'] as const;
  const namn = (a: string, sv: boolean) => (sv ? { rorligt: 'rörligt', avtal1ar: 'fast 1 år', avtal3ar: 'fast 3 år', anvisat: 'anvisat' } : { rorligt: 'variable', avtal1ar: 'fixed 1 yr', avtal3ar: 'fixed 3 yrs', anvisat: 'default' })[a as 'rorligt'];
  const villa = zoner.map((z) => ({ z, j: M.jamforAvtal(z, '3', 1500) }));
  const lgh = M.jamforAvtal('SE4', '1', 200);
  const per = M.senaste('rorligt', 'SE4', '3', 12);
  const ar = [2022, 2023, 2024, 2025].map((y) => ({ y, r: M.arssnitt('rorligt', 'SE4', '3', y)!.snitt, f: M.arssnitt('avtal1ar', 'SE4', '3', y)!.snitt }));
  return { mo, villa, lgh, namn, fran: per[0][0], till: per[per.length - 1][0], ar };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };
const billigast = (j: Array<{ avtal: string; kr: number }>) => [...j].sort((a, b) => a.kr - b.kr)[0];

export default defineGuide({
  id: 'fast-eller-rorligt',
  group: 'pris',
  order: 40,
  tool: 'avtal',
  toolProps: { zon: 'SE4' },
  related: ['elpriser-per-manad', 'kvartspris', 'paslag', 'elpris-se4', 'elrakning'],
  sources: ['scbElpriser', 'embKvart', 'embElrakning'],
  sv: {
    slug: 'fast-eller-rorligt-elpris',
    nav: 'Fast eller rörligt elpris',
    card: 'Vad rörligt, fast och anvisat avtal kostat de senaste tolv månaderna.',
    title: 'Fast eller rörligt elpris 2026: vad avtalen kostat i år',
    description: 'Fast eller rörligt elpris 2026: SCB:s priser för rörligt, fast 1 och 3 år och anvisat avtal de senaste 12 månaderna i SE1 till SE4. Räkna på din förbrukning.',
    h1: 'Fast eller rörligt elpris: facit för de senaste tolv månaderna',
    intro: 'Ingen vet vad elen kostar nästa vinter, men SCB visar vad varje avtalstyp faktiskt har kostat.',
    resume: (h) => {
      const v = V(h);
      const s4 = v.villa[3].j;
      const b = billigast(s4);
      const r = s4.find((x) => x.avtal === 'rorligt')!, f = s4.find((x) => x.avtal === 'avtal1ar')!;
      return `För en elvärmd villa i SE4 som använder 1 500 kWh i månaden kostade elenergin under de tolv månaderna från ${mn(h, v.fran)} till ${mn(h, v.till)} ${h.kr(r.kr * v.mo)} med rörligt avtal och ${h.kr(f.kr * v.mo)} med ett ettårigt fastpris, moms inräknad, enligt SCB:s statistik över vad elhandlarna fakturerat. Billigast var ${v.namn(b.avtal, true)}. Siffrorna gäller bara elhandeln: nätavgiften och energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} betalar du lika oavsett avtal. Fastpriset i statistiken är snittet för avtal som tecknades varje månad, vilket gör jämförelsen rättvis mot en kund som förnyar varje år. Välj elområde, bostad och förbrukning i verktyget för att se ordningen för just ditt fall. Ett rörligt pris kan bli dyrt en kall vinter, medan ett fast pris kostar extra för tryggheten att veta beloppet i förväg.`;
    },
    faqs: (h) => {
      const v = V(h);
      const l = v.lgh;
      const b = billigast(l);
      return [
        { q: 'Lönar sig fast elpris för en lägenhet i Malmö?', a: `För en lägenhet i SE4 med 200 kWh i månaden var ${v.namn(b.avtal, true)} billigast de senaste tolv månaderna enligt SCB: ${h.kr(b.kr * v.mo)} för elenergin med moms. Med så liten förbrukning är skillnaderna mellan avtalen små i kronor; elhandlarens fasta månadsavgift kan väga tyngre.` },
        { q: 'Vad händer om jag inte väljer något elavtal alls?', a: 'Då får du ett anvisat avtal från den elhandlare som nätföretaget utsett. I SCB:s statistik har det anvisade priset under de senaste tolv månaderna legat över det rörliga i alla elområden. Den som flyttar in i en ny bostad bör därför välja avtal själv så snart som möjligt.' },
        { q: 'Är ett kvartsprisavtal samma sak som rörligt pris?', a: 'Nej. Med kvartsprisavtal betalar du varje kvarts spotpris och det lönar sig att flytta förbrukning. Med rörligt månadspris betalar du ett snitt för månaden, viktat efter hur alla kunder i elområdet använder el. Energimarknadsbyrån påpekar att den som har fast eller rörligt avtal inte märkte något av övergången till kvartspriser.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.villa.map(({ z, j }) => [z, ...j.map((x) => h.kr(x.kr * v.mo)), v.namn(billigast(j).avtal, true)]);
      return `<h2>Tolv månader för en elvärmd villa, alla elområden</h2>
${h.table(['Elområde', 'Rörligt', 'Fast 1 år', 'Fast 3 år', 'Anvisat', 'Billigast'], rows, `SCB, villa med elvärme, 1 500 kWh per månad, elenergi inkl. moms, ${mn(h, v.fran)} till ${mn(h, v.till)}. Nät och energiskatt ingår inte.`, ['l', 'r', 'r', 'r', 'r', 'l'])}
<p>Ordningen skiftar mellan elområden och mellan år. I söder, där priset svänger mest, avgör en enda dyr vintermånad ofta hela året. Därför är det rimligt att se på mer än ett år.</p>
<h2>Fyra år i SE4: rörligt mot ettårigt fastpris</h2>
${h.table(['År', 'Rörligt, exkl. moms', 'Fast 1 år, exkl. moms'], v.ar.map((x) => [String(x.y), h.ore(x.r), h.ore(x.f)]), 'SCB, villa med elvärme, SE4, snitt av månadspriserna.', ['l', 'r', 'r'])}
<p>I SE4 har det ettåriga fastpriset för nytecknade avtal legat över det rörliga varje år sedan 2022, med störst avstånd just 2022. I efterhand har tryggheten alltså kostat pengar. Det säger inget säkert om nästa vinter, men det visar att ett fast pris inte är ett sätt att betala mindre i snitt.</p>
<h2>Det här säger statistiken inte</h2>
<p>SCB redovisar snitt. Ditt eget påslag och din månadsavgift kan vara högre eller lägre; se ${h.a('paslag', 'påslag och avgifter')}. Ett timpris- eller kvartsprisavtal finns inte som egen grupp i statistiken; läs ${h.a('kvartspris', 'guiden om kvartspris')} för när det lönar sig. Månad för månad finns allt på ${h.a('elpriser-per-manad', 'elpriser per månad')}.</p>`;
    },
  },
  en: {
    slug: 'fixed-or-variable-electricity-price',
    nav: 'Fixed or variable price',
    card: 'What variable, fixed and default contracts cost over the last twelve months.',
    title: 'Fixed or Variable Electricity Price 2026: 12-Month Record',
    description: 'Fixed or variable electricity price in Sweden, 2026: Statistics Sweden prices for variable, 1- and 3-year fixed and default contracts over 12 months, SE1–SE4.',
    h1: 'Fixed or variable electricity price: the record for the last twelve months',
    intro: 'Nobody knows what power will cost next winter, but Statistics Sweden shows what each contract type actually cost.',
    resume: (h) => {
      const v = V(h);
      const s4 = v.villa[3].j;
      const b = billigast(s4);
      const r = s4.find((x) => x.avtal === 'rorligt')!, f = s4.find((x) => x.avtal === 'avtal1ar')!;
      return `For an electrically heated house in SE4 using 1,500 kWh a month, energy over the twelve months from ${mn(h, v.fran)} to ${mn(h, v.till)} cost ${h.kr(r.kr * v.mo)} on a variable contract and ${h.kr(f.kr * v.mo)} on a one-year fixed price, VAT included, according to Statistics Sweden’s figures on what retailers billed. The cheapest was the ${v.namn(b.avtal, false)} contract. These figures cover retail energy only: the grid fee and energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} are the same whatever you sign. The fixed price in the statistics is the average of contracts signed each month, which makes it a fair comparison for a customer who renews every year. Choose zone, home and consumption in the tool to see the ranking for your own case. A variable price can turn expensive in a cold winter; a fixed price pays for certainty.`;
    },
    faqs: (h) => {
      const v = V(h);
      const b = billigast(v.lgh);
      return [
        { q: 'Does a fixed price pay off for a flat in Malmö?', a: `For a flat in SE4 using 200 kWh a month, the ${v.namn(b.avtal, false)} contract was cheapest over the last twelve months per Statistics Sweden, at ${h.kr(b.kr * v.mo)} for energy with VAT. At such low consumption the gaps between contracts are small in kronor; the retailer’s fixed monthly fee may matter more.` },
        { q: 'What happens if I never choose a contract after moving?', a: 'You are placed on a default contract (anvisat avtal) with the retailer your grid company appointed. In Statistics Sweden’s data, the default price has run above the variable price in every zone over the last twelve months, so pick a contract yourself as soon as you can after moving in.' },
        { q: 'Is a quarter-hour contract the same as a variable price?', a: 'No. On a quarter-hour contract (kvartsprisavtal) you pay each quarter’s spot price, so shifting use pays. On a variable monthly price you pay the month’s average, weighted by how all customers in the zone use power. Energimarknadsbyrån notes that fixed and variable customers noticed nothing when quarter-hour prices arrived.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.villa.map(({ z, j }) => [z, ...j.map((x) => h.kr(x.kr * v.mo)), v.namn(billigast(j).avtal, false)]);
      return `<h2>Twelve months for a heated house, every zone</h2>
${h.table(['Zone', 'Variable', 'Fixed 1 yr', 'Fixed 3 yrs', 'Default', 'Cheapest'], rows, `Statistics Sweden, house with electric heating, 1,500 kWh a month, energy incl. VAT, ${mn(h, v.fran)} to ${mn(h, v.till)}. Grid and energy tax not included.`, ['l', 'r', 'r', 'r', 'r', 'l'])}
<p>The ranking shifts between zones and between years. In the south, where prices swing most, a single expensive winter month often decides the whole year, so it makes sense to look beyond one year.</p>
<h2>Four years in SE4: variable against one-year fixed</h2>
${h.table(['Year', 'Variable, before VAT', 'Fixed 1 yr, before VAT'], v.ar.map((x) => [String(x.y), h.ore(x.r), h.ore(x.f)]), 'Statistics Sweden, house with electric heating, SE4, mean of monthly prices.', ['l', 'r', 'r'])}
<p>In SE4 the one-year fixed price for new contracts has been above the variable price every year since 2022, with the widest gap in 2022 itself. In hindsight, certainty has cost money. That says nothing sure about next winter, but it shows a fixed price is not a way to pay less on average.</p>
<h2>What the statistics do not tell you</h2>
<p>Statistics Sweden reports averages. Your own mark-up and monthly fee may be higher or lower; see ${h.a('paslag', 'mark-up and fees')}. Hourly or quarter-hour contracts are not a separate group in the statistics; the guide to ${h.a('kvartspris', 'quarter-hour prices')} covers when they pay. Month by month, everything is on ${h.a('elpriser-per-manad', 'electricity prices by month')}.</p>`;
    },
  },
});
