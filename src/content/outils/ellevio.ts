import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Ellevio : relevé Ei 2026 (REL03035, zones Mellansverige, Edsbyn, Västkusten ; cas lägenhet seulement), Nätområden.se (zones SE2/SE3). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const omr = ['Mellansverige', 'Edsbyn', 'Västkusten'].map((g) => {
    const e = M.hittaEnhet('Ellevio', g)!;
    return { g, e, t: M.natTariff(e, 'L16')!, t25: M.natTariff(e, 'L16', 2025)!, pl: M.placering(e, 'L16'), pkt: e.cas.L16?.['2026']?.punkter ?? 0 };
  });
  const m = omr[0];
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: m.t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const fastAndel = m.t.fastKrPerAr / m.t.totalKrPerAr;
  return { mo, omr, m, spot, p, fastAndel, pkt: omr.reduce((a, x) => a + x.pkt, 0) };
};

export default defineGuide({
  id: 'ellevio',
  group: 'nat',
  order: 20,
  tool: 'nat',
  toolProps: { nat: 'Ellevio|Mellansverige', fall: 'L16' },
  related: ['elpris-stockholm', 'jamfor-natavgift', 'effektavgift', 'natavgift', 'elpris-karlstad'],
  sources: ['eiNat', 'natomraden', 'eiEffekt'],
  sv: {
    slug: 'ellevio-natavgift',
    nav: 'Ellevio',
    card: 'Ellevios nätavgift för lägenhet 2026 enligt Energimarknadsinspektionen.',
    title: 'Ellevio nätavgift 2026: pris per kWh och fast avgift per år',
    description: 'Ellevio nätavgift 2026: fast avgift och överföringsavgift för lägenhet med 16 ampere enligt Ei, ändringen sedan 2025 och totalpriset per kWh i Stockholm.',
    h1: 'Ellevios nätavgift: vad en lägenhet betalar 2026',
    intro: 'Ellevio äger elnätet i bland annat Stockholm. Så ser avgiften ut i Energimarknadsinspektionens sammanställning.',
    resume: (h) => {
      const v = V(h);
      return `En lägenhet med 16 amperes säkring och 2 000 kWh om året betalar ${h.kr(v.m.t.totalKrPerAr * v.mo)} om året i nätavgift till Ellevio ${h.P.year}, moms inräknad, enligt Energimarknadsinspektionens sammanställning för Ellevios område Mellansverige. Av det är ${h.kr(v.m.t.fastKrPerAr * v.mo)} fast avgift och myndighetsavgifter, och överföringsavgiften är ${h.ore(v.m.t.rorligOre * v.mo)} per kWh med moms. Samma priser gäller i Ellevios områden Edsbyn och Västkusten. Jämfört med 2025 har lägenhetens nätkostnad ändrats med ${h.pct(v.m.t.totalKrPerAr / v.m.t25.totalKrPerAr - 1)}. Bland alla nätområden med ett lägenhetspris hamnar Ellevio på plats ${h.num(v.m.pl.plats)} av ${h.num(v.m.pl.av)}, där 1 är billigast. För villor redovisar myndigheten inget totalbelopp för Ellevio ${h.P.year}, så den här sidan handlar om lägenheter. Med SCB:s snittpris för rörligt avtal i SE3 blir totalpriset för lägenheten ${h.ore(v.p.total)} per kWh. Välj ditt eget område och din förbrukning i verktyget nedan för att se din årskostnad.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Var har Ellevio sitt elnät?', a: 'Enligt Svenska kraftnäts karta på Nätområden.se äger Ellevio AB flera nätområden, de flesta i SE3 och några i SE2, däribland nätområdet Stockholm. Energimarknadsinspektionen redovisar Ellevios priser för områdena Mellansverige, Edsbyn och Västkusten. Vilket som gäller dig står på nätfakturan eller syns på Nätområden.se.' },
        { q: 'Varför finns inget villapris för Ellevio?', a: `I Energimarknadsinspektionens tabell för ${h.P.year} saknas totalbelopp för Ellevios villakunder i alla typfall, medan lägenheten med 16 ampere finns med. Tabellen anger inte orsaken. Har du villa, läs Ellevios egen prislista och lägg in överföringsavgiften och den fasta avgiften i kalkylatorn för nätavgift.` },
        { q: 'Hur stor del av Ellevios nätavgift är fast?', a: `För typfallet lägenhet med 2 000 kWh om året är ${h.pct(v.fastAndel, 0)} av årskostnaden fast: abonnemang plus myndighetsavgifter. Resten är överföringsavgiften per kWh. En lägenhet som använder mindre el sparar därför bara på den rörliga delen, medan abonnemanget ligger kvar oförändrat hela året.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.omr.map((x) => [x.g, h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t25.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.num(x.pkt)]);
      return `<h2>Ellevios tre områden i sammanställningen</h2>
${h.table(['Område', 'Fast per år', 'Överföring per kWh', 'Totalt 2025', 'Totalt 2026', 'Uttagspunkter'], rows, `Energimarknadsinspektionen, lägenhet 16 A, 2 000 kWh per år, inkl. moms. Myndighetsavgifter ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exkl. moms ${h.P.year}. Uttagspunkter: antal anslutningar med denna säkring.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Ellevio har samma lägenhetstariff i alla tre områdena, och de har tillsammans ${h.num(v.pkt)} uttagspunkter med 16 amperes säkring enligt myndighetens uppgifter. Det mesta finns i Mellansverige, där Stockholm ingår.</p>
<h2>Ellevio jämfört med andra nät</h2>
<p>Med ${h.kr(v.m.t.totalKrPerAr * v.mo)} om året ligger Ellevio under medianen för lägenheter, som är ${h.kr(v.m.pl.median * v.mo)}. Förklaringen är främst abonnemanget, som är lägre än i de flesta andra nät, medan överföringsavgiften per kWh ligger nära mitten. För en liten lägenhet blir den fasta delen ändå tung: med 2 000 kWh om året betalar du i snitt ${h.ore((v.m.t.totalKrPerAr * v.mo * 100) / 2000)} per kWh bara till nätet. ${h.a('jamfor-natavgift', 'Jämför med alla nätområden')} eller se hela totalpriset för ${h.a('elpris-stockholm', 'Stockholm')}.</p>
<h2>Om villakunder och effektavgift</h2>
<p>Att villapriset saknas i myndighetens tabell betyder inte att det saknas i verkligheten, bara att det inte går att räkna som de andra typfallen. Energimarknadsinspektionen upphävde i juni ${h.P.year} kravet på att alla nätföretag skulle införa effektavgifter, men skriver att inget i lagstiftningen hindrar dem. Om Ellevio tar ut en effektavgift av dig, och hur den räknas, står i din prislista. Grunderna förklaras i ${h.a('effektavgift', 'effektavgift')}.</p>`;
    },
  },
  en: {
    slug: 'ellevio-grid-fee',
    nav: 'Ellevio',
    card: 'Ellevio’s 2026 grid fee for a flat, per the Energy Markets Inspectorate.',
    title: 'Ellevio Grid Fee 2026: Price per kWh and Fixed Fee per Year',
    description: 'Ellevio grid fee 2026: fixed fee and transfer fee for a 16 A flat per the regulator Ei, the change since 2025 and the all-in price per kWh in Stockholm.',
    h1: 'Ellevio’s grid fee: what a flat pays in 2026',
    intro: 'Ellevio owns the grid in Stockholm among other places. Here is its fee in the regulator’s compilation.',
    resume: (h) => {
      const v = V(h);
      return `A flat with a 16 A main fuse using 2,000 kWh a year pays ${h.kr(v.m.t.totalKrPerAr * v.mo)} a year in grid fees to Ellevio in ${h.P.year}, VAT included, according to the Energy Markets Inspectorate’s (Ei) figures for Ellevio’s Mellansverige area. Of that, ${h.kr(v.m.t.fastKrPerAr * v.mo)} is the fixed fee and authority charges, and the transfer fee is ${h.ore(v.m.t.rorligOre * v.mo)} per kWh with VAT. The same prices apply in Ellevio’s Edsbyn and Västkusten areas. Compared with 2025, the flat’s grid cost changed by ${h.pct(v.m.t.totalKrPerAr / v.m.t25.totalKrPerAr - 1)}. Among all grid areas with a flat price, Ellevio ranks ${h.num(v.m.pl.plats)} of ${h.num(v.m.pl.av)}, where 1 is cheapest. For houses the regulator lists no annual total for Ellevio in ${h.P.year}. At the Statistics Sweden average variable price in SE3, the flat’s all-in price is ${h.ore(v.p.total)} per kWh.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Where does Ellevio run the grid?', a: 'Svenska kraftnät’s map on Nätområden.se shows Ellevio AB owning several grid areas, most in SE3 and a few in SE2, including the Stockholm grid area. The regulator reports Ellevio’s prices for the Mellansverige, Edsbyn and Västkusten areas. Which applies to you is on your grid bill or on Nätområden.se.' },
        { q: 'Why is there no house price for Ellevio?', a: `In the regulator’s ${h.P.year} table, annual totals for Ellevio’s house customers are missing in every case, while the 16 A flat is listed. The table does not give the reason. If you live in a house, check Ellevio’s own price list and enter its transfer fee and fixed fee in the grid-fee calculator.` },
        { q: 'How much of Ellevio’s grid fee is fixed?', a: `For the standard flat using 2,000 kWh a year, ${h.pct(v.fastAndel, 0)} of the annual cost is fixed: subscription plus authority charges. The rest is the transfer fee per kWh. A flat that uses less power therefore saves only on the variable part, while the subscription stays the same.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.omr.map((x) => [x.g, h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t25.totalKrPerAr * v.mo), h.kr(x.t.totalKrPerAr * v.mo), h.num(x.pkt)]);
      return `<h2>Ellevio’s three areas in the compilation</h2>
${h.table(['Area', 'Fixed per year', 'Transfer per kWh', 'Total 2025', 'Total 2026', 'Connections'], rows, `Energy Markets Inspectorate, flat 16 A, 2,000 kWh a year, incl. VAT. Authority charges ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT in ${h.P.year}. Connections: number of connection points with this fuse.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Ellevio applies the same flat tariff in all three areas, which together have ${h.num(v.pkt)} connection points with a 16 A fuse in the regulator’s data. Most are in Mellansverige, which includes Stockholm.</p>
<h2>Ellevio against other grids</h2>
<p>At ${h.kr(v.m.t.totalKrPerAr * v.mo)} a year Ellevio sits below the median for flats, ${h.kr(v.m.pl.median * v.mo)}, mainly because its subscription is lower than on most grids, while the transfer fee per kWh sits near the middle. For a small flat the fixed part still weighs heavily: at 2,000 kWh a year you pay on average ${h.ore((v.m.t.totalKrPerAr * v.mo * 100) / 2000)} per kWh to the grid alone. ${h.a('jamfor-natavgift', 'Compare every grid area')} or see the full all-in price for ${h.a('elpris-stockholm', 'Stockholm')}.</p>
<h2>House customers and power charges</h2>
<p>A missing house price in the regulator’s table does not mean there is none, only that it cannot be computed like the other cases. In June ${h.P.year} the regulator repealed the requirement for every grid company to introduce power charges, while noting that nothing in law forbids them. Whether Ellevio charges you for power, and how, is in your price list. The basics are in ${h.a('effektavgift', 'power charges')}.</p>`;
    },
  },
});
