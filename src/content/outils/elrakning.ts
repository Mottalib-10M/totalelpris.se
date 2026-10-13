import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Elräkning : la facture d'un mois (PrisCalc mode « rakning ») et le prix total moyen des ménages selon SCB (semestriel). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const kat = [['DB', '1 000–2 499 kWh', '1,000–2,499 kWh'], ['DC', '2 500–4 999 kWh', '2,500–4,999 kWh'], ['DD', '5 000–14 999 kWh', '5,000–14,999 kWh'], ['DE', '15 000 kWh –', '15,000 kWh +']] as const;
  const hus = kat.map(([k, sv, en]) => ({ sv, en, s: M.husPris(k) }));
  const sist = hus.map((x) => ({ ...x, n: x.s[x.s.length - 1] }));
  const halvar = sist[0].n.halvar;
  const e = M.hittaEnhet('E.ON Energidistribution', 'Syd')!;
  const t = M.natTariff(e, 'V20')!;
  const spot = M.varde('rorligt', 'SE4', '3')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const vinter = M.manadskostnad({ kwh: 3000, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  const sommar = M.manadskostnad({ kwh: 800, prisTotalOre: p.total, natFastKrPerAr: t.fastKrPerAr * mo });
  return { mo, sist, halvar, t, spot, p, vinter, sommar };
};
const halv = (h: Helpers, x: string) => (h.lang === 'sv' ? `${x.endsWith('H1') ? 'första' : 'andra'} halvåret ${x.slice(0, 4)}` : `the ${x.endsWith('H1') ? 'first' : 'second'} half of ${x.slice(0, 4)}`);

export default defineGuide({
  id: 'elrakning',
  group: 'pris',
  order: 50,
  tool: 'pris',
  toolProps: { mode: 'rakning', nat: 'E.ON Energidistribution|Syd', zon: 'SE4', fall: 'V20' },
  related: ['natavgift', 'paslag', 'energiskatt', 'fast-eller-rorligt', 'jamfor-natavgift'],
  sources: ['embElrakning', 'scbElpriser', 'eiNat', 'skvEl'],
  sv: {
    slug: 'elrakning',
    nav: 'Elräkning',
    card: 'Vad en månad kostar med elhandel, nät, skatt och moms.',
    title: 'Elräkning 2026: vad månaden kostar med nät, skatt och moms',
    description: 'Elräkning 2026: räkna ut månadens kostnad med elhandel, nätavgift, energiskatt och moms, och se SCB:s snittpris för hushåll per kWh. Två fakturor, en summa.',
    h1: 'Elräkningen: vad en månad med el kostar dig',
    intro: 'Du får två fakturor, en från elhandlaren och en från nätföretaget. Kalkylatorn lägger ihop dem.',
    resume: (h) => {
      const v = V(h);
      const de = v.sist[3].n;
      return `En elvärmd villa i Malmö med E.ON:s nät och 20 amperes säkring betalar med SCB:s snitt för rörligt pris i SE4 ${h.ore(v.p.total)} per kWh i rörliga kostnader, och med nätets fasta avgift blir en vintermånad på 3 000 kWh omkring ${h.kr(v.vinter.total)} och en sommarmånad på 800 kWh omkring ${h.kr(v.sommar.total)}. Elräkningen består enligt Energimarknadsbyrån av två delar: elhandeln, med elpris, eventuellt påslag och månadsavgift, och elnätet, med fast abonnemangsavgift, överföringsavgift per kWh och energiskatten. Moms på 25 procent läggs på allt. SCB:s statistik för ${halv(h, v.halvar)} visar att hushåll som använder mer än 15 000 kWh om året betalade ${h.ore(de.total)} i snitt, varav ${h.ore(de.elskatt)} energiskatt och ${h.ore(de.moms)} moms. Ange din förbrukning och ditt nät för att se din månad.`;
    },
    faqs: (h) => {
      const v = V(h);
      const db = v.sist[0].n;
      return [
        { q: 'Varför får jag två elräkningar?', a: 'Elhandeln och elnätet är skilda verksamheter. Elhandlaren väljer du själv och den säljer energin; nätföretaget äger ledningarna där du bor och kan inte väljas bort. Nätföretaget tar också ut energiskatten. Vissa elhandlare skickar en samlad faktura för båda, men beloppen bestäms fortfarande av två olika företag.' },
        { q: 'Varför är priset per kWh högre i en liten lägenhet?', a: `De fasta avgifterna fördelas på färre kilowattimmar. SCB:s statistik för ${halv(h, v.halvar)} visar ${h.ore(db.total)} per kWh i snitt för hushåll med 1 000 till 2 499 kWh om året, varav ${h.ore(db.nat)} nät, mot betydligt mindre för stora förbrukare. Elnätets abonnemang kostar ungefär lika mycket oavsett förbrukning.` },
        { q: 'Får elhandlaren ta betalt för själva fakturan?', a: 'Nej. Energimarknadsbyrån skriver att elleverantörer och elnätsföretag inte får kräva fakturaavgift eller avgift för fakturaunderlag. Däremot tar många elhandlare en fast årsavgift, enligt Energimarknadsbyrån oftast 100 till 500 kronor om året. Den lägger du in som en del av påslaget i kalkylatorn.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.sist.map((x) => [x.sv, h.ore(x.n.handel), h.ore(x.n.nat), h.ore(x.n.elskatt), h.ore(x.n.moms), h.ore(x.n.total)]);
      return `<h2>Vad hushållen betalade per kWh, enligt SCB</h2>
${h.table(['Förbrukning per år', 'Elhandel', 'Nät', 'Energiskatt', 'Moms', 'Totalt'], rows, `SCB, priser på el för hushåll, ${halv(h, v.halvar)}, öre/kWh. Fasta avgifter är utslagna per kWh.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Tabellen visar varför ett snittpris per kWh säger lite utan förbrukningen. Ju mindre el ett hushåll använder, desto större del av räkningen är fasta avgifter, och desto högre blir snittet. För den som använder mest är det i stället elhandeln och skatten som dominerar.</p>
<h2>Raderna på fakturan</h2>
<ul>
<li><strong>Elhandel</strong>: förbrukad energi gånger ditt pris, plus påslag och eventuell månadsavgift. Se ${h.a('paslag', 'påslag och avgifter')}.</li>
<li><strong>Elnät, fast del</strong>: abonnemanget, som beror på huvudsäkringen, och myndighetsavgifterna på ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms.</li>
<li><strong>Elnät, rörlig del</strong>: överföringsavgiften per kWh, ibland med olika pris för höglast och låglast eller en ${h.a('effektavgift', 'effektavgift')}.</li>
<li><strong>Energiskatt</strong>: ${h.ore(h.P.skatt.energiskatt_ore)} exklusive moms, eller ${h.ore(h.P.skatt.energiskatt_sankt_ore)} i kommuner med ${h.a('energiskatt', 'sänkt energiskatt')}.</li>
<li><strong>Moms</strong>: 25 procent på allt ovan.</li>
</ul>
<h2>Vinter och sommar för samma villa</h2>
<p>Med samma pris per kWh blir skillnaden mellan månaderna nästan bara förbrukningen. E.ON:s fasta nätavgift för en villa med 20 ampere är ${h.kr(v.t.fastKrPerAr * v.mo)} om året med moms, alltså ${h.kr((v.t.fastKrPerAr * v.mo) / 12)} i månaden oavsett årstid. Ändra förbrukningen i kalkylatorn för att se din vinterräkning, och ${h.a('jamfor-natavgift', 'jämför nätavgiften')} om du undrar om ditt nät är dyrt.</p>`;
    },
  },
  en: {
    slug: 'electricity-bill-calculator',
    nav: 'Electricity bill',
    card: 'What a month costs with retail energy, grid, tax and VAT.',
    title: 'Electricity Bill Sweden 2026: Monthly Cost, Grid, Tax, VAT',
    description: 'Electricity bill in Sweden, 2026: work out a month’s cost with retail energy, grid fee, energy tax and VAT, plus Statistics Sweden’s average price per kWh.',
    h1: 'The electricity bill: what a month of power costs you',
    intro: 'You get two bills, one from the retailer and one from the grid company. The calculator adds them up.',
    resume: (h) => {
      const v = V(h);
      const de = v.sist[3].n;
      return `An electrically heated house in Malmö on E.ON’s grid with a 20 A main fuse pays, at the Statistics Sweden average variable price for SE4, ${h.ore(v.p.total)} per kWh in variable costs; with the grid’s fixed fee a winter month of 3,000 kWh comes to about ${h.kr(v.vinter.total)} and a summer month of 800 kWh about ${h.kr(v.sommar.total)}. According to Energimarknadsbyrån, the consumer energy bureau, the bill has two parts: retail energy (elhandel), with the price, any mark-up and a monthly fee, and the grid (elnät), with a fixed subscription, a transfer fee per kWh and the energy tax. VAT of 25% goes on everything. Statistics Sweden figures for ${halv(h, v.halvar)} show that households using more than 15,000 kWh a year paid ${h.ore(de.total)} on average, of which ${h.ore(de.elskatt)} energy tax and ${h.ore(de.moms)} VAT. Enter your use and grid to see your month.`;
    },
    faqs: (h) => {
      const v = V(h);
      const db = v.sist[0].n;
      return [
        { q: 'Why do I receive two electricity bills in Sweden?', a: 'Retail and grid are separate businesses. You choose the retailer, which sells the energy; the grid company owns the lines where you live and cannot be swapped. The grid company also collects energy tax. Some retailers send a combined invoice, but the amounts are still set by two different companies.' },
        { q: 'Why is the price per kWh higher in a small flat?', a: `Fixed charges are spread over fewer kilowatt-hours. Statistics Sweden figures for ${halv(h, v.halvar)} show ${h.ore(db.total)} per kWh on average for households using 1,000 to 2,499 kWh a year, of which ${h.ore(db.nat)} grid, against far less for large users. The grid subscription costs about the same however much you use.` },
        { q: 'Can a retailer charge a fee for the invoice itself?', a: 'No. Energimarknadsbyrån states that retailers and grid companies may not charge an invoice fee or a fee for the billing data. Many retailers do charge a fixed annual fee, usually 100 to 500 kronor according to the bureau. Add it as part of the mark-up in the calculator if you want an exact figure.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.sist.map((x) => [x.en, h.ore(x.n.handel), h.ore(x.n.nat), h.ore(x.n.elskatt), h.ore(x.n.moms), h.ore(x.n.total)]);
      return `<h2>What households paid per kWh, per Statistics Sweden</h2>
${h.table(['Use per year', 'Retail', 'Grid', 'Energy tax', 'VAT', 'Total'], rows, `Statistics Sweden, household electricity prices, ${halv(h, v.halvar)}, öre/kWh. Fixed fees spread per kWh.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The table shows why an average price per kWh means little without the consumption. The less power a household uses, the larger the share of fixed fees and the higher the average. For the biggest users, retail energy and tax dominate instead.</p>
<h2>The lines on the bill</h2>
<ul>
<li><strong>Retail energy</strong> (elhandel): energy used times your price, plus mark-up and any monthly fee. See ${h.a('paslag', 'mark-up and fees')}.</li>
<li><strong>Grid, fixed part</strong>: the subscription, which depends on your main fuse (huvudsäkring), and state authority charges of ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT.</li>
<li><strong>Grid, variable part</strong>: the transfer fee (överföringsavgift) per kWh, sometimes with peak and off-peak rates or a ${h.a('effektavgift', 'power charge')}.</li>
<li><strong>Energy tax</strong> (energiskatt): ${h.ore(h.P.skatt.energiskatt_ore)} before VAT, or ${h.ore(h.P.skatt.energiskatt_sankt_ore)} in municipalities with ${h.a('energiskatt', 'reduced energy tax')}.</li>
<li><strong>VAT</strong> (moms): 25% on all of the above.</li>
</ul>
<h2>Winter and summer for the same house</h2>
<p>At the same price per kWh, the gap between months is almost entirely consumption. E.ON’s fixed grid fee for a 20 A house is ${h.kr(v.t.fastKrPerAr * v.mo)} a year with VAT, ${h.kr((v.t.fastKrPerAr * v.mo) / 12)} a month whatever the season. Change the consumption in the calculator to see your winter bill, and ${h.a('jamfor-natavgift', 'compare grid fees')} if you wonder whether yours is expensive.</p>`;
    },
  },
});
