import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Nätavgift expliquée : parts fixe et variable, säkring, myndighetsavgifter, monopole, médianes Ei. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const fall = ['L16', 'V16', 'V20', 'V25'] as const;
  const med = fall.map((f) => {
    const r = M.rangordna(f);
    return { f, fast: M.median(r.map((x) => x.t.fastKrPerAr)), ror: M.median(r.map((x) => x.t.rorligOre)), tot: M.median(r.map((x) => x.t.totalKrPerAr)) };
  });
  const d = P.nat.myndighetsavgifter_delar_2026;
  const andel = med.map((x) => x.fast / x.tot);
  const hist = { l: M.natSnitt('1'), v: M.natSnitt('3') };
  return { mo, med, d, andel, hist, m25: P.nat.myndighetsavgifter_kr['2025'], m26: P.nat.myndighetsavgifter_kr['2026'] };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };

export default defineGuide({
  id: 'natavgift',
  group: 'nat',
  order: 50,
  mini: 'natavgift',
  miniHref: 'jamfor-natavgift',
  related: ['jamfor-natavgift', 'effektavgift', 'elrakning', 'energiskatt', 'ellevio'],
  sources: ['embElrakning', 'eiNat', 'natomraden', 'embForbrukning'],
  sv: {
    slug: 'natavgift-forklarad',
    nav: 'Nätavgiften förklarad',
    card: 'Fast avgift, överföringsavgift, säkring och myndighetsavgifter.',
    title: 'Nätavgift el 2026: fast avgift, överföring och säkring',
    description: 'Nätavgift el 2026: vad fast avgift och överföringsavgift betalar för, hur säkringen påverkar priset, myndighetsavgifterna på 139,89 kr och medianen 2026.',
    h1: 'Nätavgiften: vad du betalar elnätsföretaget för',
    intro: 'Nätavgiften är elräkningens andra halva. Den går inte att förhandla bort, men den går att förstå.',
    resume: (h) => {
      const v = V(h);
      const l = v.med[0], vi = v.med[2];
      return `Nätavgiften är det du betalar elnätsföretaget för att elen ska nå din bostad. Enligt Energimarknadsbyrån består den av två delar: en fast abonnemangsavgift, som beror på storleken på din huvudsäkring, och en rörlig överföringsavgift per förbrukad kWh. På nätfakturan finns också energiskatten och tre statliga myndighetsavgifter, som ${h.P.year} är ${h.kr(v.m26)} om året exklusive moms. I Energimarknadsinspektionens sammanställning för ${h.P.year} är medianen ${h.kr(l.tot * v.mo)} om året med moms för en lägenhet med 16 ampere och 2 000 kWh, och ${h.kr(vi.tot * v.mo)} för en elvärmd villa med 20 ampere och 20 000 kWh. För lägenheten är ${h.pct(v.andel[0], 0)} av kostnaden fast, för villan ${h.pct(v.andel[2], 0)}. Du kan inte byta nätföretag, eftersom det bara finns ett nät där du bor. Räkna ut din egen årskostnad med uppgifterna från fakturan.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vad är myndighetsavgifterna på nätfakturan?', a: `Tre avgifter som nätföretaget tar in åt staten: nätövervakningsavgift ${h.kr(v.d.natovervakning, 2)}, elberedskapsavgift ${h.kr(v.d.elberedskap)} och elsäkerhetsavgift ${h.kr(v.d.elsakerhet, 2)} om året, totalt ${h.kr(v.m26, 2)} exklusive moms ${h.P.year}. Året innan var summan ${h.kr(v.m25, 2)}. Beslutet om de nya beloppen togs den 29 januari ${h.P.year} och gäller från årets början.` },
        { q: 'Varför betalar jag nätavgift fast jag knappt använder el?', a: 'Den fasta abonnemangsavgiften betalar för att du är ansluten till elnätet och beror på säkringens storlek, inte på hur mycket el du använder. Därför har en lägenhet med låg förbrukning ofta ett högt snittpris per kWh. Den rörliga överföringsavgiften sjunker däremot i takt med förbrukningen.' },
        { q: 'Får nätföretaget ta betalt för fakturan?', a: 'Nej. Energimarknadsbyrån skriver att varken elleverantörer eller elnätsföretag får kräva fakturaavgift eller avgift för fakturaunderlag. Nätavgiften består av abonnemang, överföring och de statliga avgifterna; energiskatt och moms tillkommer. Står det en avgift för pappersfaktura på din nätfaktura, fråga nätföretaget vad den avser.' },
        { q: 'Vem bestämmer hur höga nätavgifterna får vara?', a: 'Nätföretagen sätter sina egna tariffer, men Energimarknadsinspektionen fastställer hur mycket de får ta in totalt under en tillsynsperiod och samlar varje år in alla avgifter för hushåll. Det är därför priserna går att jämföra mellan nätområden, och därför kan du se var ditt nät hamnar bland alla andra.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.med.map((x, i) => [NAMN.sv[x.f], h.kr(x.fast * v.mo), h.ore(x.ror * v.mo), h.kr(x.tot * v.mo), h.pct(v.andel[i], 0)]);
      return `<h2>Medianen för fyra typkunder</h2>
${h.table(['Typfall', 'Fast del per år', 'Överföring per kWh', 'Totalt per år', 'Fast andel'], rows, `Energimarknadsinspektionen ${h.P.year}, median av alla nätområden med pris för typfallet, inkl. moms. Varje kolumn är en egen median, så raderna summerar inte exakt.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Ju större förbrukning, desto mindre del av nätavgiften är fast. Men även den elvärmda villan betalar en stor fast del, eftersom abonnemanget för 20 ampere är betydligt dyrare än för 16. Det är också säkringen som skiljer en villa från en lägenhet i nätets prislista, snarare än bostadstypen i sig.</p>
<h2>Ett räkneexempel med en villa på 16 ampere</h2>
<p>Ta medianvärdena för en villa med 16 ampere och 5 000 kWh om året: en fast del på ${h.kr(v.med[1].fast)} och en överföringsavgift på ${h.ore(v.med[1].ror)}, båda exklusive moms. Den fasta delen kostar då ${h.kr(v.med[1].fast * v.mo)} om året med moms, och överföringen ${h.kr((v.med[1].ror * 5000 * v.mo) / 100)}. Lägger du till energiskatten för samma förbrukning, ${h.kr((h.P.skatt.energiskatt_ore * 5000 * v.mo) / 100)} med moms, har du hela nätfakturan för ett år. Delat på tolv blir det det belopp du ser varje månad, om förbrukningen vore jämn över året.</p>
<p>I verkligheten varierar förbrukningen med årstiden, och därmed den rörliga delen och skatten. Den fasta delen är däremot densamma varje månad. Det är därför sommarens nätfaktura kan kännas hög i förhållande till hur lite el som används. Fyll i dina egna siffror i mini-kalkylatorn ovan, eller välj ditt nätområde i ${h.a('jamfor-natavgift', 'jämförelsen')} för att få Energimarknadsinspektionens uppgifter direkt.</p>
<h2>Den fasta delen: säkringen bestämmer</h2>
<p>Huvudsäkringen begränsar hur mycket ström din bostad kan ta ut samtidigt. En lägenhet har oftast 16 ampere, en villa 16, 20 eller 25 ampere. Abonnemangets pris beror på säkringen, och skillnaden mellan 16 och 20 ampere är ofta stor. Energimarknadsbyrån räknar enkelt: en apparat på 1 kW som används i en timme förbrukar 1 kWh. Ett hushåll som sällan har många stora apparater igång samtidigt kan ibland klara sig med en mindre säkring och sänka sin fasta avgift; en elektriker kan bedöma det.</p>
<h2>Den rörliga delen: överföring per kWh</h2>
<p>Överföringsavgiften tas ut för varje kWh som förs genom nätet till dig. Vissa nätföretag har samma pris dygnet runt, andra olika pris för höglast och låglast, och några tar ut en ${h.a('effektavgift', 'effektavgift')} för den högsta effekten under månaden i stället för eller utöver överföringsavgiften. Överföringsavgiften är det enda i nätavgiften som du påverkar med din förbrukning.</p>
<h2>Nätpriserna över tid enligt SCB</h2>
${h.table(['Den 1 januari', 'Lägenhet', 'Villa med elvärme'], v.hist.l.map((x, i) => [String(x.ar), h.ore(x.ore), h.ore(v.hist.v[i]?.ore ?? 0)]), 'SCB, elnätspriser per den 1 januari, viktat genomsnitt, öre/kWh exklusive skatter, fasta avgifter utslagna per kWh.', ['l', 'r', 'r'])}
<p>SCB:s serie visar att nätpriset per kWh, med de fasta avgifterna utslagna, har stigit varje år sedan 2021 för båda bostadstyperna. Lägenhetens pris per kWh är mer än dubbelt så högt som villans, eftersom abonnemanget delas på så få kilowattimmar. Mellan 2021 och 2026 steg lägenhetens nätpris från ${h.ore(v.hist.l[1].ore)} till ${h.ore(v.hist.l[v.hist.l.length - 1].ore)}, och villans från ${h.ore(v.hist.v[1].ore)} till ${h.ore(v.hist.v[v.hist.v.length - 1].ore)}, exklusive moms. Under samma år har energiskatten först höjts och sedan sänkts, så nätet och skatten har inte följts åt. Jämför gärna med dina egna fakturor från de åren för att se hur ditt nät har utvecklats.</p>
<h2>Varför du inte kan byta elnät</h2>
<p>Det finns bara ett elnät där du bor, och det ägs av ett nätföretag. Enligt Svenska kraftnäts karta på Nätområden.se finns omkring 280 lokala nätområden i Sverige, med ägare från stora koncerner till små ekonomiska föreningar. Elhandlaren kan du byta hur ofta du vill, men nätavgiften följer adressen. Den som flyttar från ett billigt till ett dyrt nät kan få en högre elräkning även med samma elavtal; ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')} visar hur stora skillnaderna är.</p>
<h2>Nätavgiften på fakturan</h2>
<ol>
<li><strong>Abonnemang</strong> eller fast avgift, ofta per månad.</li>
<li><strong>Överföringsavgift</strong>, kWh gånger öre per kWh, ibland uppdelad på tider.</li>
<li><strong>Myndighetsavgifter</strong>, ${h.kr(v.m26)} om året exklusive moms, ofta inbakade i abonnemanget.</li>
<li><strong>Energiskatt</strong>, ${h.ore(h.P.skatt.energiskatt_ore)} exklusive moms; se ${h.a('energiskatt', 'energiskatt på el')}.</li>
<li><strong>Moms</strong>, 25 procent på allt.</li>
</ol>
<p>Hela räkningen, med elhandeln, räknar du ut i ${h.a('elrakning', 'kalkylatorn för elräkningen')}.</p>
<h2>Två hushåll, samma förbrukning, olika räkning</h2>
<p>Två villor med 20 ampere och 20 000 kWh om året, en i ett nät med en av landets lägsta avgifter och en i ett av de dyraste, kan skilja med mer än tiotusen kronor om året bara på nätet, moms inräknad. Det beror inte på elpriset eller skatten, som är lika för båda om de ligger i samma elområde och kommun utan avdrag. Skillnaden ligger i hur nätföretaget har byggt och prissatt sitt nät. Därför räcker det inte att jämföra elhandlare för att veta vad elen kommer att kosta på en ny adress: fråga också vilket nätföretag som äger nätet där, och slå upp dess avgift.</p>`;
    },
  },
  en: {
    slug: 'grid-fee-explained',
    nav: 'Grid fee explained',
    card: 'Fixed fee, transfer fee, fuse size and authority charges.',
    title: 'Grid Fee Sweden 2026: Fixed Fee, Transfer Fee, Fuse Size',
    description: 'Grid fee in Sweden, 2026: what the fixed and transfer fees pay for, how the main fuse sets the price, the 139.89 kronor authority charges and the median.',
    h1: 'The grid fee: what you pay the grid company for',
    intro: 'The grid fee is the other half of the electricity bill. You cannot negotiate it away, but you can understand it.',
    resume: (h) => {
      const v = V(h);
      const l = v.med[0], vi = v.med[2];
      return `The grid fee (nätavgift) is what you pay the grid company (elnätsföretag) to get power to your home. According to Energimarknadsbyrån, the consumer energy bureau, it has two parts: a fixed subscription fee that depends on the size of your main fuse (huvudsäkring), and a variable transfer fee (överföringsavgift) per kWh used. The grid bill also carries energy tax and three state authority charges, ${h.kr(v.m26)} a year before VAT in ${h.P.year}. In the Energy Markets Inspectorate’s ${h.P.year} compilation the median is ${h.kr(l.tot * v.mo)} a year with VAT for a 16 A flat using 2,000 kWh, and ${h.kr(vi.tot * v.mo)} for an electrically heated 20 A house using 20,000 kWh. For the flat ${h.pct(v.andel[0], 0)} of the cost is fixed, for the house ${h.pct(v.andel[2], 0)}. You cannot switch grid company, because there is only one grid where you live. Work out your own annual cost from the figures on your bill.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'What are the authority charges on the grid bill?', a: `Three fees the grid company collects for the state: a grid supervision fee of ${h.kr(v.d.natovervakning, 2)}, an emergency preparedness fee of ${h.kr(v.d.elberedskap)} and an electrical safety fee of ${h.kr(v.d.elsakerhet, 2)} a year, ${h.kr(v.m26, 2)} in total before VAT in ${h.P.year}. The year before, the sum was ${h.kr(v.m25, 2)}. The new amounts were decided on 29 January ${h.P.year} and apply from the start of the year.` },
        { q: 'Why do I pay a grid fee when I barely use power?', a: 'The fixed subscription pays for being connected to the grid and depends on your fuse size, not on how much you use. That is why a low-use flat often has a high average price per kWh. The variable transfer fee, on the other hand, falls as your consumption falls.' },
        { q: 'Can the grid company charge for the invoice?', a: 'No. Energimarknadsbyrån states that neither retailers nor grid companies may charge an invoice fee or a fee for billing data. The grid fee is made up of the subscription, the transfer fee and the state charges, with energy tax and VAT on top. If you see a paper-invoice fee, ask the grid company what it covers.' },
        { q: 'Who decides how high grid fees can be?', a: 'Grid companies set their own tariffs, but the Energy Markets Inspectorate sets how much they may collect in total over a regulatory period and collects every household charge each year. That is why prices can be compared between grid areas, and why you can see where your grid ranks among all the others.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.med.map((x, i) => [NAMN.en[x.f], h.kr(x.fast * v.mo), h.ore(x.ror * v.mo), h.kr(x.tot * v.mo), h.pct(v.andel[i], 0)]);
      return `<h2>The median for four standard customers</h2>
${h.table(['Case', 'Fixed per year', 'Transfer per kWh', 'Total per year', 'Fixed share'], rows, `Energy Markets Inspectorate ${h.P.year}, median across grid areas priced for the case, incl. VAT. Each column is its own median, so rows do not add up exactly.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The larger the consumption, the smaller the fixed share of the grid fee. Yet even the heated house pays a large fixed part, because a 20 A subscription costs much more than a 16 A one. It is the fuse, rather than the type of home, that separates a house from a flat in a grid price list.</p>
<h2>A worked example for a 16 A house</h2>
<p>Take the median values for a 16 A house using 5,000 kWh a year: a fixed part of ${h.kr(v.med[1].fast)} and a transfer fee of ${h.ore(v.med[1].ror)}, both before VAT. The fixed part then costs ${h.kr(v.med[1].fast * v.mo)} a year with VAT, and the transfer ${h.kr((v.med[1].ror * 5000 * v.mo) / 100)}. Add energy tax on the same use, ${h.kr((h.P.skatt.energiskatt_ore * 5000 * v.mo) / 100)} with VAT, and you have the full grid bill for a year. Divided by twelve, that is what you would see each month if use were even through the year.</p>
<p>In practice use varies with the season, and so do the variable part and the tax, while the fixed part stays the same every month. That is why a summer grid bill can feel high for how little power was used. Enter your own figures in the mini-calculator above, or choose your grid area in the ${h.a('jamfor-natavgift', 'comparison')} to get the regulator’s figures directly.</p>
<h2>The fixed part: the fuse decides</h2>
<p>The main fuse limits how much current your home can draw at once. A flat usually has 16 A, a house 16, 20 or 25 A. The subscription price depends on the fuse, and the step from 16 to 20 A is often large. Energimarknadsbyrån puts it simply: a 1 kW appliance used for an hour uses 1 kWh. A household that rarely runs many large appliances at once can sometimes manage on a smaller fuse and lower its fixed fee; an electrician can judge that.</p>
<h2>The variable part: transfer per kWh</h2>
<p>The transfer fee is charged for every kWh carried to you through the grid. Some grid companies have one price around the clock, others peak and off-peak prices, and a few charge a ${h.a('effektavgift', 'power charge')} for the month’s highest load instead of, or on top of, the transfer fee. The transfer fee is the only part of the grid fee you influence through your consumption.</p>
<h2>Grid prices over time, per Statistics Sweden</h2>
${h.table(['On 1 January', 'Flat', 'House with electric heating'], v.hist.l.map((x, i) => [String(x.ar), h.ore(x.ore), h.ore(v.hist.v[i]?.ore ?? 0)]), 'Statistics Sweden, grid prices on 1 January, weighted average, öre/kWh before taxes, fixed fees spread per kWh.', ['l', 'r', 'r'])}
<p>Statistics Sweden’s series shows the grid price per kWh, fixed fees spread out, rising every year since 2021 for both home types. The flat’s price per kWh is more than double the house’s, because the subscription is spread over so few kilowatt-hours.</p>
<h2>Why you cannot switch grid</h2>
<p>There is only one grid where you live, owned by one grid company. On Svenska kraftnät’s map at Nätområden.se Sweden has around 280 local grid areas, with owners ranging from large groups to small cooperatives. You can change retailer as often as you like, but the grid fee follows the address. Moving from a cheap to an expensive grid can raise the bill even on the same contract; the ${h.a('jamfor-natavgift', 'grid-fee comparison')} shows how large the gaps are.</p>
<h2>The grid fee on the bill</h2>
<ol>
<li><strong>Subscription</strong> or fixed fee, often per month.</li>
<li><strong>Transfer fee</strong>, kWh times öre per kWh, sometimes split by time.</li>
<li><strong>Authority charges</strong>, ${h.kr(v.m26)} a year before VAT, often built into the subscription.</li>
<li><strong>Energy tax</strong>, ${h.ore(h.P.skatt.energiskatt_ore)} before VAT; see ${h.a('energiskatt', 'energy tax on electricity')}.</li>
<li><strong>VAT</strong>, 25% on everything.</li>
</ol>
<p>Work out the whole bill, retail energy included, in the ${h.a('elrakning', 'electricity bill calculator')}.</p>
<h2>Two households, same use, different bills</h2>
<p>Two 20 A houses using 20,000 kWh a year, one on one of the country’s cheapest grids and one on one of the dearest, can differ by more than ten thousand kronor a year on the grid alone, VAT included. That has nothing to do with the energy price or tax, which are the same for both in the same zone and in a municipality without the deduction. The difference lies in how the grid company has built and priced its network. So comparing retailers is not enough to know what power will cost at a new address: ask which grid company owns the grid there, and look up its fee.</p>`;
    },
  },
});
