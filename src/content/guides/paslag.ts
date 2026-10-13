import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Påslag et redevances de l'elhandlare : marge par kWh, redevance fixe, elcertifikat (Energimarknadsbyrån, Energimyndigheten). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const kost = (kwh: number, paslag: number, arsavg: number) => (kwh * paslag * mo) / 100 + arsavg;
  const rorl = M.varde('rorligt', 'SE3', '1')!, anv = M.varde('anvisat', 'SE3', '1')!;
  const cert = P.marknad.elcertifikat_ore_2023;
  const brytpunkt = (300 * 100) / ((8 - 3) * mo);
  const ex = M.totalpris({ spot: rorl, paslag: 5, natOverforing: 25, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  return { mo, kost, rorl, anv, cert, f: P.forbrukning, brytpunkt, ex };
};

export default defineGuide({
  id: 'paslag',
  group: 'guide',
  order: 50,
  mini: 'paslag',
  related: ['fast-eller-rorligt', 'elrakning', 'kvartspris', 'spotpris', 'natavgift'],
  sources: ['embElrakning', 'embKvart', 'emElcert', 'emElcertSlut', 'scbElpriser'],
  sv: {
    slug: 'paslag-och-avgifter',
    nav: 'Påslag och avgifter',
    card: 'Elhandlarens påslag, månadsavgift och elcertifikat, och vad de kostar per år.',
    title: 'Påslag el 2026: elhandlarens avgifter och vad de kostar dig',
    description: 'Påslag på el 2026: elhandlarens marginal per kWh, årsavgiften på 100 till 500 kr enligt Energimarknadsbyrån och elcertifikaten. Räkna ut kostnaden per år.',
    h1: 'Påslag och avgifter: det elhandlaren tar utöver spotpriset',
    intro: 'Spotpriset är detsamma hos alla elhandlare. Skillnaden mellan dem ligger i påslaget och avgifterna.',
    resume: (h) => {
      const v = V(h);
      return `Med ett rörligt avtal eller ett kvartsprisavtal betalar du spotpriset för ditt elområde, och det är detsamma oavsett vilken elhandlare du väljer. Det som skiljer elhandlarna åt är vad de tar utöver det: ett påslag per kilowattimme och ofta en fast årsavgift. Energimarknadsbyrån anger att årsavgiften brukar uppgå till cirka 100 till 500 kronor per år, och att moms tillkommer på samtliga kostnader. En del av kostnaden kan också bestå av en avgift för elcertifikat, som elhandlarna är skyldiga att köpa i förhållande till kundernas förbrukning; enligt Energimyndigheten var kostnaden i genomsnitt ${h.num(v.cert, 1)} öre per kWh år 2023. Ett påslag på 5 öre exklusive moms kostar en villa med ${h.num(v.f.villa_elvarme)} kWh om året ${h.kr(v.kost(v.f.villa_elvarme, 5, 0))}; samma påslag kostar en lägenhet med ${h.num(v.f.lagenhet_liten)} kWh ${h.kr(v.kost(v.f.lagenhet_liten, 5, 0))}. Räkna med dina egna siffror i kalkylatorn nedan.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vad är ett rimligt påslag på elpriset?', a: 'Det finns inget fastställt rimligt påslag; elhandlarna bestämmer det själva och det står i avtalet. Jämför därför påslag och årsavgift tillsammans för din egen förbrukning. För en lägenhet med låg förbrukning väger den fasta årsavgiften tyngst, för en elvärmd villa påslaget per kWh. Mini-kalkylatorn räknar ut båda.' },
        { q: 'Ingår elcertifikaten i påslaget?', a: `Det varierar. Energimarknadsbyrån skriver att elhandelsföretagen är skyldiga att köpa elcertifikat i förhållande till kundernas förbrukning, men själva bestämmer hur stor avgiften är och hur den tas ut. Den kan alltså ingå i påslaget eller stå som en egen rad. Energimyndigheten anger ${h.num(v.cert, 1)} öre per kWh i snitt för 2023.` },
        { q: 'Försvinner elcertifikatsystemet snart?', a: 'Systemet började 2003 och ska enligt nuvarande regler pågå till 2035. I juni 2026 fick Energimyndigheten i uppdrag att föreslå ändringar så att systemet kan avslutas redan 2029; uppdraget ska redovisas senast den 16 november 2026. Något beslut om ett tidigare slut fanns inte i oktober 2026.' },
        { q: 'Varför är anvisat avtal dyrare än rörligt?', a: `Det anvisade avtalet får du när du inte valt elhandlare, och priset sätts av den elhandlare som nätföretaget anvisat. I SCB:s statistik för SE3 låg det för en lägenhet på ${h.ore(v.anv)} exklusive moms senaste månaden, mot ${h.ore(v.rorl)} för rörligt avtal. Skillnaden motsvarar ett högre påslag.` },
        { q: 'Lönar det sig att byta elhandlare för några öre i påslag?', a: `För en elvärmd villa med ${h.num(v.f.villa_elvarme)} kWh om året är varje öre i påslag värt ${h.kr(v.kost(v.f.villa_elvarme, 1, 0))} om året med moms, för en lägenhet med ${h.num(v.f.lagenhet_liten)} kWh bara ${h.kr(v.kost(v.f.lagenhet_liten, 1, 0))}. Kontrollera uppsägningstiden i ditt nuvarande avtal och om ett fast pris löper, innan du byter. Bytet görs hos den nya elhandlaren.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [[h.num(v.f.lagenhet_liten), h.kr(v.kost(v.f.lagenhet_liten, 3, 300)), h.kr(v.kost(v.f.lagenhet_liten, 8, 0))], [h.num(v.f.villa_utan_elvarme), h.kr(v.kost(v.f.villa_utan_elvarme, 3, 300)), h.kr(v.kost(v.f.villa_utan_elvarme, 8, 0))], [h.num(v.f.villa_elvarme), h.kr(v.kost(v.f.villa_elvarme, 3, 300)), h.kr(v.kost(v.f.villa_elvarme, 8, 0))]];
      return `<h2>Vad elhandlaren tar betalt för</h2>
<p>Energimarknadsbyrån beskriver elhandelsdelen av räkningen som elpriset enligt ditt avtal, i många fall en fast årsavgift, eventuellt en elcertifikatsavgift, och moms på allt. Med kvartsprisavtal betalar du enligt byrån spotpriset för den el du använder plus elhandlarens påslag och moms. Med rörligt månadspris är det månadens snitt plus påslag. Med fast pris är påslaget inbakat i det fasta priset och syns inte som en egen rad.</p>
<p>Elhandlare och nätföretag får enligt Energimarknadsbyrån inte ta ut någon fakturaavgift eller avgift för fakturaunderlag. Det du betalar utöver energin är alltså påslag, årsavgift och eventuellt elcertifikat.</p>
<h2>Två avtal, tre hushåll</h2>
${h.table(['kWh per år', 'Påslag 3 öre + årsavgift 300 kr', 'Påslag 8 öre utan årsavgift'], rader, 'Exempel. Påslag exkl. moms, moms 25 % tillagd; årsavgiften inkl. moms. Förbrukning enligt Energimarknadsbyrån.', ['l', 'r', 'r'])}
<p>Tabellen visar varför det inte går att säga vilket avtal som är billigast utan att veta förbrukningen. För en liten lägenhet är avtalet utan årsavgift billigast trots det högre påslaget. För den elvärmda villan är det tvärtom. Var gränsen går för just dig räknar mini-kalkylatorn ut.</p>
<h2>Var gränsen går mellan två avtal</h2>
<p>Mellan avtalet med 3 öre i påslag och 300 kronor i årsavgift och avtalet med 8 öre och ingen avgift går gränsen vid ${h.num(v.brytpunkt)} kWh om året. Under den förbrukningen är avtalet utan avgift billigast; över den lönar sig det lägre påslaget. Räkningen är enkel: skillnaden i påslag, 5 öre plus moms, gånger förbrukningen ska bli lika stor som årsavgiften. Samma resonemang gäller alla par av erbjudanden. Byt ut siffrorna mot dem du har framför dig, så ser du vilket som passar din bostad. Tänk också på att förbrukningen kan ändras: skaffar du elbil eller värmepump flyttas gränsen, och då kan ett annat avtal bli billigast.</p>
<h2>Påslagets andel av totalpriset</h2>
<p>Med SCB:s snittpris för rörligt avtal för en lägenhet i SE3, ett påslag på 5 öre, en överföringsavgift på 25 öre och energiskatten blir totalpriset ${h.ore(v.ex.total)} med moms. Påslaget står då för ${h.ore(5 * v.mo)} av det, alltså ${h.pct((5 * v.mo) / v.ex.total, 0)}. Det är litet, men det är en av få delar av räkningen där valet är ditt. Den fasta årsavgiften slår däremot hårdare mot små förbrukare: 300 kronor om året på 2 000 kWh motsvarar 15 öre per kWh.</p>
<h2>Elcertifikat 2026</h2>
<p>Elcertifikatsystemet ska stödja förnybar elproduktion. Elhandlarna måste köpa certifikat i proportion till sina kunders förbrukning, och kostnaden förs vidare till kunderna. Energimyndigheten anger att den genomsnittliga kostnaden var ${h.num(v.cert, 1)} öre per kWh år 2023, en liten del av elpriset. Den 1 januari 2026 ändrades lagen och förordningen om elcertifikat, och i juni 2026 fick Energimyndigheten i uppdrag att föreslå hur systemet kan avslutas redan 2029 i stället för 2035. Om systemet avslutas tidigare försvinner kostnaden från elhandlarnas prissättning; när det sker beror på beslut som ännu inte fattats.</p>
<h2>Så hittar du påslaget i ditt avtal</h2>
<ol>
<li>Leta efter ordet påslag, tillägg eller fast påslag i avtalsvillkoren eller på Mina sidor hos elhandlaren. Det anges i öre per kWh, med eller utan moms; kontrollera vilket.</li>
<li>Leta efter en årsavgift, fast avgift eller månadsavgift. Räkna om en månadsavgift till ett år genom att multiplicera med tolv.</li>
<li>Kontrollera om elcertifikat står som en egen rad på fakturan eller ingår i påslaget.</li>
<li>Lägg in påslaget i fältet för påslag i ${h.a('home', 'kalkylatorn på startsidan')} för att se ditt totalpris.</li>
</ol>
<h2>Påslag och anvisat avtal</h2>
<p>Den som flyttar in och inte väljer elhandlare får ett anvisat avtal. SCB:s statistik visar att det anvisade priset i SE3 senaste månaden var ${h.ore(v.anv)} exklusive moms för en lägenhet, mot ${h.ore(v.rorl)} för rörligt avtal. För en lägenhet med ${h.num(v.f.lagenhet_liten)} kWh om året motsvarar skillnaden ${h.kr((v.anv - v.rorl) * v.mo * v.f.lagenhet_liten / 100)} med moms. Att välja ett avtal själv är alltså ett av de enklaste sätten att sänka elhandelsdelen av räkningen. Vad de olika avtalstyperna har kostat visar ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')}.</p>
<h2>Påslaget i förhållande till hela räkningen</h2>
<p>Ett påslag på några öre låter litet bredvid energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} eller nätets överföringsavgift. Men till skillnad från dem kan du påverka det genom att byta elhandlare eller avtal. Skatten och nätavgiften är desamma oavsett elhandlare, så varje jämförelse mellan elhandlare handlar i praktiken om påslag, avgifter och avtalstyp. Se ${h.a('elrakning', 'elräkningen')} för hur alla delar läggs ihop, och ${h.a('natavgift', 'nätavgiften')} för den del du inte kan byta bort.</p>`;
    },
  },
  en: {
    slug: 'electricity-markup-and-fees',
    nav: 'Mark-up and fees',
    card: 'The retailer’s mark-up, monthly fee and certificates, and what they cost a year.',
    title: 'Electricity Mark-up 2026: Retailer Fees and What They Cost',
    description: 'Electricity mark-up (påslag) in Sweden, 2026: the retailer’s margin per kWh, the 100 to 500 kronor annual fee per Energimarknadsbyrån and certificates.',
    h1: 'Mark-up and fees: what the retailer charges on top of the spot price',
    intro: 'The spot price is the same at every retailer. The difference between them lies in the mark-up and fees.',
    resume: (h) => {
      const v = V(h);
      return `On a variable or quarter-hour contract you pay the spot price for your bidding zone, which is the same whichever retailer (elhandlare) you pick. What sets retailers apart is what they charge on top: a mark-up (påslag) per kilowatt-hour and often a fixed annual fee. Energimarknadsbyrån, the consumer energy bureau, says the annual fee is usually around 100 to 500 kronor, and that VAT is added to every cost. Part of the cost may also be a fee for electricity certificates (elcertifikat), which retailers must buy in proportion to customers’ consumption; according to the Swedish Energy Agency the average cost was ${h.num(v.cert, 1)} öre per kWh in 2023. A 5 öre mark-up before VAT costs a house using ${h.num(v.f.villa_elvarme)} kWh a year ${h.kr(v.kost(v.f.villa_elvarme, 5, 0))}; the same mark-up costs a flat using ${h.num(v.f.lagenhet_liten)} kWh ${h.kr(v.kost(v.f.lagenhet_liten, 5, 0))}. Use your own figures below.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'What is a reasonable mark-up on the electricity price?', a: 'There is no official reasonable mark-up; retailers set it and it is stated in the contract. Compare mark-up and annual fee together for your own consumption. For a low-use flat the fixed annual fee weighs most, for an electrically heated house the mark-up per kWh. The mini-calculator works out both.' },
        { q: 'Are electricity certificates included in the mark-up?', a: `It varies. Energimarknadsbyrån writes that retailers must buy electricity certificates in proportion to customers’ use but decide themselves how large the fee is and how it is charged. It may be built into the mark-up or appear as its own line. The Swedish Energy Agency gives an average of ${h.num(v.cert, 1)} öre per kWh for 2023.` },
        { q: 'Is the certificate system ending soon?', a: 'The system began in 2003 and under current rules runs until 2035. In June 2026 the Swedish Energy Agency was asked to propose changes so it can close as early as 2029; the assignment is due by 16 November 2026. No decision on an earlier end existed as of October 2026.' },
        { q: 'Why is the default contract dearer than a variable one?', a: `You get the default contract (anvisat avtal) if you have not chosen a retailer, priced by the retailer your grid company appointed. In Statistics Sweden’s data for SE3 it stood at ${h.ore(v.anv)} before VAT for a flat last month, against ${h.ore(v.rorl)} on a variable contract. The gap works like a higher mark-up.` },
        { q: 'Is switching retailer worth it for a few öre of mark-up?', a: `For an electrically heated house using ${h.num(v.f.villa_elvarme)} kWh a year, each öre of mark-up is worth ${h.kr(v.kost(v.f.villa_elvarme, 1, 0))} a year with VAT; for a flat using ${h.num(v.f.lagenhet_liten)} kWh only ${h.kr(v.kost(v.f.lagenhet_liten, 1, 0))}. Check the notice period of your current contract and whether a fixed price is still running before switching. The switch is made with the new retailer.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rader = [[h.num(v.f.lagenhet_liten), h.kr(v.kost(v.f.lagenhet_liten, 3, 300)), h.kr(v.kost(v.f.lagenhet_liten, 8, 0))], [h.num(v.f.villa_utan_elvarme), h.kr(v.kost(v.f.villa_utan_elvarme, 3, 300)), h.kr(v.kost(v.f.villa_utan_elvarme, 8, 0))], [h.num(v.f.villa_elvarme), h.kr(v.kost(v.f.villa_elvarme, 3, 300)), h.kr(v.kost(v.f.villa_elvarme, 8, 0))]];
      return `<h2>What the retailer charges for</h2>
<p>Energimarknadsbyrån describes the retail part of the bill as the electricity price under your contract, in many cases a fixed annual fee, possibly a certificate fee, and VAT on everything. On a quarter-hour contract, the bureau says, you pay the spot price for the power you use plus the retailer’s mark-up and VAT. On a variable monthly price it is the month’s average plus mark-up. On a fixed price the mark-up is built into the fixed rate and does not appear as its own line.</p>
<p>According to Energimarknadsbyrån, retailers and grid companies may not charge an invoice fee or a fee for billing data. What you pay beyond the energy is therefore the mark-up, the annual fee and possibly certificates.</p>
<h2>Two contracts, three households</h2>
${h.table(['kWh a year', 'Mark-up 3 öre + 300 kr fee', 'Mark-up 8 öre, no fee'], rader, 'Example. Mark-up before VAT with 25% VAT added; annual fee incl. VAT. Consumption as given by Energimarknadsbyrån.', ['l', 'r', 'r'])}
<p>The table shows why you cannot say which contract is cheapest without knowing the consumption. For a small flat the contract without an annual fee wins despite the higher mark-up. For the heated house it is the other way round. The mini-calculator finds where the line falls for you.</p>
<h2>Where the line falls between two offers</h2>
<p>Between the offer with a 3 öre mark-up and a 300 kronor annual fee and the one with 8 öre and no fee, the break-even point is ${h.num(v.brytpunkt)} kWh a year. Below that consumption the no-fee contract is cheaper; above it the lower mark-up pays off. The sum is simple: the mark-up gap, 5 öre plus VAT, times consumption must equal the annual fee. The same reasoning works for any pair of offers. Swap in the figures in front of you to see which suits your home.</p>
<h2>The mark-up’s share of the all-in price</h2>
<p>At the Statistics Sweden average variable price for a flat in SE3, a 5 öre mark-up, a 25 öre transfer fee and energy tax, the all-in price is ${h.ore(v.ex.total)} with VAT. The mark-up makes up ${h.ore(5 * v.mo)} of that, or ${h.pct((5 * v.mo) / v.ex.total, 0)}. Small, but it is one of the few parts of the bill where the choice is yours. A fixed annual fee hits small users harder: 300 kronor a year over 2,000 kWh is 15 öre per kWh.</p>
<h2>Electricity certificates in 2026</h2>
<p>The certificate system supports renewable generation. Retailers must buy certificates in proportion to their customers’ use, and the cost is passed on. The Swedish Energy Agency puts the average cost at ${h.num(v.cert, 1)} öre per kWh in 2023, a small part of the price. On 1 January 2026 the certificate act and ordinance were amended, and in June 2026 the agency was asked to propose how the system could close in 2029 instead of 2035. If it ends earlier, the cost leaves retailers’ pricing; when depends on decisions not yet taken.</p>
<h2>Finding the mark-up in your contract</h2>
<ol>
<li>Look for påslag, tillägg or fast påslag in the contract terms or the retailer’s customer pages. It is given in öre per kWh, with or without VAT; check which.</li>
<li>Look for an annual fee, fixed fee or monthly fee (årsavgift, fast avgift, månadsavgift). Multiply a monthly fee by twelve.</li>
<li>Check whether certificates appear as a separate line on the bill or are included in the mark-up.</li>
<li>Enter the mark-up in the mark-up field of the ${h.a('home', 'home-page calculator')} to see your all-in price.</li>
</ol>
<h2>Mark-up and the default contract</h2>
<p>If you move in and choose no retailer, you are placed on a default contract. Statistics Sweden data shows the default price in SE3 last month at ${h.ore(v.anv)} before VAT for a flat, against ${h.ore(v.rorl)} on a variable contract. For a flat using ${h.num(v.f.lagenhet_liten)} kWh a year that gap is ${h.kr((v.anv - v.rorl) * v.mo * v.f.lagenhet_liten / 100)} with VAT. Choosing a contract yourself is one of the easiest ways to cut the retail part of the bill. What each contract type has cost is on ${h.a('fast-eller-rorligt', 'fixed or variable price')}.</p>
<h2>The mark-up against the whole bill</h2>
<p>A mark-up of a few öre looks small next to energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} or the grid transfer fee. Unlike them, though, you can change it by switching retailer or contract; tax and grid fee stay the same whoever sells you power. See ${h.a('elrakning', 'the electricity bill')} for how every part adds up, and ${h.a('natavgift', 'the grid fee')} for the part you cannot switch away from.</p>`;
    },
  },
});
