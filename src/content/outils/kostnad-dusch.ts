import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Dusch : 5 minutes à 10 l/min = 1,25 à 1,50 kWh (Energimyndigheten), valable si l'eau chaude est électrique ; exemple Luleå (SE1, avdrag). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const a = P.apparater.dusch;
  const e = M.hittaEnhet('Luleå Energi')!;
  const t = M.natTariff(e, 'V16')!;
  const spot = M.varde('rorligt', 'SE1', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_sankt_ore, momsSats: P.skatt.moms });
  const per = (kwh: number) => M.kostnadKr(kwh, p.total);
  const perMin = a.max_kwh / 5;
  const spot4 = M.varde('rorligt', 'SE4', '3')!;
  const sthlm = M.natTariff(M.hittaEnhet('E.ON Energidistribution', 'Syd')!, 'V16')!;
  const p4 = M.totalpris({ spot: spot4, natOverforing: sthlm.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  return { a, p, per, perMin, p4, per4: (kwh: number) => M.kostnadKr(kwh, p4.total) };
};

export default defineGuide({
  id: 'kostnad-dusch',
  group: 'apparat',
  order: 40,
  tool: 'apparat',
  toolProps: { apparat: 'dusch', nat: 'Luleå Energi', zon: 'SE1', fall: 'V16', skatt: 1 },
  related: ['kostnad-bastu', 'elpris-lulea', 'energiskatt', 'elpris-se1', 'kostnad-tvattmaskin'],
  sources: ['emSpara', 'scbElpriser', 'eiNat', 'lse'],
  sv: {
    slug: 'kostnad-dusch',
    nav: 'Dusch',
    card: 'Vad en dusch kostar när varmvattnet värms med el.',
    title: 'Dusch elförbrukning 2026: vad en dusch kostar med elberedare',
    description: 'Vad kostar en dusch i el 2026? 5 minuter med 10 liter i minuten är 1,25 till 1,50 kWh enligt Energimyndigheten, om varmvattnet värms med el. Räkna på din dusch.',
    h1: 'Vad kostar en dusch? Elen för varmvattnet räknad per gång',
    intro: 'Duschen kostar el bara om varmvattnet värms med el. Då kan det bli en av hushållets större poster.',
    resume: (h) => {
      const v = V(h);
      return `En dusch på fem minuter med ett duschmunstycke som släpper ut tio liter i minuten motsvarar 1,25 till 1,50 kWh, enligt Energimyndigheten. Det gäller när varmvattnet värms med el, till exempel i en varmvattenberedare; har du fjärrvärme eller annan värmekälla för varmvattnet kostar duschen dig ingen el. I en villa i Luleå, med Luleå Energis nät, den sänkta energiskatten i Norrbotten och SCB:s snittpris för rörligt avtal i SE1, kostar varje kilowattimme ${h.ore(v.p.total)}. En dusch kostar då mellan ${h.kr(v.per(v.a.min_kwh), 2)} och ${h.kr(v.per(v.a.max_kwh), 2)}. Duschar två personer varje dag blir det ${h.kr(v.per(v.a.max_kwh) * 14 * 52)} om året. Samma dusch i en villa i Malmö med E.ON:s nät och full energiskatt kostar ${h.kr(v.per4(v.a.max_kwh), 2)}. Ange din egen förbrukning per dusch och ditt eget nät i kalkylatorn.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Hur mycket sparar jag på att duscha kortare?', a: `Med Energimyndighetens värden motsvarar varje duschminut med tio liter i minuten ungefär ${h.num(v.perMin, 2)} kWh. Till priset ${h.ore(v.p.total)} blir det ${h.kr(v.per(v.perMin), 2)} per minut. Två minuter kortare dusch varje dag för en person sparar då ${h.kr(v.per(v.perMin * 2) * 365)} om året, och lika mycket till för varje person i hushållet.` },
        { q: 'Kostar duschen el om jag har fjärrvärme?', a: 'Nej, inte för varmvattnet. Med fjärrvärme värms vattnet av fjärrvärmen, som du betalar för separat eller via hyran. Duschen påverkar då inte elräkningen. Kalkylatorn gäller när varmvattnet värms med el i en beredare eller med en värmepump; med värmepump blir elförbrukningen lägre än Energimyndighetens värde.' },
        { q: 'Spelar ett snålspolande munstycke roll?', a: 'Ja. Energimyndighetens räkneexempel bygger på ett flöde på tio liter i minuten. Med lägre flöde går det åt mindre varmt vatten för samma duschtid, och därmed mindre energi om vattnet värms med el. Flödet för ditt munstycke kan stå på förpackningen eller kan mätas med en hink och en klocka.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 2, 3, 4].map((n) => [`${n}`, h.kr(v.per(v.a.max_kwh) * n * 365), h.kr(v.per4(v.a.max_kwh) * n * 365)]);
      return `<h2>Duschar per dag och årskostnad i norr och söder</h2>
${h.table(['Personer, en dusch per dag', 'Luleå (SE1, sänkt skatt)', 'Malmö (SE4)'], rows, `1,50 kWh per dusch enligt Energimyndigheten. Luleå: SCB rörligt SE1 villa med elvärme, Luleå Energi Elnät, energiskatt ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. Malmö: SCB rörligt SE4, E.ON Syd och Mellersta, energiskatt ${h.ore(h.P.skatt.energiskatt_ore)}. Moms inräknad.`, ['l', 'r', 'r'])}
<p>För ett hushåll med elberedare är varmvattnet en verklig post. Skillnaden mellan Luleå och Malmö kommer från tre håll: lägre spotpris i SE1, avdraget på energiskatten i Norrbotten och olika nätavgift. För samma dusch blir priset i söder ungefär ${h.pct(v.p4.total / v.p.total - 1, 0)} högre.</p>
<h2>Varmvattenberedaren och tiden</h2>
<p>En elberedare värmer vattnet när termostaten slår till, inte när du duschar. Har du kvartsprisavtal och en beredare som kan styras med timer kan uppvärmningen läggas på billiga perioder, och då är det tiden för uppvärmningen som räknas i kalkylatorn. Med effektavgift kan det också vara klokt att inte låta beredaren gå samtidigt som andra stora laster; se ${h.a('effektavgift', 'effektavgift')}.</p>
<h2>Andra sätt att värma vattnet</h2>
<p>Har du värmepump som också värmer varmvattnet blir elförbrukningen lägre än Energimyndighetens värde, eftersom pumpen hämtar en del av värmen från luften, marken eller vattnet; hur mycket beror på pumpen. Har du fjärrvärme eller pellets kostar duschen ingen el. Skriv in den förbrukning som stämmer för ditt hem. Jämför gärna med ${h.a('kostnad-bastu', 'bastun')}, som också drar mycket el de stunder den används.</p>`;
    },
  },
  en: {
    slug: 'shower-electricity-cost',
    nav: 'Shower',
    card: 'What a shower costs when the hot water is heated by electricity.',
    title: 'Shower Electricity Cost 2026: Price per Shower, Water Heater',
    description: 'What does a shower cost in electricity in Sweden, 2026? Five minutes at 10 litres a minute is 1.25 to 1.50 kWh per the Energy Agency, with electric hot water.',
    h1: 'What does a shower cost? The electricity for hot water, per shower',
    intro: 'A shower costs electricity only if your hot water is heated electrically. Then it can be one of the larger items.',
    resume: (h) => {
      const v = V(h);
      return `A five-minute shower with a head delivering ten litres a minute equals 1.25 to 1.50 kWh, according to the Swedish Energy Agency. That applies when the hot water is heated by electricity, for example in an electric water heater (varmvattenberedare); with district heating or another heat source for hot water, the shower costs you no electricity. In a house in Luleå on Luleå Energi’s grid, with Norrbotten’s reduced energy tax and the Statistics Sweden average variable price for SE1, each kilowatt-hour costs ${h.ore(v.p.total)}. One shower then costs between ${h.kr(v.per(v.a.min_kwh), 2)} and ${h.kr(v.per(v.a.max_kwh), 2)}. Two people showering daily comes to ${h.kr(v.per(v.a.max_kwh) * 14 * 52)} a year. The same shower in a Malmö house on E.ON’s grid with full energy tax costs ${h.kr(v.per4(v.a.max_kwh), 2)}. Enter your own use per shower in the calculator.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'How much do I save by taking shorter showers?', a: `With the Swedish Energy Agency’s figures, each shower minute at ten litres a minute is about ${h.num(v.perMin, 2)} kWh. At ${h.ore(v.p.total)} that is ${h.kr(v.per(v.perMin), 2)} a minute. Two minutes less every day for one person saves ${h.kr(v.per(v.perMin * 2) * 365)} a year, and the same again for each other person in the home.` },
        { q: 'Does a shower cost electricity with district heating?', a: 'No, not for the hot water. With district heating (fjärrvärme) the water is heated by the district system, paid separately or through the rent, so the shower does not affect the electricity bill. The calculator applies when hot water is heated electrically in a tank or by a heat pump; with a heat pump the electricity use is below the agency’s figure.' },
        { q: 'Does a low-flow shower head make a difference?', a: 'Yes. The Swedish Energy Agency’s example assumes a flow of ten litres a minute. A lower flow uses less hot water for the same shower time, and so less energy if the water is heated electrically. Your head’s flow may be printed on the packaging, or can be measured with a bucket and a watch.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [1, 2, 3, 4].map((n) => [`${n}`, h.kr(v.per(v.a.max_kwh) * n * 365), h.kr(v.per4(v.a.max_kwh) * n * 365)]);
      return `<h2>Showers per day and yearly cost, north and south</h2>
${h.table(['People, one shower a day', 'Luleå (SE1, reduced tax)', 'Malmö (SE4)'], rows, `1.50 kWh per shower per the Swedish Energy Agency. Luleå: Statistics Sweden variable SE1 heated house, Luleå Energi Elnät, energy tax ${h.ore(h.P.skatt.energiskatt_sankt_ore)}. Malmö: Statistics Sweden variable SE4, E.ON Syd och Mellersta, energy tax ${h.ore(h.P.skatt.energiskatt_ore)}. VAT included.`, ['l', 'r', 'r'])}
<p>For a household with an electric water heater, hot water is a real item. The gap between Luleå and Malmö comes from three sources: a lower spot price in SE1, the energy-tax deduction in Norrbotten and a different grid fee. For the same shower the southern price is roughly ${h.pct(v.p4.total / v.p.total - 1, 0)} higher.</p>
<h2>The water heater and timing</h2>
<p>An electric water heater heats when its thermostat switches on, not when you shower. With a quarter-hour contract and a heater on a timer, heating can be moved into cheap periods, and it is the heating time that counts in the calculator. With a power charge it can also be wise not to run the heater alongside other large loads; see ${h.a('effektavgift', 'power charges')}.</p>
<h2>Other ways of heating water</h2>
<p>If a heat pump also heats your hot water, electricity use is below the agency’s figure, because the pump draws part of the heat from the air, ground or water; how much depends on the pump. With district heating or pellets the shower costs no electricity. Enter the consumption that fits your home. Compare with the ${h.a('kostnad-bastu', 'sauna')}, which also draws a lot of power while it is on.</p>`;
    },
  },
});
