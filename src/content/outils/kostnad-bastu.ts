import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Bastu : aucune valeur officielle de consommation ; énergie = puissance du poêle × durée (plafond, le thermostat coupe). Exemple Umeå (SE2, avdrag). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const a = P.apparater.bastu;
  const e = M.hittaEnhet('Umeå Energi')!;
  const t = M.natTariff(e, 'V20')!;
  const spot = M.varde('rorligt', 'SE2', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const kwh = (kw: number, min: number) => (kw * min) / 60;
  const per = (kw: number, min: number) => M.kostnadKr(kwh(kw, min), p.total);
  return { a, p, kwh, per, kw: a.effekt_kw, min: a.minuter };
};

export default defineGuide({
  id: 'kostnad-bastu',
  group: 'apparat',
  order: 60,
  tool: 'apparat',
  toolProps: { apparat: 'bastu', nat: 'Umeå Energi', zon: 'SE2', fall: 'V20', skatt: 1 },
  related: ['kostnad-dusch', 'elpris-umea', 'effektavgift', 'energiskatt', 'elpris-se2'],
  sources: ['embForbrukning', 'scbElpriser', 'eiNat', 'lse'],
  sv: {
    slug: 'kostnad-bastu',
    nav: 'Elbastu',
    card: 'Vad ett bastubad kostar i el, räknat på aggregatets effekt.',
    title: 'Bastu elförbrukning 2026: vad ett bastubad kostar i el',
    description: 'Elbastu 2026: förbrukningen är aggregatets effekt gånger tiden det är på. Räkna ut vad ett bastubad kostar med ditt elpris, din nätavgift och energiskatten.',
    h1: 'Vad kostar det att bada bastu? Elen räknad på aggregatet',
    intro: 'Det finns inget officiellt värde för en bastu. Men aggregatets effekt och tiden ger ett tak för kostnaden.',
    resume: (h) => {
      const v = V(h);
      return `Det finns inget officiellt värde för hur mycket el en bastu drar, eftersom det beror helt på aggregatet, bastuns storlek och hur länge den är på. Grundregeln från Energimarknadsbyrån räcker ändå långt: en apparat med effekten 1 kW som används en timme förbrukar 1 kWh. Ett aggregat på ${h.num(v.kw)} kW, ett exempel som du byter mot effekten på din egen typskylt, som är på i ${h.num(v.min)} minuter förbrukar alltså högst ${h.num(v.kwh(v.kw, v.min))} kWh. I en villa i Umeå med Umeå Energis nät, den sänkta energiskatten i Västerbotten och SCB:s snittpris för rörligt avtal i SE2 kostar en kWh ${h.ore(v.p.total)}, och badet högst ${h.kr(v.per(v.kw, v.min), 2)}. Termostaten slår av och på när bastun är varm, så den verkliga förbrukningen blir lägre än taket. Två bad i veckan blir som mest ${h.kr(v.per(v.kw, v.min) * 2 * 52)} om året.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Var hittar jag effekten på mitt bastuaggregat?', a: 'På aggregatets typskylt och i manualen, angiven i kilowatt. Effekten är det aggregatet drar när elementen är på. Skriv in den i kalkylatorn tillsammans med hur länge bastun är på, inklusive uppvärmningstiden. Resultatet blir ett tak, eftersom termostaten stänger av elementen när bastun har nått rätt temperatur.' },
        { q: 'Påverkar bastun min effektavgift?', a: `Den kan göra det. Ett aggregat på ${h.num(v.kw)} kW som är på samtidigt som spisen, tvättmaskinen eller elbilsladdningen kan ge månadens högsta effekt. Har ditt nätföretag en effektavgift, undvik att värma bastun när andra stora apparater går. Hur effekten mäts står i nätföretagets prislista.` },
        { q: 'Är det billigare att värma bastun på natten?', a: 'Bara med kvartsprisavtal, och bara om du badar då. Bastun måste värmas strax före badet, så den kan sällan flyttas som en tvätt eller en laddning. Med rörligt månadspris eller fast pris spelar tiden ingen roll för priset per kWh. Det som sänker kostnaden mest är kortare uppvärmning och att inte låta bastun stå på i onödan.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [[4.5, 60], [6, 60], [6, 90], [8, 90]].map(([kw, min]) => [`${h.num(kw, 1)} kW, ${min} min`, `${h.num(v.kwh(kw, min), 1)} kWh`, h.kr(v.per(kw, min), 2), h.kr(v.per(kw, min) * 52)]);
      return `<h2>Tak för kostnaden per bad</h2>
${h.table(['Aggregat och tid', 'Energi högst', 'Per bad högst', 'Ett bad i veckan, per år'], rows, `Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE2 villa med elvärme, Umeå Energi Elnät, energiskatt ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. Effekter och tider är exempel.`, ['l', 'r', 'r', 'r'])}
<p>Tabellen visar taket, när elementen är på hela tiden. När bastun har nått rätt temperatur slår termostaten av och på, och då är förbrukningen lägre. Hur mycket lägre beror på bastuns isolering, storlek och hur ofta dörren öppnas, och det finns inget officiellt schablonvärde att räkna med. Vill du veta exakt kan du läsa av elmätaren före och efter ett bad, när inget annat stort går i huset.</p>
<h2>Bastun i norr och söder</h2>
<p>I Umeå gör den sänkta energiskatten på ${h.ore(h.P.skatt.energiskatt_sankt_ore)} och det lägre spotpriset i SE2 att ett bastubad kostar mindre än samma bad i södra Sverige. I SE4 med full energiskatt, ${h.ore(h.P.skatt.energiskatt_ore)}, och södra Sveriges spotpris blir priset per kWh högre. Välj ditt eget nätområde i kalkylatorn för att se skillnaden, och läs mer i ${h.a('energiskatt', 'energiskatt på el')}.</p>
<h2>Uppvärmningen är den största delen</h2>
<p>Den tid då aggregatet arbetar oavbrutet är uppvärmningen från rumstemperatur. Därför kostar en bastu som värms upp för ett kort bad nästan lika mycket som en som får stå på en stund till. Den som badar flera i följd utnyttjar samma uppvärmning. Effektavgiften, om ditt nät har en, påverkas av att aggregatet drar full effekt just under uppvärmningen; se ${h.a('effektavgift', 'effektavgift')}. Jämför med ${h.a('kostnad-dusch', 'duschen')}, som också kostar el om varmvattnet värms med el.</p>`;
    },
  },
  en: {
    slug: 'sauna-electricity-cost',
    nav: 'Electric sauna',
    card: 'What a sauna session costs in electricity, from the heater’s power.',
    title: 'Sauna Electricity Cost 2026: What One Session Costs in Power',
    description: 'Electric sauna in Sweden, 2026: consumption is the heater’s power times the time it is on. Work out what a session costs with your price, grid fee and tax.',
    h1: 'What does a sauna cost? Electricity worked out from the heater',
    intro: 'There is no official figure for a sauna. But the heater’s power and the time give a ceiling for the cost.',
    resume: (h) => {
      const v = V(h);
      return `There is no official figure for how much power a sauna uses, because it depends entirely on the heater, the size of the sauna and how long it is on. Energimarknadsbyrån’s basic rule still goes a long way: a 1 kW appliance used for one hour consumes 1 kWh. A ${h.num(v.kw)} kW heater, an example you replace with the power on your own rating plate, that is on for ${h.num(v.min)} minutes therefore uses at most ${h.num(v.kwh(v.kw, v.min))} kWh. In a house in Umeå on Umeå Energi’s grid, with Västerbotten’s reduced energy tax and the Statistics Sweden average variable price for SE2, a kWh costs ${h.ore(v.p.total)}, and the session at most ${h.kr(v.per(v.kw, v.min), 2)}. The thermostat switches the elements on and off once the sauna is hot, so real use falls below that ceiling. Two sessions a week come to at most ${h.kr(v.per(v.kw, v.min) * 2 * 52)} a year.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Where do I find my sauna heater’s power?', a: 'On the heater’s rating plate and in the manual, given in kilowatts. That is what the heater draws when the elements are on. Enter it in the calculator together with how long the sauna is on, heating-up time included. The result is a ceiling, since the thermostat cuts the elements once the sauna reaches temperature.' },
        { q: 'Does the sauna affect my power charge?', a: `It can. A ${h.num(v.kw)} kW heater running while the hob, washer or car charger is on can set the month’s highest load. If your grid company has a power charge, avoid heating the sauna while other large appliances run. How the load is measured is in your grid company’s price list.` },
        { q: 'Is it cheaper to heat the sauna at night?', a: 'Only on a quarter-hour contract, and only if you bathe then. The sauna has to be heated just before use, so it can rarely be shifted like a wash or a car charge. On a variable monthly or fixed price, timing does not change the price per kWh. Shorter heating and not leaving it on needlessly cut the cost most.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [[4.5, 60], [6, 60], [6, 90], [8, 90]].map(([kw, min]) => [`${h.num(kw, 1)} kW, ${min} min`, `${h.num(v.kwh(kw, min), 1)} kWh`, h.kr(v.per(kw, min), 2), h.kr(v.per(kw, min) * 52)]);
      return `<h2>The ceiling per session</h2>
${h.table(['Heater and time', 'Energy at most', 'Per session at most', 'One a week, per year'], rows, `All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE2 heated house, Umeå Energi Elnät, energy tax ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. Powers and times are examples.`, ['l', 'r', 'r', 'r'])}
<p>The table shows the ceiling, with the elements on all the time. Once the sauna reaches temperature the thermostat cycles, and use falls. How far depends on insulation, size and how often the door opens, and there is no official standard figure to use. To know exactly, read the electricity meter before and after a session while nothing else large is running.</p>
<h2>A sauna in the north and in the south</h2>
<p>In Umeå, the reduced energy tax of ${h.ore(h.P.skatt.energiskatt_sankt_ore)} and the lower SE2 spot price make a session cheaper than the same one in southern Sweden. In SE4, with full energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and southern spot prices, the price per kWh is higher. Choose your own grid area in the calculator to see the gap, and read more in ${h.a('energiskatt', 'energy tax on electricity')}.</p>
<h2>Heating up is the biggest part</h2>
<p>The heater works continuously while it brings the room up from normal temperature. So a sauna heated for a short session costs almost as much as one left on a while longer, and several people bathing in turn share the same heating. A power charge, if your grid has one, is affected because the heater draws full power during exactly that phase; see ${h.a('effektavgift', 'power charges')}. Compare with the ${h.a('kostnad-dusch', 'shower')}, which also costs electricity when hot water is heated electrically.</p>`;
    },
  },
});
