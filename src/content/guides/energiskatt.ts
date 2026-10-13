import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Energiskatt sur l'électricité 2026 : taux, avdrag nordique, historique, moms sur la taxe, statut 2027. */
const V = (h: Helpers) => {
  const { P } = h;
  const mo = 1 + P.skatt.moms;
  const s = P.skatt;
  const villa = (kwh: number, ore: number) => (kwh * ore * mo) / 100;
  return { mo, s, inkl: s.energiskatt_ore * mo, sanktInkl: s.energiskatt_sankt_ore * mo, f25inkl: s.energiskatt_2025_ore * mo, sank: (s.energiskatt_2025_ore - s.energiskatt_ore) * mo, villa };
};

export default defineGuide({
  id: 'energiskatt',
  group: 'guide',
  order: 10,
  mini: 'energiskatt',
  related: ['elpris-se1', 'elpris-se2', 'elrakning', 'elstod', 'natavgift'],
  sources: ['lse', 'skvEl', 'skvSankt2026', 'pm2027', 'embEnergiskatt', 'skvMoms'],
  sv: {
    slug: 'energiskatt-el',
    nav: 'Energiskatt på el',
    card: 'Skattesatsen 2026, avdraget i norr och vad som händer 2027.',
    title: 'Energiskatt el 2026: 36 öre per kWh, 45 öre med moms',
    description: 'Energiskatt på el 2026: 36 öre per kWh exkl. moms, 26,4 öre i norra Sverige. Historiken sedan 2020, momsen på skatten och vad som gäller 2027. Räkna din skatt.',
    h1: 'Energiskatt på el: skattesatsen, avdraget i norr och 2027',
    intro: 'Energiskatten är den enskilt största delen av elpriset som inte beror på marknaden.',
    resume: (h) => {
      const v = V(h);
      return `Energiskatten på el är ${h.ore(v.s.energiskatt_ore)} exklusive moms från den 1 januari ${h.P.year}, enligt 11 kapitlet 3 § lagen om skatt på energi och Skatteverket. Eftersom momsen på 25 procent också läggs på skatten betalar ett hushåll ${h.ore(v.inkl)} per kilowattimme. Det är en sänkning från ${h.ore(v.s.energiskatt_2025_ore)} år 2025, eller ${h.ore(v.sank)} mindre per kWh med moms. I Norrbottens, Västerbottens och Jämtlands län och i några kommuner längre söderut gör nätföretaget dessutom ett avdrag på ${h.ore(v.s.norrlandsavdrag_ore)}, så att hushållen där betalar ${h.ore(v.s.energiskatt_sankt_ore)} exklusive moms. Skatten tas ut av ditt elnätsföretag och står på nätfakturan. För en elvärmd villa med 20 000 kWh om året blir den ${h.kr(v.villa(20000, v.s.energiskatt_ore))} med moms. Hur mycket det blir för 2027 är inte beslutat.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Vem tar ut energiskatten på min el?', a: 'Elnätsföretaget. Det är skattskyldigt och redovisar skatten till Skatteverket, och den står därför på nätfakturan, inte hos elhandlaren. Byter du elhandlare påverkar det alltså inte skatten. Har du en samlad faktura från elhandlaren finns skatten ändå med som en egen rad som nätföretaget bestämt.' },
        { q: 'Betalar man moms på energiskatten?', a: `Ja. Energiskatten är en punktskatt och momsen räknas på summan av elpris, nätavgift och skatt. Energimarknadsbyrån räknar därför med ${h.ore(v.inkl)} per kWh inklusive moms för ${h.P.year}. Det betyder att en sänkning av skatten med en öre sänker priset med en och en kvarts öre.` },
        { q: 'Vilka kommuner har sänkt energiskatt på el?', a: 'Alla kommuner i Norrbottens, Västerbottens och Jämtlands län, Sollefteå, Ånge och Örnsköldsvik i Västernorrland, Ljusdal i Gävleborg, Malung-Sälen, Mora, Orsa och Älvdalen i Dalarna och Torsby i Värmland. Listan står i 11 kapitlet 4 § lagen om skatt på energi och gäller hushåll och tjänsteföretag.' },
        { q: 'Blir energiskatten högre 2027?', a: `Lagen säger att beloppet från 2027 räknas om efter prisutvecklingen och fastställs av regeringen före utgången av november. En promemoria från mars ${h.P.year} föreslår i stället att ${h.ore(v.s.energiskatt_ore)} ska gälla även 2027. Förslaget var inte beslutat i oktober ${h.P.year}; vi uppdaterar när beslutet finns.` },
        { q: 'Hur mycket sparar en villa på sänkningen 2026?', a: `Sänkningen är ${h.ore(v.s.energiskatt_2025_ore - v.s.energiskatt_ore)} exklusive moms. För en elvärmd villa med 20 000 kWh om året blir det ${h.kr(v.villa(20000, v.s.energiskatt_2025_ore - v.s.energiskatt_ore))} mindre i skatt med moms, och för en lägenhet med 2 000 kWh ${h.kr(v.villa(2000, v.s.energiskatt_2025_ore - v.s.energiskatt_ore))}. Avdraget i norr ändrades inte.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.s.historik.map(([ar, ore]) => [String(ar), h.ore(ore), h.ore(ore * v.mo)]);
      return `<h2>Skattesatsen år för år</h2>
${h.table(['År', 'Exkl. moms', 'Inkl. moms'], rows, 'Skatteverket, Skatt på el, skattesatser för tidigare år och 2026. Normal skattesats, öre per kWh.', ['l', 'r', 'r'])}
<p>Skatten låg runt 35 till 36 öre fram till 2022, steg sedan tre år i rad och nådde ${h.ore(v.s.energiskatt_2025_ore)} år 2025. Från den 1 januari ${h.P.year} är den tillbaka på ${h.ore(v.s.energiskatt_ore)}. Sänkningen kom genom en ändring av lagen om skatt på energi (SFS 2025:1357) och syns direkt på nätfakturan, utan att du behöver göra något. Skatteverkets nyhet om sänkningen säger också att avdraget i norra Sverige inte påverkas.</p>
<h2>Avdraget i norra Sverige</h2>
<p>I lagen är den lägre skatten inte en egen skattesats utan ett avdrag. Nätföretaget får dra av ${h.ore(v.s.norrlandsavdrag_ore)} per förbrukad kWh för el som används i vissa kommuner, av hushåll och av företag inom tjänstesektorn. Industri, jord- och skogsbruk, vattenbruk och några andra verksamheter omfattas inte, eftersom de har egna regler. För ett hushåll i Luleå, Umeå eller Östersund blir skatten därmed ${h.ore(v.s.energiskatt_sankt_ore)} exklusive moms, ${h.ore(v.sanktInkl)} med moms.</p>
${h.table(['Län', 'Kommuner med avdrag'], Object.entries(v.s.sankt_kommuner).map(([lan, k]) => [lan, k as string]), '11 kap. 4 § lagen (1994:1776) om skatt på energi.', ['l', 'l'])}
<p>Gränsen följer kommunerna, inte elområdena. Sundsvall och Umeå ligger båda i ${h.a('elpris-se2', 'SE2')}, men bara Umeå har avdraget. Mora har det men inte Falun. Kontrollera alltid din egen kommun innan du räknar med den lägre skatten; i kalkylatorn slår du på eller av avdraget med ett reglage.</p>
<p>Flyttar du från till exempel Umeå till Sundsvall under året följer skatten med adressen, inte med dig: från inflyttningsdagen gäller den skattesats som hör till den nya kommunen, och nätföretaget i den nya bostaden räknar fram beloppet. Har du fritidshus i fjällen och permanentbostad längre söderut kan de två elräkningarna alltså ha olika energiskatt, även om du har samma elhandlare för båda.</p>
<h2>Vad skatten blir för tre vanliga hushåll</h2>
${h.table(['Hushåll', 'kWh per år', 'Normal skatt inkl. moms', 'Med avdraget i norr'], [['Mindre lägenhet', h.num(h.P.forbrukning.lagenhet_liten), h.kr(v.villa(h.P.forbrukning.lagenhet_liten, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.lagenhet_liten, v.s.energiskatt_sankt_ore))], ['Villa utan elvärme', h.num(h.P.forbrukning.villa_utan_elvarme), h.kr(v.villa(h.P.forbrukning.villa_utan_elvarme, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.villa_utan_elvarme, v.s.energiskatt_sankt_ore))], ['Villa med elvärme', h.num(h.P.forbrukning.villa_elvarme), h.kr(v.villa(h.P.forbrukning.villa_elvarme, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.villa_elvarme, v.s.energiskatt_sankt_ore))]], 'Förbrukning enligt Energimarknadsbyrån. Skatt per år, öre/kWh × kWh, moms 25 % inräknad.', ['l', 'r', 'r', 'r'])}
<p>Energimarknadsbyrån anger omkring 2 000 kWh om året för en mindre lägenhet, omkring 5 000 kWh för en villa där värme och varmvatten inte kommer från el och omkring 20 000 kWh för en genomsnittlig elvärmd villa. Skillnaden mellan raderna är alltså nästan helt förbrukningen: skatten är densamma per kWh för alla hushåll i en kommun. För den elvärmda villan i Norrbotten är avdraget värt mer än många hushålls hela skattebelopp i en lägenhet.</p>
<h2>Det som inte är energiskatt</h2>
<p>På fakturan finns fler rader som ibland förväxlas med skatt. Myndighetsavgifterna på ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms finansierar elsäkerhet, nätövervakning och elberedskap och ingår i nätets fasta del. Kostnaden för elcertifikat är en del av elhandlarens pris, enligt Energimyndigheten i snitt ${h.num(h.P.marknad.elcertifikat_ore_2023, 1)} öre per kWh år 2023. Ingen av dem påverkas av ändringar i energiskatten, och ingen av dem ger avdrag i norr.</p>
<h2>Så räknas skatten på fakturan</h2>
<p>Skatten tas ut per förbrukad kilowattimme och påverkas inte av när på dygnet du använder elen, av ditt elområde eller av ditt avtal. Den räknas på den mätta förbrukningen, och nätföretaget lägger den på nätfakturan. Därefter läggs moms på hela summan.</p>
<ol>
<li>Förbrukning i kWh under månaden, enligt elmätaren.</li>
<li>Gånger ${h.ore(v.s.energiskatt_ore)} (eller ${h.ore(v.s.energiskatt_sankt_ore)} med avdraget).</li>
<li>Plus 25 procent moms, tillsammans med nätavgiften och, om du har samlad faktura, elhandeln.</li>
</ol>
<p>Ett exempel: 1 500 kWh i en elvärmd villa i januari ger ${h.kr((1500 * v.s.energiskatt_ore) / 100)} i energiskatt och ${h.kr((1500 * v.s.energiskatt_ore * h.P.skatt.moms) / 100)} i moms på skatten, totalt ${h.kr((1500 * v.inkl) / 100)}. Med avdraget i norr blir det ${h.kr((1500 * v.sanktInkl) / 100)}.</p>
<h2>Skattens andel av totalpriset</h2>
<p>När spotpriset är lågt blir skatten den största delen av det rörliga priset. Med ett spotpris på 30 öre, en överföringsavgift på 25 öre och energiskatten på ${h.ore(v.s.energiskatt_ore)} är skatten med sin moms ${h.ore(v.inkl)} av totalt ${h.ore((30 + 25 + v.s.energiskatt_ore) * v.mo)}. När spotpriset stiger till 150 öre är skatten densamma i kronor men en mindre andel. Det är därför ett negativt eller mycket lågt börspris aldrig gör elen gratis för ett hushåll; se ${h.a('negativa-elpriser', 'negativa elpriser')}.</p>
<h2>Det som gäller 2027</h2>
<p>Enligt lagens nuvarande lydelse ska skatten för 2027 och senare år räknas om efter konsumentprisindex och fastställas av regeringen före november månads utgång. Finansdepartementet skickade i mars ${h.P.year} ut ${h.src('pm2027', 'promemorian Slopad indexering av energiskatten på el')} på remiss. Den föreslår att ${h.ore(v.s.energiskatt_ore)} ska gälla även från den 1 januari 2027, tills vidare. Regeringen har sagt att det beror på budgetläget om förslaget läggs fram. Den 12 oktober ${h.P.year} hade budgetpropositionen för 2027 inte lämnats till riksdagen. Vi ändrar inte siffran förrän ett beslut finns, och sidan visar då datum och källa.</p>
<p>Vill du se vad skatten betyder för din egen räkning, använd ${h.a('elrakning', 'kalkylatorn för elräkningen')}. Om elstöd och annan ersättning, se ${h.a('elstod', 'elstöd 2026')}.</p>`;
    },
  },
  en: {
    slug: 'energy-tax-electricity-sweden',
    nav: 'Energy tax on electricity',
    card: 'The 2026 rate, the northern deduction and what happens in 2027.',
    title: 'Energy Tax on Electricity 2026: 36 öre per kWh, 45 with VAT',
    description: 'Energy tax on electricity in Sweden, 2026: 36 öre per kWh before VAT, 26.4 öre in the north. History since 2020, VAT on the tax and the outlook for 2027.',
    h1: 'Energy tax on electricity: the rate, the northern deduction and 2027',
    intro: 'Energy tax is the largest part of the electricity price that does not depend on the market.',
    resume: (h) => {
      const v = V(h);
      return `Energy tax on electricity in Sweden (energiskatt) is ${h.ore(v.s.energiskatt_ore)} before VAT from 1 January ${h.P.year}, under chapter 11, section 3 of the Energy Tax Act and as confirmed by the Swedish Tax Agency (Skatteverket). Because 25% VAT also goes on the tax, a household pays ${h.ore(v.inkl)} per kilowatt-hour. That is a cut from ${h.ore(v.s.energiskatt_2025_ore)} in 2025, or ${h.ore(v.sank)} less per kWh with VAT. In Norrbotten, Västerbotten and Jämtland counties and a few municipalities further south, the grid company also deducts ${h.ore(v.s.norrlandsavdrag_ore)}, so households there pay ${h.ore(v.s.energiskatt_sankt_ore)} before VAT. The tax is collected by your grid company and appears on the grid bill. For an electrically heated house using 20,000 kWh a year it comes to ${h.kr(v.villa(20000, v.s.energiskatt_ore))} with VAT. The 2027 rate has not been decided.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Who collects energy tax on my electricity?', a: 'The grid company. It is liable for the tax and reports it to the Swedish Tax Agency, so the tax appears on your grid bill, not the retailer’s. Switching retailer therefore leaves the tax unchanged. If your retailer sends a combined invoice, the tax still appears as its own line set by the grid company.' },
        { q: 'Is VAT charged on top of the energy tax?', a: `Yes. Energy tax is an excise duty, and VAT is calculated on the sum of energy price, grid fee and tax. Energimarknadsbyrån therefore quotes ${h.ore(v.inkl)} per kWh including VAT for ${h.P.year}. A one-öre cut in the tax lowers your price by one and a quarter öre.` },
        { q: 'Which municipalities have reduced energy tax?', a: 'Every municipality in Norrbotten, Västerbotten and Jämtland counties; Sollefteå, Ånge and Örnsköldsvik in Västernorrland; Ljusdal in Gävleborg; Malung-Sälen, Mora, Orsa and Älvdalen in Dalarna; and Torsby in Värmland. The list is in chapter 11, section 4 of the Energy Tax Act and covers households and service businesses.' },
        { q: 'Will energy tax rise in 2027?', a: `The Act says that from 2027 the amount is indexed to prices and set by the government before the end of November. A March ${h.P.year} memorandum proposes keeping ${h.ore(v.s.energiskatt_ore)} in 2027 instead. As of October ${h.P.year} the proposal had not been adopted; we will update once a decision exists.` },
        { q: 'How much does a house save from the 2026 cut?', a: `The cut is ${h.ore(v.s.energiskatt_2025_ore - v.s.energiskatt_ore)} before VAT. For an electrically heated house using 20,000 kWh a year that is ${h.kr(v.villa(20000, v.s.energiskatt_2025_ore - v.s.energiskatt_ore))} less tax with VAT, and ${h.kr(v.villa(2000, v.s.energiskatt_2025_ore - v.s.energiskatt_ore))} for a flat using 2,000 kWh. The northern deduction was not changed and is still the same in öre.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.s.historik.map(([ar, ore]) => [String(ar), h.ore(ore), h.ore(ore * v.mo)]);
      return `<h2>The rate year by year</h2>
${h.table(['Year', 'Before VAT', 'With VAT'], rows, 'Swedish Tax Agency, tax on electricity, rates for earlier years and 2026. Standard rate, öre per kWh.', ['l', 'r', 'r'])}
<p>The tax sat around 35 to 36 öre until 2022, then rose three years running and reached ${h.ore(v.s.energiskatt_2025_ore)} in 2025. From 1 January ${h.P.year} it is back at ${h.ore(v.s.energiskatt_ore)}. The cut came through an amendment to the Energy Tax Act (SFS 2025:1357) and shows directly on the grid bill, with nothing for you to do. The Tax Agency’s announcement also notes that the northern deduction is unaffected.</p>
<h2>The northern deduction</h2>
<p>In law the lower tax is not a separate rate but a deduction. The grid company may deduct ${h.ore(v.s.norrlandsavdrag_ore)} per kWh for power used in certain municipalities by households and service-sector businesses. Industry, farming and forestry, aquaculture and some other activities are excluded because they have their own rules. For a household in Luleå, Umeå or Östersund the tax is therefore ${h.ore(v.s.energiskatt_sankt_ore)} before VAT, ${h.ore(v.sanktInkl)} with VAT.</p>
${h.table(['County (län)', 'Municipalities with the deduction'], Object.entries(v.s.sankt_kommuner).map(([lan, k]) => [lan, (k as string).replace('samtliga kommuner', 'all municipalities')]), 'Energy Tax Act (1994:1776), chapter 11, section 4.', ['l', 'l'])}
<p>The line follows municipalities, not bidding zones. Sundsvall and Umeå are both in ${h.a('elpris-se2', 'SE2')}, but only Umeå has the deduction; Mora has it, Falun does not. Check your own municipality before counting on the lower rate; the calculator has a switch for it.</p>
<h2>The tax for three typical households</h2>
${h.table(['Household', 'kWh a year', 'Standard tax incl. VAT', 'With the northern deduction'], [['Smaller flat', h.num(h.P.forbrukning.lagenhet_liten), h.kr(v.villa(h.P.forbrukning.lagenhet_liten, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.lagenhet_liten, v.s.energiskatt_sankt_ore))], ['House without electric heating', h.num(h.P.forbrukning.villa_utan_elvarme), h.kr(v.villa(h.P.forbrukning.villa_utan_elvarme, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.villa_utan_elvarme, v.s.energiskatt_sankt_ore))], ['House with electric heating', h.num(h.P.forbrukning.villa_elvarme), h.kr(v.villa(h.P.forbrukning.villa_elvarme, v.s.energiskatt_ore)), h.kr(v.villa(h.P.forbrukning.villa_elvarme, v.s.energiskatt_sankt_ore))]], 'Consumption as given by Energimarknadsbyrån. Tax per year, öre/kWh × kWh, 25% VAT included.', ['l', 'r', 'r', 'r'])}
<p>Energimarknadsbyrån puts a smaller flat at about 2,000 kWh a year, a house heated by something other than electricity at about 5,000 kWh and an average electrically heated house at about 20,000 kWh. The gap between the rows is almost entirely consumption: the tax per kWh is the same for every household in a municipality.</p>
<h2>What is not energy tax</h2>
<p>Other bill lines are sometimes mistaken for tax. The authority charges of ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT fund electrical safety, grid supervision and emergency preparedness, and sit in the grid’s fixed part. The cost of electricity certificates is part of the retailer’s price, on average ${h.num(h.P.marknad.elcertifikat_ore_2023, 1)} öre per kWh in 2023 according to the Swedish Energy Agency. Neither changes with energy tax, and neither qualifies for the northern deduction.</p>
<h2>How the tax is worked out on the bill</h2>
<p>The tax is charged per kilowatt-hour used and does not depend on the time of day, your bidding zone or your contract. It is based on metered consumption, and the grid company adds it to the grid bill; VAT then goes on the whole sum.</p>
<ol>
<li>Consumption in kWh over the month, from the meter.</li>
<li>Times ${h.ore(v.s.energiskatt_ore)} (or ${h.ore(v.s.energiskatt_sankt_ore)} with the deduction).</li>
<li>Plus 25% VAT, together with the grid fee and, on a combined invoice, the retail energy.</li>
</ol>
<p>An example: 1,500 kWh in an electrically heated house in January gives ${h.kr((1500 * v.s.energiskatt_ore) / 100)} of energy tax and ${h.kr((1500 * v.s.energiskatt_ore * h.P.skatt.moms) / 100)} of VAT on that tax, ${h.kr((1500 * v.inkl) / 100)} in total. With the northern deduction it is ${h.kr((1500 * v.sanktInkl) / 100)}.</p>
<h2>The tax’s share of the all-in price</h2>
<p>When the spot price is low, the tax becomes the largest part of the variable price. With a 30 öre spot price, a 25 öre transfer fee and energy tax of ${h.ore(v.s.energiskatt_ore)}, the tax with its VAT is ${h.ore(v.inkl)} out of ${h.ore((30 + 25 + v.s.energiskatt_ore) * v.mo)}. When the spot price climbs to 150 öre the tax is the same in kronor but a smaller share. That is why a negative or very low exchange price never makes power free for a household; see ${h.a('negativa-elpriser', 'negative electricity prices')}.</p>
<h2>What applies in 2027</h2>
<p>Under the Act as it stands, the tax for 2027 onwards is to be indexed to the consumer price index and set by the government before the end of November. In March ${h.P.year} the Ministry of Finance sent out the ${h.src('pm2027', 'memorandum on ending the indexation of energy tax on electricity')} for consultation. It proposes keeping ${h.ore(v.s.energiskatt_ore)} from 1 January 2027 until further notice. The government said whether it goes ahead depends on the budget situation. On 12 October ${h.P.year} the 2027 budget bill had not been presented to parliament. We will not change the figure until a decision exists, and the page will then show the date and source.</p>
<p>To see what the tax means for your own bill, use the ${h.a('elrakning', 'electricity bill calculator')}. For support payments, see ${h.a('elstod', 'electricity support 2026')}.</p>`;
    },
  },
});
