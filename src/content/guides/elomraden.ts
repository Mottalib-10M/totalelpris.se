import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Elområden : pourquoi quatre zones, comment trouver la sienne, révision en cours, écarts SCB par zone. Faits : faits-taxes.md §7. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const zoner = ['SE1', 'SE2', 'SE3', 'SE4'] as const;
  const ar = [2023, 2024, 2025];
  const tab = zoner.map((z) => ({ z, v: ar.map((y) => M.arssnitt('rorligt', z, '2', y)!.snitt) }));
  const gap = (y: number) => tab[3].v[ar.indexOf(y)] - tab[0].v[ar.indexOf(y)];
  const villa5000 = (y: number) => (gap(y) * mo * 5000) / 100;
  const s1 = M.serie('rorligt', 'SE1', '2'), s4 = M.serie('rorligt', 'SE4', '2');
  const samma = s1.filter(([m, x]) => m >= '2023' && Math.abs((s4.find(([n]) => n === m)?.[1] ?? 0) - x) < 5).length;
  const fast = zoner.map((z) => ({ z, r: M.varde('rorligt', z, '1')!, f: M.varde('avtal1ar', z, '1')!, f3: M.varde('avtal3ar', z, '1')! }));
  return { mo, ar, tab, gap, villa5000, samma, fast, stod: P.elstod.ore_per_kwh as Record<string, number> };
};

export default defineGuide({
  id: 'elomraden',
  group: 'omrade',
  order: 50,
  mini: 'elomraden',
  related: ['elpris-se1', 'elpris-se2', 'elpris-se3', 'elpris-se4', 'spotpris'],
  sources: ['svkElomraden', 'eiElomraden', 'natomraden', 'embElomrade', 'scbElpriser'],
  sv: {
    slug: 'elomraden',
    nav: 'Elområden',
    card: 'Varför Sverige har fyra elområden och hur du hittar ditt.',
    title: 'Elområden 2026: SE1 till SE4, gränserna och prisskillnaden',
    description: 'Elområden 2026: varför Sverige har fyra prisområden sedan 2011, hur du hittar ditt på Nätområden.se, vad som utreds och hur mycket priset skilt per år.',
    h1: 'Elområden: SE1, SE2, SE3 och SE4 och varför priset skiljer',
    intro: 'Sverige har fyra elområden. Det du betalar för elen beror på vilket ditt lokala elnät tillhör.',
    resume: (h) => {
      const v = V(h);
      return `Sverige delades 2011 in i fyra elområden, SE1 till SE4, numrerade från norr till söder. Enligt Svenska kraftnät behövs indelningen för att el ska kunna transporteras från norr till söder utan allvarliga driftstörningar, och gränserna går där det finns strukturella flaskhalsar i stamnätet. Inom ett elområde är spotpriset alltid detsamma. Mellan områdena skiljer det när ledningarna inte räcker till, och i praktiken har söder varit dyrare än norr: under 2025 var SCB:s snitt för rörligt avtal till en villa utan elvärme ${h.ore(v.tab[0].v[2])} i SE1 och ${h.ore(v.tab[3].v[2])} i SE4, exklusive moms. För en villa med 5 000 kWh om året motsvarar skillnaden ${h.kr(v.villa5000(2025))} med moms. Vilket elområde du tillhör bestäms av ditt lokala elnät, inte av länet. Du slår upp det på Nätområden.se, Svenska kraftnäts karta.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Hur vet jag vilket elområde jag bor i?', a: 'Energimarknadsinspektionen och Energimarknadsbyrån hänvisar till Svenska kraftnäts karta på Nätområden.se. Där kan du lista alla lokalnät i en kommun, se vilket elområde ett lokalnät tillhör och vem som äger nätet. Ditt nätområde och nätföretag står också på elnätsfakturan, och elhandlaren behöver veta elområdet för att sätta priset.' },
        { q: 'Kan jag välja att köpa el från ett annat elområde?', a: 'Nej. Priset bestäms av var elen används, alltså av det elområde som din anläggning ligger i. Du kan välja vilken elhandlare du vill i hela landet, men den tar ut spotpriset för ditt eget elområde. Det är också elområdet som avgjorde beloppet i elstödet 2026.' },
        { q: 'Kommer gränserna mellan elområdena att ändras?', a: 'Svenska kraftnät fick i maj 2025 i uppdrag av regeringen att analysera förutsättningarna för att ändra Sveriges elområdesindelning, och uppdraget utökades i maj 2026. Det ska redovisas senast den 29 januari 2027. Någon ändring är inte beslutad. I den europeiska översynen 2025 föreslogs ingen ändring för Sverige.' },
        { q: 'Är priset alltid olika i SE1 och SE4?', a: `Nej. När ledningarna mellan områdena räcker till blir priset detsamma. I SCB:s månadsstatistik låg det rörliga priset i SE1 och SE4 inom fem öre från varandra under ${h.num(v.samma)} av månaderna sedan januari 2023. Under resten av månaderna var söder dyrare, ibland mycket.` },
        { q: 'Varför fick SE4 mest elstöd 2026?', a: `Elstödet för januari och februari 2026 sattes per elområde som en andel av börspriset, och priserna var högst i söder. Därför blev det ${h.num(v.stod.SE4)} öre per kWh i SE4, ${h.num(v.stod.SE3)} öre i SE3 och ${h.num(v.stod.SE1)} öre i SE1 och SE2, med samma tak på 10 000 kWh per bostad.` },
        { q: 'Spelar elområdet roll om jag har fast pris?', a: 'Ja, men bara när du tecknar eller förnyar avtalet. Elhandlarnas fasta priser skiljer sig mellan elområdena, och SCB:s statistik visar att ett ettårigt fastpris i SE4 har legat klart över samma avtal i SE1. Under avtalstiden betalar du sedan det överenskomna priset oavsett hur spotpriset i ditt område rör sig.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.tab.map((r) => [r.z, ...r.v.map((x) => h.ore(x))]);
      return `<h2>Varför Sverige har fyra elområden</h2>
<p>Före 2011 hade Sverige ett enda elpris. Svenska kraftnät beskriver indelningen som ett sätt att kunna transportera el från norr till söder utan allvarliga driftstörningar eller skador på teknisk utrustning. Gränserna lades där stamnätet har strukturella flaskhalsar, det vill säga där överföringskapaciteten begränsar hur mycket el som kan föras vidare söderut. Inom ett elområde är priset på el alltid detsamma, och det baseras på utbud och efterfrågan samt på överföringskapaciteten mellan områdena.</p>
<p>Numreringen följer kartan: SE1 längst i norr, SE4 längst i söder. Energimarknadsinspektionen sammanfattar det så: fyra elområden, med SE1 i norr och SE4 i söder.</p>
<h2>Vilka orter ligger var</h2>
<p>Gränserna följer elnäten, inte kommun- eller länsgränser, och myndigheterna publicerar dem som en karta snarare än som en lista. Enligt Svenska kraftnäts karta på Nätområden.se ligger till exempel nätområdena Luleå, Skellefteå och Boden i SE1, Umeå och Sundsvall i SE2, Stockholm, Göteborg, Uppsala, Linköping och Karlstad i SE3 och Malmö-Burlöv, Lund, Helsingborg, Halmstad, Växjö och Kalmar i SE4. Bor du nära en gräns, slå upp ditt eget nätområde.</p>
<p>Så gör du på Nätområden.se: välj din kommun i listan för att se alla lokalnät där, eller sök på nätområdets namn eller kod, som brukar stå på elnätsfakturan. Sidan visar då vem som äger nätet och vilket elområde det hör till. Samma uppgift behöver du när du jämför elavtal, eftersom elhandlarna sätter priset per elområde.</p>
<h2>Prisskillnaden år för år</h2>
${h.table(['Elområde', ...v.ar.map(String)], rows, 'SCB, rörligt avtal, villa utan elvärme, årssnitt av månadspriser, öre/kWh exkl. moms.', ['l', 'r', 'r', 'r'])}
<p>Skillnaden mellan SE4 och SE1 var ${h.ore(v.gap(2023))} år 2023, ${h.ore(v.gap(2024))} år 2024 och ${h.ore(v.gap(2025))} år 2025, exklusive moms. SE2 ligger nära SE1, och SE3 mellan SE2 och SE4. Mönstret är inte konstant: vissa månader har priset varit nästan detsamma i hela landet, andra har gapet varit stort. Månadsserien för varje område finns på ${h.a('elpriser-per-manad', 'elpriser per månad')}.</p>
<h2>Fasta priser skiljer också mellan områdena</h2>
<p>Det är inte bara det rörliga priset som följer elområdet. Även fastpriserna sätts per elområde, och SCB redovisar dem område för område. Tabellen visar den senaste månaden för en lägenhet.</p>
${h.table(['Elområde', 'Rörligt', 'Fast 1 år', 'Fast 3 år'], v.fast.map((x) => [x.z, h.ore(x.r), h.ore(x.f), h.ore(x.f3)]), `SCB, lägenhet, ${h.M.SENASTE_MANAD}, öre/kWh exkl. moms, energiskatt och nät.`, ['l', 'r', 'r', 'r'])}
<p>Skillnaden mellan områdena syns alltså i alla avtalstyper, inte bara i det rörliga priset. Flyttar du från Luleå till Malmö hamnar du i ett annat elområde med en annan prisnivå; kontrollera i ditt avtal vad som gäller vid flytt innan du säger upp det.</p>
<h2>Vad elområdet påverkar, och vad det inte påverkar</h2>
<ul>
<li><strong>Påverkar</strong>: spotpriset och därmed priset i rörliga avtal och kvartsprisavtal, elhandlarnas erbjudanden om fast pris och beloppet i elstödet 2026.</li>
<li><strong>Påverkar inte</strong>: energiskatten, som beror på kommunen; i några norrlandskommuner finns ett avdrag. Se ${h.a('energiskatt', 'energiskatt på el')}.</li>
<li><strong>Påverkar inte</strong>: nätavgiften, som beror på ditt lokala nätföretag. Två hushåll i samma elområde kan betala helt olika nätavgift; se ${h.a('jamfor-natavgift', 'jämför nätavgiften')}.</li>
</ul>
<h2>Översynen av indelningen</h2>
<p>Den 15 maj 2025 fick Svenska kraftnät i uppdrag av regeringen att analysera förutsättningarna för att ändra Sveriges elområdesindelning. Uppdraget utökades i maj 2026 och ska redovisas till Klimat- och näringslivsdepartementet senast den 29 januari 2027. Parallellt gjordes en europeisk översyn, och enligt Energimarknadsinspektionen föreslogs där inga förändringar av den svenska indelningen. Ändras gränserna kommer det att märkas i ditt spotpris; vi uppdaterar sidorna om varje elområde om det blir aktuellt.</p>
<h2>Elområdet i kalkylatorn</h2>
<p>I kalkylatorn på startsidan väljer du elområde för att få SCB:s senaste snittpris för rörligt avtal som utgångspunkt. Skriver du in ditt eget spotpris spelar valet ingen roll för uträkningen, eftersom priset redan gäller ditt område. Nätområdet väljer du för sig: det bestämmer överföringsavgiften och den fasta avgiften. Sidorna om ${h.a('elpris-se1', 'SE1')}, ${h.a('elpris-se2', 'SE2')}, ${h.a('elpris-se3', 'SE3')} och ${h.a('elpris-se4', 'SE4')} är förinställda med ett stort nät i respektive område.</p>
<p>De kvartspriser du klistrar in måste gälla ditt eget elområde. Kontrollera vilket område appen eller ENTSO-E:s plattform visar innan du kopierar listan, särskilt om du nyligen har flyttat, så att du inte räknar med priser från din gamla bostad eller från ett grannområde.</p>`;
    },
  },
  en: {
    slug: 'bidding-zones-sweden',
    nav: 'Bidding zones',
    card: 'Why Sweden has four bidding zones and how to find yours.',
    title: 'Bidding Zones Sweden 2026: SE1 to SE4, Borders, Price Gaps',
    description: 'Bidding zones in Sweden, 2026: why there are four price areas since 2011, how to find yours on Nätområden.se, the review and how far prices differ by year.',
    h1: 'Bidding zones: SE1, SE2, SE3 and SE4 and why prices differ',
    intro: 'Sweden has four bidding zones (elområden). What you pay depends on which one your local grid belongs to.',
    resume: (h) => {
      const v = V(h);
      return `Sweden was split into four bidding zones (elområden) in 2011, SE1 to SE4, numbered from north to south. According to Svenska kraftnät, the transmission system operator, the split is needed so power can be carried from north to south without serious disturbances, and the borders lie where the national grid has structural bottlenecks. Within a zone the spot price is always the same. Between zones it differs when the lines cannot carry enough, and in practice the south has been dearer than the north: in 2025 the Statistics Sweden average for a variable contract for a house without electric heating was ${h.ore(v.tab[0].v[2])} in SE1 and ${h.ore(v.tab[3].v[2])} in SE4, before VAT. For a house using 5,000 kWh a year that gap is worth ${h.kr(v.villa5000(2025))} with VAT. Your zone is set by your local grid, not your county. Look it up on Nätområden.se, Svenska kraftnät’s map.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'How do I find out which zone I live in?', a: 'The Energy Markets Inspectorate and Energimarknadsbyrån point to Svenska kraftnät’s map on Nätområden.se, where you can list every local grid in a municipality, see which zone a grid belongs to and who owns it. Your grid area and company are also on your grid bill, and your retailer needs the zone to price your power.' },
        { q: 'Can I buy electricity from another zone?', a: 'No. The price follows where the power is used, that is, the zone your connection sits in. You can choose any retailer in the country, but it charges the spot price of your own zone. The zone also determined the amount of the 2026 electricity support.' },
        { q: 'Will the zone borders change?', a: 'In May 2025 the government asked Svenska kraftnät to analyse whether Sweden’s zone split should change; the assignment was widened in May 2026 and is due by 29 January 2027. No change has been decided, and the 2025 European review proposed no change for Sweden.' },
        { q: 'Are SE1 and SE4 prices always different?', a: `No. When the lines between zones suffice, prices are equal. In Statistics Sweden’s monthly data the variable price in SE1 and SE4 was within five öre of each other in ${h.num(v.samma)} months since January 2023. In the remaining months the south was dearer, sometimes by a wide margin.` },
        { q: 'Why did SE4 get the most electricity support in 2026?', a: `The support for January and February 2026 was set per zone as a share of the exchange price, and prices were highest in the south. Hence ${h.num(v.stod.SE4)} öre per kWh in SE4, ${h.num(v.stod.SE3)} öre in SE3 and ${h.num(v.stod.SE1)} öre in SE1 and SE2, with the same 10,000 kWh cap per home.` },
        { q: 'Does the zone matter if I have a fixed price?', a: 'Yes, but only when you sign or renew. Retailers’ fixed prices differ between zones, and Statistics Sweden data shows a one-year fixed price in SE4 well above the same contract in SE1. During the term you pay the agreed price however your zone’s spot price moves.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.tab.map((r) => [r.z, ...r.v.map((x) => h.ore(x))]);
      return `<h2>Why Sweden has four zones</h2>
<p>Before 2011 Sweden had a single electricity price. Svenska kraftnät describes the split as a way to carry power from north to south without serious disturbances or damage to equipment. The borders were drawn where the national grid has structural bottlenecks, where transmission capacity limits how much power can be moved further south. Within a zone the price is always the same, based on supply and demand and on the transmission capacity between zones.</p>
<p>The numbering follows the map: SE1 furthest north, SE4 furthest south. The Energy Markets Inspectorate sums it up as four zones, with SE1 in the north and SE4 in the south.</p>
<h2>Which towns are where</h2>
<p>The borders follow grids, not municipal or county lines, and the authorities publish them as a map rather than a list. On Svenska kraftnät’s map at Nätområden.se, for example, the Luleå, Skellefteå and Boden grid areas are in SE1, Umeå and Sundsvall in SE2, Stockholm, Gothenburg, Uppsala, Linköping and Karlstad in SE3, and Malmö-Burlöv, Lund, Helsingborg, Halmstad, Växjö and Kalmar in SE4. If you live near a border, look up your own grid area.</p>
<h2>The price gap year by year</h2>
${h.table(['Zone', ...v.ar.map(String)], rows, 'Statistics Sweden, variable contract, house without electric heating, yearly average of monthly prices, öre/kWh before VAT.', ['l', 'r', 'r', 'r'])}
<p>The gap between SE4 and SE1 was ${h.ore(v.gap(2023))} in 2023, ${h.ore(v.gap(2024))} in 2024 and ${h.ore(v.gap(2025))} in 2025, before VAT. SE2 sits close to SE1, and SE3 between SE2 and SE4. The pattern is not constant: in some months the price was nearly the same nationwide, in others the gap was large. The monthly series for each zone is on ${h.a('elpriser-per-manad', 'electricity prices by month')}.</p>
<h2>Fixed prices differ between zones too</h2>
<p>It is not only the variable price that follows the zone. Fixed prices are set per zone too, and Statistics Sweden reports them zone by zone. The table shows the latest month for a flat.</p>
${h.table(['Zone', 'Variable', 'Fixed 1 yr', 'Fixed 3 yrs'], v.fast.map((x) => [x.z, h.ore(x.r), h.ore(x.f), h.ore(x.f3)]), `Statistics Sweden, flat, ${h.M.SENASTE_MANAD}, öre/kWh before VAT, energy tax and grid.`, ['l', 'r', 'r', 'r'])}
<p>So the zone gap shows in every contract type, not just the variable price. Moving from Luleå to Malmö puts you in another zone with another price level; check your contract’s moving terms before cancelling.</p>
<h2>What the zone affects, and what it does not</h2>
<ul>
<li><strong>Affects</strong>: the spot price and so the price on variable and quarter-hour contracts, retailers’ fixed-price offers and the amount of the 2026 support.</li>
<li><strong>Does not affect</strong>: energy tax, which depends on the municipality; some northern municipalities have a deduction. See ${h.a('energiskatt', 'energy tax on electricity')}.</li>
<li><strong>Does not affect</strong>: the grid fee, which depends on your local grid company. Two households in the same zone can pay very different grid fees; see ${h.a('jamfor-natavgift', 'compare grid fees')}.</li>
</ul>
<h2>The review of the zones</h2>
<p>On 15 May 2025 the government asked Svenska kraftnät to analyse the conditions for changing Sweden’s bidding-zone split. The assignment was widened in May 2026 and is due to the Ministry of Climate and Enterprise by 29 January 2027. A European review ran in parallel, and according to the Energy Markets Inspectorate it proposed no change to Sweden’s zones. If the borders do move, it will show in your spot price; we will update the zone pages if that happens.</p>
<h2>The zone in the calculator</h2>
<p>In the home-page calculator you pick a zone to get Statistics Sweden’s latest average variable price as a starting point. Once you type your own spot price, the choice no longer affects the sum, because your price already belongs to your zone. You choose the grid area separately: it sets the transfer fee and the fixed fee. The pages on ${h.a('elpris-se1', 'SE1')}, ${h.a('elpris-se2', 'SE2')}, ${h.a('elpris-se3', 'SE3')} and ${h.a('elpris-se4', 'SE4')} come preset with a large grid in each zone.</p>`;
    },
  },
});
