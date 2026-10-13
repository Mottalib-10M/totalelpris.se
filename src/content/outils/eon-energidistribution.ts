import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** E.ON Energidistribution : relevé Ei 2026 (REL03028, zones Syd & Mellersta, Stockholm, Norr, prix différents) ; Nätområden.se (SE2, SE3, SE4). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const omr = ['Syd', 'Stockholm', 'Norr'].map((g) => {
    const e = M.hittaEnhet('E.ON Energidistribution', g)!;
    const t = M.natTariff(e, 'V16')!, l = M.natTariff(e, 'L16')!, v20 = M.natTariff(e, 'V20')!;
    return { g: e.grupp, e, t, l, v20, t25: M.natTariff(e, 'V16', 2025)!, pl: M.placering(e, 'V16') };
  });
  const syd = omr[0];
  const fastAndring = syd.t.fastKrPerAr - syd.t25.fastKrPerAr;
  const rorAndring = syd.t.rorligOre - syd.t25.rorligOre;
  const spot = M.varde('rorligt', 'SE4', '2')!;
  const p = M.totalpris({ spot, natOverforing: syd.t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const tva = syd.e.cas.V20?.['2026']?.rorlig ?? [];
  return { mo, omr, syd, fastAndring, rorAndring, spot, p, tva };
};

export default defineGuide({
  id: 'eon-energidistribution',
  group: 'nat',
  order: 40,
  tool: 'nat',
  toolProps: { nat: 'E.ON Energidistribution|Syd', fall: 'V16' },
  related: ['elpris-malmo', 'jamfor-natavgift', 'vattenfall-eldistribution', 'natavgift', 'elpris-se4'],
  sources: ['eiNat', 'natomraden', 'scbElpriser'],
  sv: {
    slug: 'eon-natavgift',
    nav: 'E.ON Energidistribution',
    card: 'E.ON:s nätavgift 2026 i områdena Syd och Mellersta, Stockholm och Norr.',
    title: 'E.ON nätavgift 2026: Syd, Stockholm och Norr jämförda',
    description: 'E.ON nätavgift 2026: Energimarknadsinspektionens priser för E.ON Energidistributions områden, lägenhet och villa, fast avgift och överföring per kWh, med moms.',
    h1: 'E.ON Energidistributions nätavgift i tre områden',
    intro: 'E.ON Energidistribution har olika priser i sina tre områden. Var du bor avgör vad du betalar.',
    resume: (h) => {
      const v = V(h);
      const [s, st, n] = v.omr;
      return `En villa med 16 ampere och 5 000 kWh om året betalar ${h.kr(s.t.totalKrPerAr * v.mo)} om året i nätavgift till E.ON Energidistribution i området Syd och Mellersta, ${h.kr(st.t.totalKrPerAr * v.mo)} i området Stockholm och ${h.kr(n.t.totalKrPerAr * v.mo)} i området Norr, moms inräknad, enligt Energimarknadsinspektionens sammanställning för ${h.P.year}. Skillnaden mellan billigaste och dyraste området är alltså ${h.kr((n.t.totalKrPerAr - st.t.totalKrPerAr) * v.mo)} om året för samma hus. Enligt Svenska kraftnäts karta äger E.ON Energidistribution nätområden i SE2, SE3 och SE4, bland annat Malmö-Burlöv. De fasta avgifterna och överföringsavgifterna är desamma som 2025; det som ändrats är myndighetsavgifterna, som höjdes till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} om året exklusive moms. Med SCB:s snitt för rörligt avtal i SE4 blir totalpriset för villan i Syd och Mellersta ${h.ore(v.p.total)} per kWh. Välj ditt område i verktyget.`;
    },
    faqs: (h) => {
      const v = V(h);
      const [s] = v.omr;
      return [
        { q: 'Vilket E.ON-område tillhör jag?', a: 'Det står på din elnätsfaktura från E.ON Energidistribution. Energimarknadsinspektionen redovisar bolagets priser för tre områden: Syd och Mellersta, Stockholm och Norr. På Svenska kraftnäts karta på Nätområden.se ser du vilket nätområde din adress ligger i och vem som äger det.' },
        { q: 'Varför har E.ON två olika överföringsavgifter för villa?', a: `För villor med 20 ampere redovisar Energimarknadsinspektionen två rörliga priser hos E.ON i området Syd och Mellersta${v.tva.length === 2 ? `, ${h.num(v.tva[0], 1)} och ${h.num(v.tva[1], 1)} öre per kWh exklusive moms` : ''}. Tabellen anger inte vad de två priserna avser, och vi gissar inte. Din prislista från E.ON visar när respektive pris gäller och hur det påverkar din förbrukning.` },
        { q: 'Höjde E.ON nätavgiften till 2026?', a: `Enligt Energimarknadsinspektionens uppgifter är E.ON Energidistributions fasta avgifter och överföringsavgifter för ${h.P.year} desamma som för 2025 i alla tre områdena. Årskostnaden steg ändå något, eftersom myndighetsavgifterna, som ingår i den fasta delen, höjdes från ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.omr.map((x) => [x.g, h.kr(x.l.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.v20.totalKrPerAr * v.mo), `${h.num(x.pl.plats)} av ${h.num(x.pl.av)}`]);
      return `<h2>Tre områden, tre prisnivåer</h2>
${h.table(['Område', 'Lägenhet 16 A', 'Villa 16 A', 'Villa 20 A', 'Plats, villa 16 A'], rows, `Energimarknadsinspektionen ${h.P.year}, kr per år inkl. moms. Plats: 1 = billigast bland nätområden med pris för villa 16 A.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Området Stockholm är billigast i alla typfall och Norr dyrast. För en villa med 16 ampere hamnar Syd och Mellersta på plats ${h.num(v.syd.pl.plats)} bland alla landets nätområden. E.ON skiljer sig därmed från Vattenfall Eldistribution, som har samma pris i hela sitt nät.</p>
<h2>Fast och rörligt hos E.ON</h2>
<p>I området Syd och Mellersta är den fasta avgiften för villa med 16 ampere ${h.kr(v.syd.t.fastKrPerAr * v.mo)} om året och överföringsavgiften i snitt ${h.ore(v.syd.t.rorligOre * v.mo)} per kWh, båda med moms. Jämfört med 2025 har den fasta delen ändrats med ${h.kr(v.fastAndring * v.mo)} om året, vilket motsvarar höjningen av myndighetsavgifterna, och överföringsavgiften med ${h.ore(v.rorAndring * v.mo)}. För en villa med 20 ampere är förhållandet annorlunda: abonnemanget är betydligt högre och överföringen per kWh lägre. Det gör att en stor förbrukare betalar mindre per kWh än en liten med samma nät.</p>
<h2>E.ON i Malmö</h2>
<p>Nätområdet Malmö-Burlöv ägs av E.ON Energidistribution och ligger i SE4. Där kombineras södra Sveriges högsta spotpriser med E.ON:s nätavgift. Sidan om ${h.a('elpris-malmo', 'elpris i Malmö')} räknar ut totalpriset, och ${h.a('jamfor-natavgift', 'jämförelsen')} visar hur E.ON står sig mot alla andra nät.</p>`;
    },
  },
  en: {
    slug: 'eon-grid-fee',
    nav: 'E.ON Energidistribution',
    card: 'E.ON’s 2026 grid fee in its Syd och Mellersta, Stockholm and Norr areas.',
    title: 'E.ON Grid Fee 2026: Syd, Stockholm and Norr Compared',
    description: 'E.ON grid fee 2026: Energy Markets Inspectorate prices for E.ON Energidistribution’s three areas, flat and house, fixed fee and transfer fee per kWh with VAT.',
    h1: 'E.ON Energidistribution’s grid fee in three areas',
    intro: 'E.ON Energidistribution charges different prices in its three areas. Where you live decides what you pay.',
    resume: (h) => {
      const v = V(h);
      const [s, st, n] = v.omr;
      return `A house with a 16 A fuse using 5,000 kWh a year pays ${h.kr(s.t.totalKrPerAr * v.mo)} a year in grid fees to E.ON Energidistribution in its Syd och Mellersta area, ${h.kr(st.t.totalKrPerAr * v.mo)} in its Stockholm area and ${h.kr(n.t.totalKrPerAr * v.mo)} in its Norr area, VAT included, according to the Energy Markets Inspectorate’s ${h.P.year} compilation. The gap between the cheapest and dearest area is ${h.kr((n.t.totalKrPerAr - st.t.totalKrPerAr) * v.mo)} a year for the same house. On Svenska kraftnät’s map E.ON Energidistribution owns grid areas in SE2, SE3 and SE4, including Malmö-Burlöv. Fixed fees and transfer fees are unchanged from 2025; what changed is the authority charges, raised to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} a year before VAT. At the Statistics Sweden average variable price in SE4, the house in Syd och Mellersta pays ${h.ore(v.p.total)} per kWh all-in. Pick your area in the tool.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Which E.ON area do I belong to?', a: 'It is on your grid bill from E.ON Energidistribution. The regulator reports the company’s prices for three areas: Syd och Mellersta, Stockholm and Norr. Svenska kraftnät’s map on Nätområden.se shows which grid area your address is in and who owns it.' },
        { q: 'Why does E.ON have two transfer fees for houses?', a: `For 20 A houses the regulator lists two variable prices at E.ON in Syd och Mellersta${v.tva.length === 2 ? `, ${h.num(v.tva[0], 1)} and ${h.num(v.tva[1], 1)} öre per kWh before VAT` : ''}. The table does not say what the two prices cover, and we do not guess. Your E.ON price list shows when each applies and how it affects your use.` },
        { q: 'Did E.ON raise its grid fee for 2026?', a: `In the regulator’s data, E.ON Energidistribution’s fixed and transfer fees for ${h.P.year} are the same as for 2025 in all three areas. The annual cost still rose slightly, because the authority charges included in the fixed part went up from ${h.kr(h.P.nat.myndighetsavgifter_kr['2025'])} to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.omr.map((x) => [x.g, h.kr(x.l.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.kr(x.v20.totalKrPerAr * v.mo), `${h.num(x.pl.plats)} of ${h.num(x.pl.av)}`]);
      return `<h2>Three areas, three price levels</h2>
${h.table(['Area', 'Flat 16 A', 'House 16 A', 'House 20 A', 'Rank, house 16 A'], rows, `Energy Markets Inspectorate ${h.P.year}, SEK a year incl. VAT. Rank: 1 = cheapest among grid areas priced for a 16 A house.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The Stockholm area is cheapest in every case and Norr dearest. For a 16 A house, Syd och Mellersta ranks ${h.num(v.syd.pl.plats)} among all the country’s grid areas. That sets E.ON apart from Vattenfall Eldistribution, which charges the same across its whole network.</p>
<h2>Fixed and variable at E.ON</h2>
<p>In Syd och Mellersta the fixed fee for a 16 A house is ${h.kr(v.syd.t.fastKrPerAr * v.mo)} a year and the transfer fee averages ${h.ore(v.syd.t.rorligOre * v.mo)} per kWh, both with VAT. Compared with 2025 the fixed part changed by ${h.kr(v.fastAndring * v.mo)} a year, matching the rise in authority charges, and the transfer fee by ${h.ore(v.rorAndring * v.mo)}. For a 20 A house the balance differs: the subscription is much higher and the transfer per kWh lower, so a large user pays less per kWh than a small one on the same grid.</p>
<h2>E.ON in Malmö</h2>
<p>The Malmö-Burlöv grid area is owned by E.ON Energidistribution and lies in SE4, where southern Sweden’s highest spot prices meet E.ON’s grid fee. The page on ${h.a('elpris-malmo', 'electricity price in Malmö')} works out the all-in price, and the ${h.a('jamfor-natavgift', 'comparison')} shows how E.ON compares with every other grid.</p>`;
    },
  },
});
