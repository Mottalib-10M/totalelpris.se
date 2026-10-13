import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Elpriser : historique mensuel SCB (CC0) par zone, rörligt, villa sans chauffage électrique. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const zoner = ['SE1', 'SE2', 'SE3', 'SE4'] as const;
  const ar = [2022, 2023, 2024, 2025, 2026];
  const tab = zoner.map((z) => ({ z, v: ar.map((y) => M.arssnitt('rorligt', z, '2', y)) }));
  const s3 = M.serie('rorligt', 'SE3', '2');
  const top = s3.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lag = s3.filter(([m]) => m >= '2023').reduce((a, b) => (b[1] < a[1] ? b : a));
  const sen = M.senaste('rorligt', 'SE3', '2', 2);
  const forra = M.varde('rorligt', 'SE3', '2', `${Number(M.SENASTE_MANAD.slice(0, 4)) - 1}${M.SENASTE_MANAD.slice(4)}`);
  const antal = M.serie('rorligt', 'SE3', '2').length;
  return { mo, tab, ar, top, lag, sen, forra, antal, se3: M.varde('rorligt', 'SE3', '2')!, se4: M.varde('rorligt', 'SE4', '2')!, se1: M.varde('rorligt', 'SE1', '2')! };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpriser-per-manad',
  group: 'pris',
  order: 30,
  tool: 'historik',
  toolProps: { zon: 'SE3' },
  related: ['fast-eller-rorligt', 'elpris-se3', 'elpris-se4', 'elomraden', 'elrakning'],
  sources: ['scbElpriser', 'scbOppna', 'skvEl'],
  sv: {
    slug: 'elpriser-per-manad',
    nav: 'Elpriser per månad',
    card: 'SCB:s officiella elpriser per månad och elområde sedan 2022.',
    title: 'Elpriser 2026: månad för månad per elområde enligt SCB',
    description: 'Elpriser 2026 per månad: SCB:s officiella pris för rörligt och fast avtal i SE1 till SE4 sedan 2022, årssnitt och dyraste månader. Räkna på din förbrukning.',
    h1: 'Elpriser per månad: vad hushållen faktiskt har betalat',
    intro: 'Månadspriserna kommer från SCB, inte från elbörsen: det är vad elhandlarna fakturerat hushållen.',
    resume: (h) => {
      const v = V(h);
      return `Enligt SCB:s statistik över elpriser och elavtal betalade en villa utan elvärme med rörligt avtal ${h.ore(v.se1)} i SE1, ${h.ore(v.se3)} i SE3 och ${h.ore(v.se4)} i SE4 för elenergin i ${mn(h, h.M.SENASTE_MANAD)}, exklusive moms, energiskatt och nätavgift men med elhandlarens påslag. Det är de priser hushållen faktiskt har fått på fakturan, inte börspriser. Samma månad året innan låg SE3 på ${v.forra !== null ? h.ore(v.forra) : 'okänt'}. Serien börjar 2013 och uppdateras varje månad; den här sidan visar perioden från 2022. Välj elområde, typ av bostad och avtal i verktyget ovan för att se varje månad, årssnittet och vad din egen förbrukning hade kostat. Lägg sedan till nätet och energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} för att få hela priset, eller använd kalkylatorn på startsidan som gör det åt dig.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vilken månad var elen dyrast i SE3 de senaste åren?', a: `I SCB:s serie för en villa utan elvärme med rörligt avtal var ${mn(h, v.top[0])} dyrast med ${h.ore(v.top[1])} exklusive moms, ${h.ore(v.top[1] * v.mo)} med moms. Sedan 2023 var ${mn(h, v.lag[0])} billigast med ${h.ore(v.lag[1])}. Energiskatt och nät kommer ovanpå, så det du betalade för hela kilowattimmen var betydligt mer.` },
        { q: 'Varför skiljer sig SCB:s pris från börspriset jag ser i appen?', a: 'SCB mäter vad elhandlarna har fakturerat hushållen under månaden, påslaget inräknat och viktat efter hur kunderna använt elen. Börspriset i appen är spotpriset för en kvart eller ett dygnssnitt utan påslag. Ett rörligt månadspris följer börsen men hamnar oftast några öre över dess enkla snitt.' },
        { q: 'När kommer nästa månads elpriser från SCB?', a: `SCB publicerar månadsstatistiken med ungefär en månads fördröjning; senaste månad i vår fil är ${mn(h, h.M.SENASTE_MANAD)}. Vi läser in den nya månaden när den publicerats, och siffrorna på sidan uppdateras då automatiskt. Licensen CC0 tillåter att vi återger dem fritt, utan krav på att ange källan.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.tab.map((r) => [r.z, ...r.v.map((x) => (x ? h.ore(x.snitt) : '–'))]);
      return `<h2>Årssnitt per elområde sedan 2022</h2>
${h.table(['Elområde', ...v.ar.map((y) => (y === v.ar[v.ar.length - 1] ? `${y} (hittills)` : String(y)))], rows, 'SCB, rörligt avtal, villa utan elvärme, öre/kWh exkl. moms, energiskatt och nät. Snitt av månadspriserna.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Tabellen visar två mönster. Söder är dyrare än norr varje år, och gapet var som störst under krisåret 2022. Efter 2022 sjönk nivån kraftigt, men hittills under 2026 har priset legat högre än under 2025 i både SE1 och SE4. Ett årssnitt döljer dock vintrarna: se ${h.a('elpris-se4', 'SE4')} för skillnaden mellan vinter och sommar i söder.</p>
<h2>Så läser du siffrorna</h2>
<ul>
<li><strong>Elhandelspris</strong>: det elhandlaren tar per kWh, påslaget med. Moms, energiskatt och nätavgift ingår inte, enligt SCB:s tabellbeskrivning.</li>
<li><strong>Rörligt avtal</strong>: pris som ändras varje månad. <strong>Fast pris</strong>: snittet för avtal som tecknades den månaden. <strong>Anvisat</strong>: priset för den som inte valt något avtal.</li>
<li><strong>Bostad</strong>: SCB delar in i lägenhet, villa utan elvärme och villa med elvärme, och redovisar varje grupp för sig. Välj den som liknar ditt hem.</li>
</ul>
<p>Vill du jämföra avtalen över tolv månader för din förbrukning finns ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')}. För hela fakturan med nät och skatt, se ${h.a('elrakning', 'elräkningen')}.</p>
<h2>Från statistik till ditt totalpris</h2>
<p>Ta månadens pris från verktyget, lägg till din nätoperatörs överföringsavgift och energiskatten, och lägg på 25 procent moms. Med SE3:s senaste pris och en överföringsavgift på 30 öre blir det (${h.num(v.se3, 1)} + 30 + ${h.num(h.P.skatt.energiskatt_ore, 1)}) × 1,25 = ${h.ore((v.se3 + 30 + h.P.skatt.energiskatt_ore) * v.mo)}. Startsidans kalkylator gör det med ditt nätområdes riktiga avgift.</p>`;
    },
  },
  en: {
    slug: 'electricity-prices-by-month',
    nav: 'Prices by month',
    card: 'Statistics Sweden’s official monthly electricity prices by zone since 2022.',
    title: 'Electricity Prices Sweden by Month 2026: SCB, SE1 to SE4',
    description: 'Electricity prices by month, 2026: Statistics Sweden’s official variable and fixed contract prices in SE1 to SE4 since 2022, yearly averages and dearest months.',
    h1: 'Electricity prices by month: what households actually paid',
    intro: 'The monthly prices come from Statistics Sweden, not the exchange: they are what retailers billed households.',
    resume: (h) => {
      const v = V(h);
      return `According to Statistics Sweden’s (SCB) electricity price statistics, a house without electric heating on a variable contract paid ${h.ore(v.se1)} in SE1, ${h.ore(v.se3)} in SE3 and ${h.ore(v.se4)} in SE4 for its energy in ${mn(h, h.M.SENASTE_MANAD)}, before VAT, energy tax and grid fee but including the retailer’s mark-up. These are the prices households actually found on their bills, not exchange prices. The same month a year earlier, SE3 stood at ${v.forra !== null ? h.ore(v.forra) : 'n/a'}. The series starts in 2013 and is updated monthly; this page shows the period from 2022. Choose a zone, home type and contract in the tool above to see each month, the yearly average and what your own consumption would have cost. Then add the grid fee and energy tax of ${h.ore(h.P.skatt.energiskatt_ore)}, or use the calculator on the home page.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Which month was power dearest in SE3 in recent years?', a: `In the SCB series for a house without electric heating on a variable contract, ${mn(h, v.top[0])} was dearest at ${h.ore(v.top[1])} before VAT, ${h.ore(v.top[1] * v.mo)} with VAT. Since 2023, ${mn(h, v.lag[0])} was cheapest at ${h.ore(v.lag[1])}. Energy tax and grid fee come on top.` },
        { q: 'Why does the SCB price differ from the exchange price in my app?', a: 'Statistics Sweden measures what retailers billed households over the month, mark-up included and weighted by how customers used power. The app shows the spot price for one quarter hour or a daily average without any mark-up. A variable monthly price tracks the exchange but usually lands a few öre above its simple average.' },
        { q: 'When does Statistics Sweden publish the next month?', a: `SCB publishes the monthly figures with roughly a month’s delay; the latest month in our file is ${mn(h, h.M.SENASTE_MANAD)}. We load each new month once published, and the figures on this page update automatically. The CC0 licence lets us reproduce them freely.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.tab.map((r) => [r.z, ...r.v.map((x) => (x ? h.ore(x.snitt) : '–'))]);
      return `<h2>Yearly averages by zone since 2022</h2>
${h.table(['Zone', ...v.ar.map((y) => (y === v.ar[v.ar.length - 1] ? `${y} (so far)` : String(y)))], rows, 'Statistics Sweden, variable contract, house without electric heating, öre/kWh before VAT, energy tax and grid. Mean of monthly prices.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Two patterns stand out. The south is dearer than the north every year, with the widest gap in the crisis year of 2022. After 2022 prices fell sharply, but so far in 2026 they have run higher than in 2025 in both SE1 and SE4. A yearly average hides the winters, though: see ${h.a('elpris-se4', 'SE4')} for the winter–summer gap in the south.</p>
<h2>How to read the figures</h2>
<ul>
<li><strong>Retail price</strong> (elhandelspris): what the retailer charges per kWh, mark-up included. VAT, energy tax and grid fee are excluded, as SCB’s table description states.</li>
<li><strong>Variable contract</strong> (rörligt): changes every month. <strong>Fixed price</strong> (fast pris): the average of contracts signed that month. <strong>Default</strong> (anvisat): the price paid by those who never chose a contract.</li>
<li><strong>Home type</strong>: SCB reports flats, houses without electric heating and houses with electric heating separately. Pick the one closest to your home.</li>
</ul>
<p>To compare contracts over twelve months for your consumption, use ${h.a('fast-eller-rorligt', 'fixed or variable price')}. For the whole bill with grid and tax, see ${h.a('elrakning', 'the electricity bill')}.</p>
<h2>From statistics to your all-in price</h2>
<p>Take the month’s price from the tool, add your grid company’s transfer fee and energy tax, then 25% VAT. With SE3’s latest price and a 30 öre transfer fee that gives (${h.num(v.se3, 1)} + 30 + ${h.num(h.P.skatt.energiskatt_ore, 1)}) × 1.25 = ${h.ore((v.se3 + 30 + h.P.skatt.energiskatt_ore) * v.mo)}. The home-page calculator does it with your grid area’s real fee.</p>`;
    },
  },
});
