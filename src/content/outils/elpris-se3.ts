import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** SE3 : la zone la plus peuplée (Stockholm, Göteborg, Uppsala, Linköping selon Nätområden.se) ; angle : types de contrats. */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const kat = ['1', '2', '3'] as const;
  const rad = (k: (typeof kat)[number]) => ({ r: M.varde('rorligt', 'SE3', k)!, f1: M.varde('avtal1ar', 'SE3', k)!, f3: M.varde('avtal3ar', 'SE3', k)!, an: M.varde('anvisat', 'SE3', k)! });
  const rader = kat.map(rad);
  const jam = M.jamforAvtal('SE3', '3', 1500);
  const ar = [2022, 2023, 2024, 2025].map((y) => ({ y, s: M.arssnitt('rorligt', 'SE3', '3', y)!.snitt }));
  const e = M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!;
  const t = M.natTariff(e, 'V20')!;
  const p = M.totalpris({ spot: rader[2].r, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  return { mo, rader, jam, ar, t, p, stod: P.elstod.ore_per_kwh.SE3 };
};
const MAN = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const mn = (h: Helpers, m: string) => { const d = h.M.manadDelar(m); return `${MAN[h.lang][d.man - 1]} ${d.ar}`; };

export default defineGuide({
  id: 'elpris-se3',
  group: 'omrade',
  order: 30,
  tool: 'pris',
  toolProps: { nat: 'Vattenfall Eldistribution|Syd', zon: 'SE3', fall: 'V20' },
  related: ['elpris-stockholm', 'elpris-goteborg', 'fast-eller-rorligt', 'elpris-se4', 'elomraden'],
  sources: ['scbElpriser', 'natomraden', 'eiNat', 'skvEl'],
  sv: {
    slug: 'elpris-se3',
    nav: 'Elpris SE3 (Stockholm)',
    card: 'Mellersta Sverige: rörligt, fast och anvisat avtal jämförda.',
    title: 'Elpris SE3 2026: rörligt, fast och anvisat avtal per kWh',
    description: 'Elpris SE3 2026: SCB:s priser för rörligt, fast och anvisat avtal i Stockholm, Göteborg och Uppsala, plus energiskatt och nät. Räkna ut totalpriset per kWh.',
    h1: 'Elpris i SE3: vad avtalen kostar i Stockholm, Göteborg och Uppsala',
    intro: 'SE3 är elområdet där flest svenskar bor, från Värmland till Östergötland och upp till Gävle.',
    resume: (h) => {
      const v = V(h);
      const r = v.rader[2];
      return `I SE3 betalade en villa med elvärme ${h.ore(r.r)} exklusive moms för el med rörligt avtal i ${mn(h, h.M.SENASTE_MANAD)}, enligt SCB, mot ${h.ore(r.f1)} för ett nytecknat fastprisavtal på ett år och ${h.ore(r.an)} för den som aldrig valt avtal och ligger kvar på elhandlarens anvisade pris. Valet av avtal gör alltså skillnad även innan skatt och nät läggs på. Elområdet omfattar enligt Svenska kraftnäts karta bland annat nätområdena Stockholm, Göteborg, Uppsala, Linköping, Gävle och Karlstad. Med Vattenfall Eldistributions nät för en villa med 20 ampere, energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms blir det rörliga totalpriset ${h.ore(v.p.total)} per kWh. Kalkylatorn är förifylld med de siffrorna; byt till ditt eget spotpris och ditt eget nät, så ser du också vad månaden kostar med de fasta avgifterna.`;
    },
    faqs: (h) => {
      const v = V(h);
      const b = [...v.jam].sort((a, c) => a.kr - c.kr)[0];
      return [
        { q: 'Vilket avtal har varit billigast i SE3 det senaste året?', a: `För en elvärmd villa med 1 500 kWh i månaden blev det billigast med ${b.avtal === 'rorligt' ? 'rörligt pris' : b.avtal === 'avtal1ar' ? 'ettårigt fastpris' : b.avtal === 'avtal3ar' ? 'treårigt fastpris' : 'anvisat avtal'} under de tolv senaste månaderna SCB publicerat: ${h.kr(b.kr * v.mo)} för elenergin med moms. Nätavgift och skatt är desamma oavsett avtal, så det är bara elhandeln som skiljer. Ett kallt år kan ändra ordningen.` },
        { q: 'Vad är ett anvisat avtal och varför är det dyrare?', a: `Det är avtalet du får automatiskt när du flyttar in och inte väljer elhandlare. Elhandlaren som nätföretaget anvisat sätter priset. I SE3 låg det för en lägenhet på ${h.ore(v.rader[0].an)} exklusive moms senaste månaden, mot ${h.ore(v.rader[0].r)} för rörligt avtal, enligt SCB.` },
        { q: 'Hur mycket var elstödet i SE3 för vintern 2026?', a: `Hushåll i SE3 fick ${h.num(v.stod)} öre per kWh för förbrukningen i januari och februari 2026, upp till ${h.num(h.P.elstod.tak_kwh)} kWh per bostad, högst ${h.kr((v.stod * h.P.elstod.tak_kwh) / 100)}. Försäkringskassan betalade ut stödet från juni 2026 utan ansökan, till den som stod på elnätsavtalet den 28 februari.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const namn = ['Lägenhet', 'Villa utan elvärme', 'Villa med elvärme'];
      const rows = v.rader.map((r, i) => [namn[i], h.ore(r.r), h.ore(r.f1), h.ore(r.f3), h.ore(r.an)]);
      return `<h2>Fyra avtalstyper i SE3, senaste månaden</h2>
${h.table(['Bostad', 'Rörligt', 'Fast 1 år', 'Fast 3 år', 'Anvisat'], rows, `SCB, elhandelspris exkl. moms, energiskatt och nät, ${mn(h, h.M.SENASTE_MANAD)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>I SCB:s siffror betalar en lägenhet mer per kWh än en villa för samma avtalstyp, och den som aldrig valt avtal betalar mer än den som har rörligt pris. Fastprisavtalet är SCB:s snitt för avtal som tecknades den månaden, inte priset på ett avtal som löper sedan tidigare.</p>
<h2>Årssnitt för rörligt pris sedan 2022</h2>
${h.table(['År', 'Villa med elvärme, exkl. moms', 'Inkl. moms'], v.ar.map((x) => [String(x.y), h.ore(x.s), h.ore(x.s * v.mo)]), 'SCB, rörligt avtal, SE3, medel av månadspriserna.', ['l', 'r', 'r'])}
<p>Tabellen visar elhandeln. Lägg till nätet och energiskatten för att få det du betalar; skatten var ${h.ore(h.P.skatt.energiskatt_2025_ore)} år 2025 och är ${h.ore(h.P.skatt.energiskatt_ore)} i år. Månad för månad finns serien på sidan ${h.a('elpriser-per-manad', 'elpriser per månad')}, och ${h.a('fast-eller-rorligt', 'fast eller rörligt elpris')} räknar på din förbrukning.</p>
<h2>Nätet bestämmer resten</h2>
<p>SE3 rymmer de flesta av landets nätområden: i Svenska kraftnäts register finns fler i SE3 än i de tre andra tillsammans. Vattenfall Eldistributions villakunder med 20 ampere betalar enligt Energimarknadsinspektionen ${h.kr(v.t.fastKrPerAr * v.mo)} om året i fast avgift och ${h.ore(v.t.rorligOre * v.mo)} per kWh med moms. I ${h.a('elpris-stockholm', 'Stockholm')} och ${h.a('elpris-goteborg', 'Göteborg')} ser det annorlunda ut, och ${h.a('jamfor-natavgift', 'jämförelsen av nätavgifter')} visar alla.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-se3',
    nav: 'Price SE3 (Stockholm)',
    card: 'Central Sweden: variable, fixed and default contracts compared.',
    title: 'Electricity Price SE3 2026: Variable, Fixed and Default',
    description: 'Electricity price SE3 2026: Statistics Sweden prices for variable, fixed and default contracts in Stockholm and Gothenburg, plus tax and grid fee per kWh.',
    h1: 'Electricity price in SE3: what contracts cost in Stockholm and Gothenburg',
    intro: 'SE3 is the zone where most people in Sweden live, from Värmland to Östergötland and up to Gävle.',
    resume: (h) => {
      const v = V(h);
      const r = v.rader[2];
      return `In SE3 an electrically heated house on a variable contract paid ${h.ore(r.r)} before VAT for its energy in ${mn(h, h.M.SENASTE_MANAD)}, according to Statistics Sweden, against ${h.ore(r.f1)} for a newly signed one-year fixed price and ${h.ore(r.an)} for a household that never chose and stayed on the retailer’s default contract (anvisat avtal). The contract matters before tax and grid are even added. The zone covers, on Svenska kraftnät’s map, grid areas including Stockholm, Gothenburg, Uppsala, Linköping, Gävle and Karlstad. With Vattenfall Eldistribution’s grid for a 20 A house, energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT, the variable all-in price comes to ${h.ore(v.p.total)} per kWh. The calculator starts from those figures; swap in your own spot price and grid to see the month’s cost with fixed fees too.`;
    },
    faqs: (h) => {
      const v = V(h);
      const b = [...v.jam].sort((a, c) => a.kr - c.kr)[0];
      return [
        { q: 'Which contract has been cheapest in SE3 this past year?', a: `For a heated house using 1,500 kWh a month, the cheapest over the last twelve months published by Statistics Sweden was the ${b.avtal === 'rorligt' ? 'variable price' : b.avtal === 'avtal1ar' ? 'one-year fixed price' : b.avtal === 'avtal3ar' ? 'three-year fixed price' : 'default contract'}: ${h.kr(b.kr * v.mo)} for the energy with VAT. Grid fee and tax are the same whatever the contract.` },
        { q: 'What is a default contract, and why is it dearer?', a: `It is the contract you land on automatically after moving in without choosing a retailer, priced by the retailer the grid company appointed. In SE3 it stood at ${h.ore(v.rader[0].an)} before VAT for a flat last month, against ${h.ore(v.rader[0].r)} on a variable contract, according to Statistics Sweden. Newcomers often pay it for months.` },
        { q: 'How much was the 2026 electricity support in SE3?', a: `Households in SE3 received ${h.num(v.stod)} öre per kWh for consumption in January and February 2026, up to ${h.num(h.P.elstod.tak_kwh)} kWh per home, so at most ${h.kr((v.stod * h.P.elstod.tak_kwh) / 100)}. Försäkringskassan paid it from June 2026 with no application needed, to whoever held the grid contract on 28 February.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const namn = ['Flat', 'House without electric heating', 'House with electric heating'];
      const rows = v.rader.map((r, i) => [namn[i], h.ore(r.r), h.ore(r.f1), h.ore(r.f3), h.ore(r.an)]);
      return `<h2>Four contract types in SE3, latest month</h2>
${h.table(['Home', 'Variable', 'Fixed 1 yr', 'Fixed 3 yrs', 'Default'], rows, `Statistics Sweden, retail price before VAT, energy tax and grid, ${mn(h, h.M.SENASTE_MANAD)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>In SCB’s figures a flat pays more per kWh than a house on the same contract type, and households that never chose a contract pay more than those on a variable price. The fixed price is the average of contracts signed that month, not the price of one you already hold.</p>
<h2>Yearly averages for the variable price since 2022</h2>
${h.table(['Year', 'Heated house, before VAT', 'Incl. VAT'], v.ar.map((x) => [String(x.y), h.ore(x.s), h.ore(x.s * v.mo)]), 'Statistics Sweden, variable contract, SE3, mean of monthly prices.', ['l', 'r', 'r'])}
<p>The table covers retail energy only. Add grid and energy tax to get what you pay; the tax was ${h.ore(h.P.skatt.energiskatt_2025_ore)} in 2025 and is ${h.ore(h.P.skatt.energiskatt_ore)} this year. Month by month, the series is on ${h.a('elpriser-per-manad', 'electricity prices by month')}, and ${h.a('fast-eller-rorligt', 'fixed or variable price')} works it out for your consumption.</p>
<h2>The grid decides the rest</h2>
<p>SE3 holds most of the country’s grid areas: Svenska kraftnät’s register lists more in SE3 than in the other three zones combined. Vattenfall Eldistribution’s 20 A house customers pay, in Energy Markets Inspectorate data, ${h.kr(v.t.fastKrPerAr * v.mo)} a year in fixed fees and ${h.ore(v.t.rorligOre * v.mo)} per kWh with VAT. In ${h.a('elpris-stockholm', 'Stockholm')} and ${h.a('elpris-goteborg', 'Gothenburg')} the picture differs, and the ${h.a('jamfor-natavgift', 'grid-fee comparison')} shows every area.</p>`;
    },
  },
});
