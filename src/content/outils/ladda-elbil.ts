import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Laddning hemma : énergie réseau = batterie × écart de charge ÷ (1 − pertes) ; valeurs par défaut = exemples (aucune donnée officielle). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const E = P.elbil;
  const e = M.hittaEnhet('E.ON Energidistribution', 'Stockholm')!;
  const t = M.natTariff(e, 'V20')!;
  const spot = M.varde('rorligt', 'SE3', '2')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const l = M.laddning({ batteriKwh: E.batteri_kwh, franPct: E.fran_pct, tillPct: E.till_pct, laddeffektKw: E.laddeffekt_kw, forlustPct: E.forlust_pct });
  const l37 = M.laddning({ batteriKwh: E.batteri_kwh, franPct: E.fran_pct, tillPct: E.till_pct, laddeffektKw: 3.7, forlustPct: E.forlust_pct });
  const kostnad = M.kostnadKr(l.franNatet, p.total);
  const mil = l.iBatteriet / E.forbrukning_kwh_mil;
  const tid = (x: number) => `${Math.floor(x)} h ${Math.round((x % 1) * 60)} min`;
  return { E, p, l, l37, kostnad, mil, perMil: kostnad / mil, tid };
};

export default defineGuide({
  id: 'ladda-elbil',
  group: 'apparat',
  order: 70,
  tool: 'elbil',
  toolProps: { nat: 'E.ON Energidistribution|Stockholm', zon: 'SE3', fall: 'V20' },
  related: ['effektavgift', 'kvartspris', 'elpris-imorgon', 'billigaste-tiden', 'natavgift'],
  sources: ['embForbrukning', 'scbElpriser', 'eiNat', 'embKvart'],
  sv: {
    slug: 'ladda-elbil-kostnad',
    nav: 'Ladda elbil hemma',
    card: 'Vad en laddning kostar, hur lång tid den tar och kostnaden per mil.',
    title: 'Ladda elbil hemma 2026: kostnad per laddning och per mil',
    description: 'Ladda elbil hemma 2026: räkna ut vad en laddning kostar med ditt elpris, nät och skatt, hur lång tid den tar med 3,7 eller 11 kW och vad bilen kostar per mil.',
    h1: 'Ladda elbilen hemma: kostnad, laddtid och pris per mil',
    intro: 'Laddkostnaden beror på batteriet, förlusterna och ditt totalpris per kWh. Allt går att räkna ut.',
    resume: (h) => {
      const v = V(h);
      return `En laddning hemma kostar den energi som går från elnätet gånger ditt totalpris per kWh. Med kalkylatorns exempelvärden, ett batteri på ${h.num(v.E.batteri_kwh)} kWh som laddas från ${h.num(v.E.fran_pct)} till ${h.num(v.E.till_pct)} procent och ${h.num(v.E.forlust_pct)} procent förluster i laddningen, går det åt ${h.num(v.l.franNatet, 1)} kWh från nätet för ${h.num(v.l.iBatteriet)} kWh i batteriet. I en villa i E.ON:s Stockholmsområde med 20 ampere och SCB:s snittpris för rörligt avtal i SE3 kostar en kWh ${h.ore(v.p.total)} med nät, skatt och moms. Laddningen kostar då ${h.kr(v.kostnad)}. Med en förbrukning på ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil räcker den ${h.num(v.mil, 1)} mil, och varje mil kostar ${h.kr(v.perMil, 2)}. Med 11 kW tar laddningen ${v.tid(v.l.timmar)}, med 3,7 kW ${v.tid(v.l37.timmar)}. Alla bilvärden är exempel som du byter mot din egen bils.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Hur lång tid tar det att ladda elbilen hemma?', a: `Laddtiden är energin från nätet delad med laddeffekten. I exemplet med ${h.num(v.l.franNatet, 1)} kWh tar det ${v.tid(v.l.timmar)} med 11 kW och ${v.tid(v.l37.timmar)} med 3,7 kW. 11 kW motsvarar ungefär 16 ampere på tre faser och 3,7 kW 16 ampere på en fas. Bilen kan begränsa effekten, och den sjunker de sista procenten.` },
        { q: 'Vad innebär förlusterna vid laddning?', a: 'En del av energin från nätet blir värme i laddboxen, kablarna och bilens laddare och når aldrig batteriet. Vi räknar med ett exempelvärde som du kan ändra; för din bil kan du jämföra energin som elmätaren eller laddboxen visar med den som bilen säger att den laddat. Förlusterna gör att laddningen kostar mer än batteriets storlek antyder.' },
        { q: 'Lönar det sig att ladda på natten?', a: 'Med kvartsprisavtal kan det löna sig, om nattens kvartar är billigare; klistra in priserna så visar kalkylatorn den billigaste starttiden för just din laddtid. Med effektavgift kan det dessutom löna sig att ladda med lägre effekt under längre tid, så att laddningen inte ger månadens topp. Med rörligt månadspris spelar tiden ingen roll för fakturan.' },
        { q: 'Hur mycket el drar en elbil på ett år?', a: `Det beror på hur långt du kör och bilens förbrukning, och det finns inget officiellt snittvärde vi kan stödja oss på. Med exempelvärdet ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil och ${h.num(v.E.forlust_pct)} procent förluster blir 1 500 mil om året ungefär ${h.num((1500 * v.E.forbrukning_kwh_mil) / (1 - v.E.forlust_pct / 100))} kWh från elnätet.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [500, 1000, 1500, 2000].map((mil) => { const kwh = (mil * v.E.forbrukning_kwh_mil) / (1 - v.E.forlust_pct / 100); return [`${h.num(mil)} mil`, `${h.num(kwh)} kWh`, h.kr((kwh * v.p.total) / 100)]; });
      return `<h2>Laddkostnad per år efter körsträcka</h2>
${h.table(['Körsträcka per år', 'El från nätet', 'Kostnad per år'], rows, `Exempel: ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil, ${h.num(v.E.forlust_pct)} % förluster, all laddning hemma. Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE3, E.ON Energidistribution Stockholm, energiskatt.`, ['l', 'r', 'r'])}
<p>Tabellen förutsätter att all laddning sker hemma till samma pris. Laddar du delvis på jobbet eller vid snabbladdare blir kostnaden en annan. Byt förbrukning, förluster och batteri mot din egen bils värden i kalkylatorn ovan.</p>
<h2>Laddeffekt, säkring och effektavgift</h2>
<p>En laddbox på 11 kW drar mycket effekt under flera timmar. I en villa med 16 eller 20 ampere kan det, tillsammans med spis och tvätt, närma sig vad huvudsäkringen klarar, och en elektriker bör bedöma installationen. Har ditt nätföretag en ${h.a('effektavgift', 'effektavgift')} kan laddningen bli månadens topp. Att ladda med lägre effekt, till exempel 3,7 kW, tar längre tid men ger en lägre topp. Energin, och därmed energikostnaden, blir densamma.</p>
<h2>Billigaste laddtiden</h2>
<p>Med ${h.a('kvartspris', 'kvartsprisavtal')} kan du klistra in morgondagens priser i kalkylatorn. Den räknar ut laddtiden från batteriet och effekten och letar upp det billigaste sammanhängande fönstret av den längden. Morgondagens priser blir kända efter auktionen klockan ${h.P.marknad.auktion_kl}; se ${h.a('elpris-imorgon', 'elpris imorgon')}. Ställ sedan in starttiden i bilen eller laddboxen. Nätavgiften per kWh och energiskatten är desamma oavsett tid, om inte ditt nät har olika pris för höglast och låglast.</p>`;
    },
  },
  en: {
    slug: 'ev-charging-cost-at-home',
    nav: 'Charging an EV at home',
    card: 'What a charge costs, how long it takes and the cost per 10 km.',
    title: 'EV Charging Cost at Home 2026: Price per Charge and per Mil',
    description: 'EV charging at home in Sweden, 2026: what a charge costs at your power price, grid fee and tax, how long it takes at 3.7 or 11 kW, and the cost per 10 km.',
    h1: 'Charging an electric car at home: cost, time and price per 10 km',
    intro: 'Charging cost depends on the battery, the losses and your all-in price per kWh. All of it can be worked out.',
    resume: (h) => {
      const v = V(h);
      return `A home charge costs the energy drawn from the grid times your all-in price per kWh. With the calculator’s example values, a ${h.num(v.E.batteri_kwh)} kWh battery charged from ${h.num(v.E.fran_pct)} to ${h.num(v.E.till_pct)} percent with ${h.num(v.E.forlust_pct)} percent charging losses, it takes ${h.num(v.l.franNatet, 1)} kWh from the grid to put ${h.num(v.l.iBatteriet)} kWh into the battery. In a house in E.ON’s Stockholm area with a 20 A fuse, at the Statistics Sweden average variable price for SE3, a kWh costs ${h.ore(v.p.total)} with grid fee, tax and VAT. The charge then costs ${h.kr(v.kostnad)}. At ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil (Swedes count in mil, 10 km) it covers ${h.num(v.mil, 1)} mil, at ${h.kr(v.perMil, 2)} per mil. At 11 kW the charge takes ${v.tid(v.l.timmar)}, at 3.7 kW ${v.tid(v.l37.timmar)}. All car values are examples to replace with your own.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'How long does charging at home take?', a: `Charging time is the energy from the grid divided by the charging power. In the example of ${h.num(v.l.franNatet, 1)} kWh it takes ${v.tid(v.l.timmar)} at 11 kW and ${v.tid(v.l37.timmar)} at 3.7 kW. 11 kW is roughly 16 A on three phases and 3.7 kW is 16 A on one phase. The car may limit power, and it tapers over the last few percent.` },
        { q: 'What do charging losses mean for the cost?', a: 'Part of the energy from the grid becomes heat in the wallbox, cables and the car’s charger and never reaches the battery. We use an example value you can change; for your car, compare the energy shown by the meter or wallbox with what the car says it charged. Losses make a charge cost more than the battery size suggests.' },
        { q: 'Is charging at night cheaper in Sweden?', a: 'On a quarter-hour contract it can be, if that night’s quarters are cheaper; paste the prices and the calculator shows the cheapest start for your charging time. With a power charge, slower charging over a longer period can also pay, so charging does not set the month’s peak. On a variable monthly price, timing does not change the bill.' },
        { q: 'How much electricity does an electric car use in a year?', a: `It depends on how far you drive and the car’s consumption, and there is no official average we can rely on. At the example ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil with ${h.num(v.E.forlust_pct)} percent losses, 1,500 mil (15,000 km) a year is roughly ${h.num((1500 * v.E.forbrukning_kwh_mil) / (1 - v.E.forlust_pct / 100))} kWh from the grid.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [500, 1000, 1500, 2000].map((mil) => { const kwh = (mil * v.E.forbrukning_kwh_mil) / (1 - v.E.forlust_pct / 100); return [`${h.num(mil)} mil (${h.num(mil * 10)} km)`, `${h.num(kwh)} kWh`, h.kr((kwh * v.p.total) / 100)]; });
      return `<h2>Charging cost per year by distance</h2>
${h.table(['Distance per year', 'Power from the grid', 'Cost per year'], rows, `Example: ${h.num(v.E.forbrukning_kwh_mil, 1)} kWh per mil, ${h.num(v.E.forlust_pct)}% losses, all charging at home. All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE3, E.ON Energidistribution Stockholm, energy tax.`, ['l', 'r', 'r'])}
<p>The table assumes every charge happens at home at the same price. Charging partly at work or at fast chargers changes the cost. Replace consumption, losses and battery with your own car’s values in the calculator above.</p>
<h2>Charging power, fuse and power charges</h2>
<p>An 11 kW wallbox draws a lot of power for several hours. In a 16 or 20 A house, together with the hob and laundry, that can approach what the main fuse allows, so an electrician should assess the installation. If your grid company has a ${h.a('effektavgift', 'power charge')}, charging can become the month’s peak. Charging at lower power, say 3.7 kW, takes longer but gives a lower peak, while the energy, and so the energy cost, stays the same.</p>
<h2>The cheapest charging time</h2>
<p>On a ${h.a('kvartspris', 'quarter-hour contract')} you can paste tomorrow’s prices into the calculator. It derives the charging time from the battery and power and finds the cheapest continuous window of that length. Tomorrow’s prices are known after the ${h.P.marknad.auktion_kl} auction; see ${h.a('elpris-imorgon', 'electricity price tomorrow')}. Then set the start time in the car or wallbox. The grid fee per kWh and energy tax are the same whatever the time, unless your grid has peak and off-peak rates.</p>`;
    },
  },
});
