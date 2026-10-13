import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Elstöd : aide 2026 (janvier-février), högkostnadsskydd, hiver 2026–2027, aides 2021–2022. Faits : research/faits-taxes.md §3. */
const V = (h: Helpers) => {
  const E = h.P.elstod;
  const o = E.ore_per_kwh as Record<string, number>;
  const ex = (z: string, kwh: number) => (Math.min(kwh, E.tak_kwh) * o[z]) / 100;
  return { E, o, ex, max4: ex('SE4', E.tak_kwh), max1: ex('SE1', E.tak_kwh) };
};

export default defineGuide({
  id: 'elstod',
  group: 'guide',
  order: 20,
  mini: 'elstod',
  related: ['elpris-se4', 'elpris-se3', 'energiskatt', 'fast-eller-rorligt', 'elrakning'],
  sources: ['regElstod', 'fkElstod', 'fkElstod2022', 'bp2026'],
  sv: {
    slug: 'elstod',
    nav: 'Elstöd 2026',
    card: 'Stödet för januari och februari 2026, högkostnadsskyddet och vintern 2026–2027.',
    title: 'Elstöd 2026: 14 till 29 öre per kWh, vem fick och hur mycket',
    description: 'Elstöd 2026: 14 öre i SE1 och SE2, 26 öre i SE3 och 29 öre i SE4 per kWh för januari och februari, högst 10 000 kWh. Utbetalning, regler och vad som gäller nu.',
    h1: 'Elstöd 2026: belopp per elområde, utbetalning och vad som gäller nu',
    intro: 'Elstödet för vintern 2026 är utbetalt. Här är beloppen, villkoren och läget inför nästa vinter.',
    resume: (h) => {
      const v = V(h);
      return `Elstödet 2026 gällde hushållens elförbrukning i januari och februari 2026 och betalades ut av Försäkringskassan från början av juni, utan ansökan, till den som stod på avtalet med elnätsföretaget den 28 februari 2026. Beloppet var ${h.num(v.o.SE1)} öre per kWh i SE1 och SE2, ${h.num(v.o.SE3)} öre i SE3 och ${h.num(v.o.SE4)} öre i SE4, för högst ${h.num(v.E.tak_kwh)} kWh per bostad. Ett hushåll i SE4 som nådde taket fick alltså ${h.kr(v.max4)}, i SE1 ${h.kr(v.max1)}. Regeringens egna exempel: en villa i SE3 med 6 400 kWh fick omkring 1 660 kronor och en lägenhet i SE4 med 750 kWh omkring 217 kronor. Därutöver finns ett högkostnadsskydd under 2026 om spotpriset i ett elområde i snitt överstiger ${h.num(v.E.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh under en månad. Inget stöd är beslutat för vintern 2026–2027.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Jag har inte fått elstödet, vad gör jag?', a: 'Försäkringskassan skriver att de allra flesta har fått stödet och att de som kompletterat sina uppgifter sent får pengarna veckovis från slutet av augusti 2026. Stödet går till kontot i Swedbanks kontoregister. Saknas det, kontrollera att ditt konto är anmält och kontakta Försäkringskassan.' },
        { q: 'Vem fick elstödet om vi flyttade i februari 2026?', a: 'Den som stod på avtalet med elnätsföretaget den 28 februari 2026 fick pengarna för bostaden, beräknade på förbrukningen i januari och februari. Flyttade ni in före det datumet fick ni alltså stödet även för den tidigare boendes förbrukning i januari; flyttade ni ut fick den nya hyresgästen det.' },
        { q: 'Varför fick SE4 mer elstöd än SE1?', a: `Stödet sattes som en andel av genomsnittspriset på elbörsen, cirka 15 till 25 procent enligt regeringen, och priserna i januari och februari 2026 var högre i söder. Därför blev beloppet ${h.num(v.o.SE4)} öre i SE4 mot ${h.num(v.o.SE1)} öre i SE1. Taket på ${h.num(v.E.tak_kwh)} kWh var detsamma i hela landet.` },
        { q: 'Blir det elstöd vintern 2026–2027?', a: `Inget sådant stöd var beslutat i oktober ${h.P.year}. Högkostnadsskyddet gäller enligt regeringen hela ${h.P.year}, och budgetpropositionen för ${h.P.year} räknade inte med några medel för 2027. Budgeten för 2027 hade inte lagts fram. Vi uppdaterar sidan när regeringen eller riksdagen beslutar något nytt.` },
        { q: 'Påverkar elstödet priset per kWh på fakturan?', a: 'Nej. Stödet betalades ut i efterhand som ett belopp till ditt bankkonto. Elhandlarens pris, nätavgiften och energiskatten på fakturan var oförändrade. Därför ingår stödet inte i kalkylatorns totalpris; räkna det som en engångsinbetalning när du jämför vad vintern kostade dig totalt.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = (['SE1', 'SE2', 'SE3', 'SE4'] as const).map((z) => [z, `${h.num(v.o[z])} öre`, h.kr(v.ex(z, 750)), h.kr(v.ex(z, 6400)), h.kr(v.ex(z, v.E.tak_kwh))]);
      return `<h2>Belopp per elområde</h2>
${h.table(['Elområde', 'Per kWh', 'Lägenhet 750 kWh', 'Villa 6 400 kWh', 'Taket 10 000 kWh'], rows, 'Regeringen, frågor och svar om det tillfälliga el- och gasstödet, uppdaterad juli 2026. Förbrukning i januari och februari 2026.', ['l', 'r', 'r', 'r', 'r'])}
<p>Beloppen i tabellen är förbrukningen gånger beloppet per kWh, upp till taket. Regeringens exempel stämmer med dem: en villa i SE1 eller SE2 med 7 900 kWh fick omkring 1 100 kronor och en lägenhet med 750 kWh i SE1 och SE2 omkring 105 kronor. Stödet räknades på all förbrukning i bostaden, inte bara på uppvärmning.</p>
<h2>Så betalades stödet ut</h2>
<ol>
<li>Elnätsföretagen lämnade uppgifter om förbrukningen i januari och februari 2026 och om vem som stod på avtalet den 28 februari.</li>
<li>Försäkringskassan betalade ut pengarna från början av juni 2026 till det konto som finns i Swedbanks kontoregister. De flesta fick dem före midsommar.</li>
<li>Den som saknade registrerat konto eller behövde komplettera fick pengarna senare; enligt Försäkringskassan sker utbetalningarna veckovis från slutet av augusti 2026.</li>
</ol>
<p>Hushåll som värms med gas från det västsvenska gasnätet fick ett motsvarande stöd på hösten 2026, via gasnätsföretagen.</p>
<h2>Räkna själv, steg för steg</h2>
<p>Du behöver bara två uppgifter: din förbrukning i januari och februari 2026, som står på elnätsföretagets fakturor eller i nätföretagets kundportal, och ditt elområde. Lägg ihop de två månaderna, jämför med taket och multiplicera.</p>
<ol>
<li>Förbrukning i januari plus februari, till exempel 2 100 + 1 900 = 4 000 kWh.</li>
<li>Är summan över ${h.num(v.E.tak_kwh)} kWh räknas bara ${h.num(v.E.tak_kwh)}. Här räknas alla 4 000.</li>
<li>Gånger beloppet för elområdet: i SE3 ${h.num(v.o.SE3)} öre, alltså 4 000 × ${h.num(v.o.SE3)} öre = ${h.kr(v.ex('SE3', 4000))}.</li>
</ol>
<p>Stämmer inte beloppet du fick med din egen uträkning är det oftast förbrukningen som skiljer, till exempel om mätaravläsningen för februari var preliminär. Elnätsföretaget kan visa vilken förbrukning det rapporterade.</p>
<h2>Vanliga missförstånd om elstödet</h2>
<ul>
<li><strong>Elhandlaren betalar inte stödet.</strong> Det är kopplat till avtalet med elnätsföretaget, och pengarna kommer från Försäkringskassan, inte på elräkningen.</li>
<li><strong>Taket gäller per bostad.</strong> ${h.num(v.E.tak_kwh)} kWh är gränsen för hela bostaden, inte per person som bor där.</li>
<li><strong>Elområdet avgör beloppet, inte länet.</strong> En bostad i ett nätområde som hör till SE3 fick ${h.num(v.o.SE3)} öre även om grannkommunen ligger i SE4. Ditt nätområde kan du slå upp på Nätområden.se.</li>
<li><strong>Gas räknades för sig.</strong> Gasstödet till hushåll på det västsvenska gasnätet betalades av gasnätsföretagen på hösten, med samma belopp per kWh som i SE4.</li>
</ul>
<h2>Högkostnadsskyddet under 2026</h2>
<p>I budgetpropositionen för ${h.P.year} avsatte regeringen ${h.kr(v.E.hogkostnadsskydd_budget_kr)} för ett högkostnadsskydd. Det ska gälla om månadsmedelvärdet för spotpriset i ett elområde överstiger ${h.num(v.E.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh, och regeringen skriver att skyddet ligger kvar under hela ${h.P.year}. Exakt hur ett sådant stöd skulle räknas ut har vi inte kunnat läsa i någon förordning, och vi har inte hittat någon officiell uppgift om att det har betalats ut. Vi beskriver därför inga belopp.</p>
<h2>Tidigare elstöd 2021–2022</h2>
<p>Försäkringskassan betalade ut två tidigare elstöd. Det första gällde förbrukningen från 1 oktober 2021 till 30 september 2022 i södra halvan av Sverige och gick till den som stod på elnätsavtalet den 17 november 2022. Det andra gällde hela landet för november och december 2022, gick till den som hade avtalet den 31 december 2022 och täckte ${h.num(v.E.stod_2021_2022_andel * 100)} procent av förbrukningen upp till ${h.num(v.E.stod_2022_tak_kwh)} kWh. Förordningarna upphörde vid utgången av 2023.</p>
<h2>Vad stödet betydde för vinterns kostnad</h2>
<p>Ett stöd per kWh i efterhand sänker inte priset när du använder elen, men det sänker vad vintern kostade totalt. För en elvärmd villa i SE4 med 3 000 kWh i januari och 3 000 i februari gav stödet ${h.kr(v.ex('SE4', 6000))}. Jämför med vad samma förbrukning kostar med ${h.a('energiskatt', 'energiskatt')} och moms, eller använd ${h.a('elrakning', 'kalkylatorn för elräkningen')} med vinterns förbrukning.</p>
<h2>Elstödet jämfört med skattesänkningen</h2>
<p>Samma år sänktes energiskatten från ${h.ore(h.P.skatt.energiskatt_2025_ore)} till ${h.ore(h.P.skatt.energiskatt_ore)}, vilket med moms är ${h.ore((h.P.skatt.energiskatt_2025_ore - h.P.skatt.energiskatt_ore) * (1 + h.P.skatt.moms))} mindre för varje kWh under hela året. För en elvärmd villa med 20 000 kWh om året blir det ${h.kr((20000 * (h.P.skatt.energiskatt_2025_ore - h.P.skatt.energiskatt_ore) * (1 + h.P.skatt.moms)) / 100)}. Elstödet för samma villa i SE3, med 6 400 kWh i januari och februari, var ${h.kr(v.ex('SE3', 6400))}. Skattesänkningen gäller alltså varje månad och syns direkt på nätfakturan, medan stödet kom en enda gång och i efterhand. För en lägenhet med låg förbrukning var båda beloppen små; för en elvärmd villa i söder var de tillsammans värda flera tusen kronor under året.</p>
<p>Den som vill skydda sig mot nästa vinter utan att vänta på stöd kan se på ${h.a('fast-eller-rorligt', 'fast eller rörligt pris')}; SCB:s statistik visar vad avtalen har kostat.</p>`;
    },
  },
  en: {
    slug: 'electricity-support-sweden',
    nav: 'Electricity support 2026',
    card: 'The January–February 2026 support, the high-cost protection and winter 2026–27.',
    title: 'Elstöd 2026: Electricity Support of 14 to 29 öre per kWh',
    description: 'Elstöd 2026, Sweden’s electricity support: 14 öre in SE1 and SE2, 26 öre in SE3, 29 öre in SE4 per kWh for January–February, capped at 10,000 kWh, and rules.',
    h1: 'Electricity support 2026: amounts by zone, payment and current status',
    intro: 'The support for winter 2026 has been paid. Here are the amounts, the conditions and the outlook for next winter.',
    resume: (h) => {
      const v = V(h);
      return `Sweden’s 2026 electricity support (elstöd) covered household consumption in January and February 2026 and was paid by Försäkringskassan, the social insurance agency, from early June with no application, to whoever held the contract with the grid company on 28 February 2026. It was ${h.num(v.o.SE1)} öre per kWh in SE1 and SE2, ${h.num(v.o.SE3)} öre in SE3 and ${h.num(v.o.SE4)} öre in SE4, for at most ${h.num(v.E.tak_kwh)} kWh per home. A household in SE4 reaching the cap therefore received ${h.kr(v.max4)}, in SE1 ${h.kr(v.max1)}. The government’s own examples: a house in SE3 using 6,400 kWh received about 1,660 kronor and a flat in SE4 using 750 kWh about 217 kronor. There is also a high-cost protection during 2026 if the monthly average spot price in a zone exceeds ${h.num(v.E.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh. No support has been decided for winter 2026–2027.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'I never received the 2026 support. What now?', a: 'Försäkringskassan says nearly everyone has been paid and that those who completed their details late receive the money weekly from late August 2026. It goes to the account in Swedbank’s account register (kontoregistret). If it is missing, check that your account is registered and contact Försäkringskassan.' },
        { q: 'Who got the support if we moved during February 2026?', a: 'Whoever held the grid contract for the home on 28 February 2026 received it, based on that home’s January and February consumption. If you moved in before that date you received it even for the previous occupant’s January use; if you moved out, the new tenant did.' },
        { q: 'Why did SE4 get more support than SE1?', a: `The amounts were set as a share of the average exchange price, about 15 to 25 percent according to the government, and January–February 2026 prices were higher in the south. Hence ${h.num(v.o.SE4)} öre in SE4 against ${h.num(v.o.SE1)} öre in SE1. The ${h.num(v.E.tak_kwh)} kWh cap was the same nationwide.` },
        { q: 'Will there be support for winter 2026–2027?', a: `None had been decided as of October ${h.P.year}. According to the government the high-cost protection applies throughout ${h.P.year}, and the ${h.P.year} budget bill set aside nothing for 2027. The 2027 budget had not yet been presented. We will update this page if the government or parliament decides anything new.` },
        { q: 'Does the support change the price per kWh on my bill?', a: 'No. It was paid afterwards as a sum into your bank account. The retailer’s price, the grid fee and energy tax on the bill were unchanged. That is why the calculator’s all-in price leaves it out; count it as a one-off payment when you compare what the winter cost.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = (['SE1', 'SE2', 'SE3', 'SE4'] as const).map((z) => [z, `${h.num(v.o[z])} öre`, h.kr(v.ex(z, 750)), h.kr(v.ex(z, 6400)), h.kr(v.ex(z, v.E.tak_kwh))]);
      return `<h2>Amounts by bidding zone</h2>
${h.table(['Zone', 'Per kWh', 'Flat 750 kWh', 'House 6,400 kWh', 'Cap 10,000 kWh'], rows, 'Government Q&A on the temporary electricity and gas support, updated July 2026. Consumption in January and February 2026.', ['l', 'r', 'r', 'r', 'r'])}
<p>The amounts are consumption times the rate per kWh, up to the cap. The government’s examples match: a house in SE1 or SE2 using 7,900 kWh received about 1,100 kronor and a flat using 750 kWh in SE1 or SE2 about 105 kronor. The support was based on all consumption in the home, not just heating.</p>
<h2>How it was paid</h2>
<ol>
<li>Grid companies reported each home’s January and February 2026 consumption and who held the contract on 28 February.</li>
<li>Försäkringskassan paid from early June 2026 into the account held in Swedbank’s account register. Most households had it before Midsummer.</li>
<li>Those without a registered account, or who had to complete their details, were paid later; Försäkringskassan says payments go out weekly from late August 2026.</li>
</ol>
<p>Households heated by gas from the west Swedish gas grid received an equivalent support in autumn 2026, through the gas grid companies.</p>
<h2>Work it out yourself, step by step</h2>
<p>You need two facts: your consumption in January and February 2026, shown on the grid company’s bills or in its customer portal, and your bidding zone. Add the two months, compare with the cap and multiply.</p>
<ol>
<li>January plus February consumption, for example 2,100 + 1,900 = 4,000 kWh.</li>
<li>If the sum is above ${h.num(v.E.tak_kwh)} kWh, only ${h.num(v.E.tak_kwh)} counts. Here all 4,000 count.</li>
<li>Times the zone rate: in SE3 ${h.num(v.o.SE3)} öre, so 4,000 × ${h.num(v.o.SE3)} öre = ${h.kr(v.ex('SE3', 4000))}.</li>
</ol>
<p>If the amount you received differs from your own sum, the consumption figure is usually the reason, for instance a provisional February meter reading. The grid company can show what consumption it reported.</p>
<h2>Common misunderstandings</h2>
<ul>
<li><strong>The retailer does not pay it.</strong> It is tied to the grid contract, and the money comes from Försäkringskassan, not via the bill.</li>
<li><strong>The cap is per home.</strong> ${h.num(v.E.tak_kwh)} kWh is the limit for the whole home, not per resident.</li>
<li><strong>The zone sets the rate, not the county.</strong> A home in a grid area belonging to SE3 received ${h.num(v.o.SE3)} öre even if the next municipality is in SE4. Look up your grid area on Nätområden.se.</li>
<li><strong>Gas was separate.</strong> Households on the west Swedish gas grid were paid by the gas grid companies in the autumn, at the same rate per kWh as SE4.</li>
</ul>
<h2>The high-cost protection during 2026</h2>
<p>In the ${h.P.year} budget bill the government set aside ${h.kr(v.E.hogkostnadsskydd_budget_kr)} for a high-cost protection (högkostnadsskydd). It applies if the monthly average spot price in a zone exceeds ${h.num(v.E.hogkostnadsskydd_kr_per_kwh, 2)} kronor per kWh, and the government states it remains in place throughout ${h.P.year}. We have not been able to read in any ordinance exactly how such support would be calculated, nor found an official statement that it has been paid. We therefore give no amounts.</p>
<h2>Earlier supports, 2021–2022</h2>
<p>Försäkringskassan paid two earlier supports. The first covered consumption from 1 October 2021 to 30 September 2022 in the southern half of Sweden and went to whoever held the grid contract on 17 November 2022. The second covered the whole country for November and December 2022, went to the contract holder on 31 December 2022 and covered ${h.num(v.E.stod_2021_2022_andel * 100)} percent of consumption up to ${h.num(v.E.stod_2022_tak_kwh)} kWh. The ordinances lapsed at the end of 2023.</p>
<h2>What the support meant for the winter’s cost</h2>
<p>A per-kWh payment made afterwards does not lower the price when you use the power, but it lowers what the winter cost in total. For an electrically heated house in SE4 using 3,000 kWh in January and 3,000 in February, the support came to ${h.kr(v.ex('SE4', 6000))}. Compare that with what the same use costs with ${h.a('energiskatt', 'energy tax')} and VAT, or put the winter consumption into the ${h.a('elrakning', 'electricity bill calculator')}.</p>
<h2>The support compared with the tax cut</h2>
<p>The same year energy tax fell from ${h.ore(h.P.skatt.energiskatt_2025_ore)} to ${h.ore(h.P.skatt.energiskatt_ore)}, which with VAT is ${h.ore((h.P.skatt.energiskatt_2025_ore - h.P.skatt.energiskatt_ore) * (1 + h.P.skatt.moms))} less on every kWh all year. For an electrically heated house using 20,000 kWh a year that is ${h.kr((20000 * (h.P.skatt.energiskatt_2025_ore - h.P.skatt.energiskatt_ore) * (1 + h.P.skatt.moms)) / 100)}. The support for the same house in SE3, using 6,400 kWh in January and February, was ${h.kr(v.ex('SE3', 6400))}. The tax cut works every month and shows on the bill; the support came once, afterwards.</p>
<p>If you would rather protect yourself against next winter than wait for support, look at ${h.a('fast-eller-rorligt', 'fixed or variable pricing')}; Statistics Sweden data shows what each contract type has cost.</p>`;
    },
  },
});
