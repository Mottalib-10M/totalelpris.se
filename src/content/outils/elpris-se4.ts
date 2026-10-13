import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** SE4 : sud (Malmö-Burlöv, Lund, Helsingborg, Halmstad, Växjö, Kalmar selon Nätområden.se) ; angle : pics d'hiver et 2022. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const s = M.serie('rorligt', 'SE4', '3');
  const top3 = [...s].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const lag = s.reduce((a, b) => (b[1] < a[1] ? b : a));
  const vinter = s.filter(([m]) => /M(01|02|12)$/.test(m) && m >= '2023');
  const sommar = s.filter(([m]) => /M(06|07|08)$/.test(m) && m >= '2023');
  const avg = (x: Array<[string, number]>) => x.reduce((a, [, y]) => a + y, 0) / x.length;
  const e = M.hittaEnhet('E.ON Energidistribution', 'Syd')!;
  const t = M.natTariff(e, 'V20')!;
  const spot = M.varde('rorligt', 'SE4', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const stod = P.elstod.ore_per_kwh.SE4;
  return { mo, top3, lag, vinter: avg(vinter), sommar: avg(sommar), t, spot, p, stod };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-se4',
  group: 'omrade',
  order: 40,
  tool: 'pris',
  toolProps: { nat: 'E.ON Energidistribution|Syd', zon: 'SE4', fall: 'V20' },
  related: ['elpris-malmo', 'elpris-lund', 'elpris-helsingborg', 'elstod', 'elpris-se3'],
  sources: ['scbElpriser', 'natomraden', 'eiNat', 'regElstod'],
  sv: {
    slug: 'elpris-se4',
    nav: 'Elpris SE4 (Malmö)',
    card: 'Södra Sverige: högsta priserna, störst skillnad mellan vinter och sommar.',
    title: 'Elpris SE4 2026: totalpris i Malmö och Skåne per kWh',
    description: 'Elpris SE4 2026: södra Sveriges rörliga pris enligt SCB, vinter mot sommar, E.ON:s nätavgift och elstödet på 29 öre. Räkna ut ditt totalpris per kWh med moms.',
    h1: 'Elpris i SE4: södra Sveriges pris, vinter mot sommar',
    intro: 'SE4 är det sydligaste elområdet, med Skåne, Blekinge och södra Småland, och oftast det dyraste.',
    resume: (h) => {
      const v = V(h);
      return `I SE4 kostade elhandeln med rörligt avtal ${h.ore(v.spot)} exklusive moms för en elvärmd villa i ${mn(h, h.M.SENASTE_MANAD)}, enligt SCB, den högsta nivån av de fyra elområdena. Prisskillnaden mellan årstiderna är också störst här: sedan 2023 har vintermånaderna december till februari i snitt kostat ${h.ore(v.vinter)} och sommarmånaderna juni till augusti ${h.ore(v.sommar)}, exklusive moms. Elområdet omfattar enligt Svenska kraftnäts karta bland annat nätområdena Malmö-Burlöv, Lund, Helsingborg, Halmstad, Växjö och Kalmar. Med E.ON Energidistributions nät för en villa med 20 ampere, energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms blir totalpriset ${h.ore(v.p.total)}. För en elvärmd villa i SE4 betyder det att vinterns räkning kan bli flera gånger sommarens; kalkylatorn visar månaden för din förbrukning och ditt eget nät, med de fasta avgifterna inräknade.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Varför är elen dyrast i SE4?', a: 'Svenska kraftnät förklarar att elområdena finns för att el ska kunna föras från norr till söder utan driftstörningar, och att gränserna går där det finns flaskhalsar i näten. När ledningarna söderut är fullt utnyttjade kan priset i söder inte pressas ner av billigare el från norr. Inom ett elområde är priset alltid detsamma.' },
        { q: 'Hur mycket elstöd fick hushåll i SE4 för vintern 2026?', a: `${h.num(v.stod)} öre per kWh för förbrukningen i januari och februari 2026, det högsta beloppet av elområdena, upp till ${h.num(h.P.elstod.tak_kwh)} kWh per bostad. Regeringens exempel: en villa med 6 400 kWh fick omkring 1 850 kronor. Försäkringskassan betalade ut pengarna från juni.` },
        { q: 'Vilken månad var elen dyrast i SE4?', a: `I SCB:s serie för en elvärmd villa med rörligt avtal var ${mn(h, v.top3[0][0])} dyrast med ${h.ore(v.top3[0][1])} exklusive moms, följd av ${mn(h, v.top3[1][0])} och ${mn(h, v.top3[2][0])}. Den billigaste månaden var ${mn(h, v.lag[0])} med ${h.ore(v.lag[1])}. Skillnaden visar hur mycket priset i söder svänger.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const vinterKr = (v.vinter * v.mo * 3000) / 100, sommarKr = (v.sommar * v.mo * 800) / 100;
      return `<h2>Vinter och sommar för en elvärmd villa i Skåne</h2>
${h.table(['Period', 'Rörligt, exkl. moms', 'Elhandel för en månad, inkl. moms'], [['Vinter (dec–feb), snitt sedan 2023', h.ore(v.vinter), `${h.kr(vinterKr)} för 3 000 kWh`], ['Sommar (jun–aug), snitt sedan 2023', h.ore(v.sommar), `${h.kr(sommarKr)} för 800 kWh`]], 'SCB, villa med elvärme, SE4. Förbrukningen är exempel; nät och energiskatt tillkommer.', ['l', 'r', 'r'])}
<p>För en elvärmd villa samverkar två saker på vintern: priset per kWh är högre och förbrukningen kanske fyra gånger större. Energimarknadsbyrån anger att elvärmda småhus vintertid ofta använder 100 till 150 kWh per dygn eller mer. Därför slår prisnivån i SE4 hårdare mot villaägare än mot lägenheter, och därför betyder valet mellan ${h.a('fast-eller-rorligt', 'fast och rörligt')} mest just här.</p>
<h2>De tre dyraste månaderna sedan 2022</h2>
${h.table(['Månad', 'Rörligt, exkl. moms', 'Inkl. moms'], v.top3.map(([m, x]) => [mn(h, m), h.ore(x), h.ore(x * v.mo)]), 'SCB, villa med elvärme, SE4.', ['l', 'r', 'r'])}
<p>År 2022 rymmer toppen i hela serien. Det första elstödet gällde förbrukningen från oktober 2021 till september 2022 och omfattade bara södra halvan av landet. Vintern 2026 fick SE4 åter det högsta stödet per kWh, ${h.num(v.stod)} öre; se ${h.a('elstod', 'elstöd')} för reglerna.</p>
<h2>Nätavgifterna i söder</h2>
<p>E.ON Energidistributions område Syd och Mellersta tar för en villa med 20 ampere ${h.kr(v.t.fastKrPerAr * v.mo)} om året i fast avgift och ${h.ore(v.t.rorligOre * v.mo)} med moms. Lund har ett annat nät, Kraftringen, och Helsingborg Öresundskraft: jämför ${h.a('elpris-malmo', 'Malmö')}, ${h.a('elpris-lund', 'Lund')} och ${h.a('elpris-helsingborg', 'Helsingborg')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-se4',
    nav: 'Price SE4 (Malmö)',
    card: 'Southern Sweden: highest prices, widest gap between winter and summer.',
    title: 'Electricity Price SE4 2026: All-in in Malmö and Skåne',
    description: 'Electricity price SE4 2026: southern Sweden’s variable price per Statistics Sweden, winter against summer, E.ON’s grid fee and the 29 öre support, per kWh.',
    h1: 'Electricity price in SE4: southern Sweden, winter against summer',
    intro: 'SE4 is the southernmost zone, covering Skåne, Blekinge and southern Småland, and usually the most expensive.',
    resume: (h) => {
      const v = V(h);
      return `In SE4 the variable retail price for an electrically heated house was ${h.ore(v.spot)} before VAT in ${mn(h, h.M.SENASTE_MANAD)}, according to Statistics Sweden, the highest of Sweden’s four bidding zones. The seasonal swing is widest here too: since 2023 the winter months December to February have averaged ${h.ore(v.vinter)} and the summer months June to August ${h.ore(v.sommar)}, before VAT. On Svenska kraftnät’s map the zone includes grid areas such as Malmö-Burlöv, Lund, Helsingborg, Halmstad, Växjö and Kalmar. With E.ON Energidistribution’s grid for a 20 A house, energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT, the all-in price is ${h.ore(v.p.total)}. For a heated house in SE4 that means a winter bill can be several times the summer one; the calculator shows the month for your consumption.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Why is electricity most expensive in SE4?', a: 'Svenska kraftnät explains that the zones exist so power can be moved from north to south without disturbances, with borders where the grid has bottlenecks. When the lines southwards are fully used, cheaper northern power cannot pull southern prices down. Within one zone the price is always the same.' },
        { q: 'How much support did SE4 households get for winter 2026?', a: `${h.num(v.stod)} öre per kWh for January and February 2026 consumption, the highest of the zones, up to ${h.num(h.P.elstod.tak_kwh)} kWh per home. The government’s own example: a house using 6,400 kWh received about 1,850 kronor, paid by Försäkringskassan from June without any application.` },
        { q: 'Which month was electricity dearest in SE4?', a: `In the Statistics Sweden series for a heated house on a variable contract, ${mn(h, v.top3[0][0])} was dearest at ${h.ore(v.top3[0][1])} before VAT, followed by ${mn(h, v.top3[1][0])} and ${mn(h, v.top3[2][0])}. The cheapest month was ${mn(h, v.lag[0])} at ${h.ore(v.lag[1])}, which shows how far southern prices swing.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const vinterKr = (v.vinter * v.mo * 3000) / 100, sommarKr = (v.sommar * v.mo * 800) / 100;
      return `<h2>Winter and summer for a heated house in Skåne</h2>
${h.table(['Period', 'Variable, before VAT', 'Energy for one month, incl. VAT'], [['Winter (Dec–Feb), average since 2023', h.ore(v.vinter), `${h.kr(vinterKr)} for 3,000 kWh`], ['Summer (Jun–Aug), average since 2023', h.ore(v.sommar), `${h.kr(sommarKr)} for 800 kWh`]], 'Statistics Sweden, house with electric heating, SE4. Consumption figures are examples; grid and energy tax come on top.', ['l', 'r', 'r'])}
<p>For an electrically heated house two things combine in winter: a higher price per kWh and perhaps four times the consumption. Energimarknadsbyrån notes that such houses often use 100 to 150 kWh a day or more in winter. That is why SE4 price levels hit house owners harder than flats, and why the choice between ${h.a('fast-eller-rorligt', 'fixed and variable')} matters most here.</p>
<h2>The three dearest months since 2022</h2>
${h.table(['Month', 'Variable, before VAT', 'Incl. VAT'], v.top3.map(([m, x]) => [mn(h, m), h.ore(x), h.ore(x * v.mo)]), 'Statistics Sweden, house with electric heating, SE4.', ['l', 'r', 'r'])}
<p>The year 2022 holds the peak of the whole series. The first electricity support covered consumption from October 2021 to September 2022 and applied only to the southern half of the country. In winter 2026 SE4 again received the highest support per kWh, ${h.num(v.stod)} öre; see ${h.a('elstod', 'electricity support')} for the rules.</p>
<h2>Grid fees in the south</h2>
<p>E.ON Energidistribution’s Syd och Mellersta area charges a 20 A house ${h.kr(v.t.fastKrPerAr * v.mo)} a year in fixed fees and ${h.ore(v.t.rorligOre * v.mo)} with VAT. Lund is on another grid, Kraftringen, and Helsingborg on Öresundskraft: compare ${h.a('elpris-malmo', 'Malmö')}, ${h.a('elpris-lund', 'Lund')} and ${h.a('elpris-helsingborg', 'Helsingborg')}.</p>`;
    },
  },
});
