import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Vattenfall Eldistribution : relevé Ei 2026 (REL03030, Lokalnät Syd et Norr, tarifs identiques), tous les cas types ; Nätområden.se (SE1, SE2, SE3). */
const FALL = ['L16', 'V16', 'V20', 'V25'] as const;
const V = (h: Helpers) => {
  const { M, P } = h;
  const mo = 1 + P.skatt.moms;
  const syd = M.hittaEnhet('Vattenfall Eldistribution', 'Syd')!;
  const norr = M.hittaEnhet('Vattenfall Eldistribution', 'Norr')!;
  const rader = FALL.map((f) => ({ f, t: M.natTariff(syd, f)!, t25: M.natTariff(syd, f, 2025)!, pl: M.placering(syd, f), pkt: (syd.cas[f]?.['2026']?.punkter ?? 0) + (norr.cas[f]?.['2026']?.punkter ?? 0) }));
  const v16 = rader[1];
  const spot = M.varde('rorligt', 'SE3', '2')!;
  const p = M.totalpris({ spot, natOverforing: v16.t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  return { mo, rader, v16, spot, p, okning: v16.t.totalKrPerAr / v16.t25.totalKrPerAr - 1 };
};
const NAMN = { sv: { L16: 'Lägenhet 16 A, 2 000 kWh', V16: 'Villa 16 A, 5 000 kWh', V20: 'Villa 20 A, 20 000 kWh', V25: 'Villa 25 A, 20 000 kWh' }, en: { L16: 'Flat 16 A, 2,000 kWh', V16: 'House 16 A, 5,000 kWh', V20: 'House 20 A, 20,000 kWh', V25: 'House 25 A, 20,000 kWh' } };

export default defineGuide({
  id: 'vattenfall-eldistribution',
  group: 'nat',
  order: 30,
  tool: 'nat',
  toolProps: { nat: 'Vattenfall Eldistribution|Syd', fall: 'V16' },
  related: ['elpris-uppsala', 'jamfor-natavgift', 'natavgift', 'eon-energidistribution', 'elpris-se3'],
  sources: ['eiNat', 'natomraden', 'scbElpriser'],
  sv: {
    slug: 'vattenfall-eldistribution-natavgift',
    nav: 'Vattenfall Eldistribution',
    card: 'Vattenfall Eldistributions nätavgift 2026 för lägenhet och villa.',
    title: 'Vattenfall Eldistribution nätavgift 2026: lägenhet och villa',
    description: 'Vattenfall Eldistribution nätavgift 2026: fast avgift och överföring för lägenhet och villa med 16 till 25 A enligt Ei, höjningen sedan 2025 och pris per kWh.',
    h1: 'Vattenfall Eldistributions nätavgift 2026',
    intro: 'Vattenfall Eldistribution äger lokalnät i SE1, SE2 och SE3, med samma pris i alla sina områden.',
    resume: (h) => {
      const v = V(h);
      return `En villa med 16 ampere och 5 000 kWh om året betalar ${h.kr(v.v16.t.totalKrPerAr * v.mo)} om året i nätavgift till Vattenfall Eldistribution ${h.P.year}, moms inräknad, enligt Energimarknadsinspektionens sammanställning. Det är ${h.pct(v.okning)} mer än 2025. Avgiften består av en fast del på ${h.kr(v.v16.t.fastKrPerAr * v.mo)} om året, inklusive myndighetsavgifterna, och en överföringsavgift på ${h.ore(v.v16.t.rorligOre * v.mo)} per kWh med moms. Myndigheten redovisar två områden, Lokalnät Syd och Lokalnät Norr, och priserna är identiska i båda. Enligt Svenska kraftnäts karta äger Vattenfall Eldistribution lokalnät i SE1, SE2 och SE3, däribland nätområdet Uppsala. Bland nätområdena med ett pris för villa med 16 ampere hamnar Vattenfall på plats ${h.num(v.v16.pl.plats)} av ${h.num(v.v16.pl.av)}, där 1 är billigast. Med SCB:s snitt för rörligt avtal i SE3 blir totalpriset ${h.ore(v.p.total)} per kWh.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Har Vattenfall Eldistribution samma pris i norr och söder?', a: 'Ja, enligt Energimarknadsinspektionens sammanställning för 2026 är de fasta avgifterna och överföringsavgifterna desamma i Lokalnät Syd och Lokalnät Norr, i alla typfall. Spotpriset skiljer däremot mellan elområdena, så totalpriset för en kund i Norrbotten blir lägre än för en kund i Uppsala med samma nätavgift.' },
        { q: 'Varför höjde Vattenfall Eldistribution nätavgiften 2026?', a: `Myndighetens tabell visar beloppen men inte skälen. Vi kan konstatera att årskostnaden för villa med 16 ampere steg med ${h.pct(v.okning)} mellan 2025 och ${h.P.year}, och att myndighetsavgifterna som ingår höjdes till ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} exklusive moms. Bolagets egna motiveringar finns hos Vattenfall Eldistribution.` },
        { q: 'Lönar det sig att byta till mindre säkring hos Vattenfall?', a: `Den fasta avgiften stiger med säkringen: för en villa är den ${h.kr(v.rader[1].t.fastKrPerAr * v.mo)} med 16 ampere och ${h.kr(v.rader[2].t.fastKrPerAr * v.mo)} med 20 ampere om året med moms. Om din högsta effekt tillåter en mindre säkring sjunker abonnemanget. Fråga en elektriker innan, eftersom en för liten säkring kan lösa ut.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rader.map((x) => [NAMN.sv[x.f], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${h.num(x.pl.plats)} av ${h.num(x.pl.av)}`, h.num(x.pkt)]);
      return `<h2>Alla typfall hos Vattenfall Eldistribution</h2>
${h.table(['Typfall', 'Fast per år', 'Överföring per kWh', 'Totalt per år', 'Plats', 'Uttagspunkter'], rows, `Energimarknadsinspektionen ${h.P.year}, inkl. moms, Lokalnät Syd och Norr sammanlagda uttagspunkter. Plats: 1 = billigast bland nätområden med pris för typfallet.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Överföringsavgiften per kWh är densamma oavsett säkring, medan den fasta delen ökar kraftigt med säkringsstorleken. För en elvärmd villa med 20 ampere är det alltså abonnemanget som gör Vattenfalls nät dyrt jämfört med många andra, och den som kan klara sig med en mindre säkring sparar mest på det.</p>
<h2>Två områden, ett pris</h2>
<p>Vattenfall Eldistribution redovisar sina lokalnät i två områden, men myndighetens siffror visar samma priser i båda. Det skiljer bolaget från till exempel E.ON Energidistribution, som har olika priser i sina områden. För dig som kund betyder det att nätavgiften inte ändras om du flyttar mellan två av Vattenfalls lokalnät, medan elpriset kan ändras om du byter elområde.</p>
<h2>Från nätavgift till totalpris</h2>
<p>Nätavgiften är bara en del av räkningen. Med SCB:s senaste snitt för rörligt avtal i SE3, ${h.ore(v.spot)} exklusive moms, energiskatten på ${h.ore(h.P.skatt.energiskatt_ore)} och moms blir det rörliga totalpriset för villan ${h.ore(v.p.total)} per kWh. Lägg till den fasta nätavgiften per månad, ${h.kr((v.v16.t.fastKrPerAr * v.mo) / 12)}, så har du det mesta av räkningen. Använd ${h.a('elrakning', 'kalkylatorn för elräkningen')} eller sidan för ${h.a('elpris-uppsala', 'Uppsala')}.</p>`;
    },
  },
  en: {
    slug: 'vattenfall-eldistribution-grid-fee',
    nav: 'Vattenfall Eldistribution',
    card: 'Vattenfall Eldistribution’s 2026 grid fee for flats and houses.',
    title: 'Vattenfall Eldistribution Grid Fee 2026: Flats and Houses',
    description: 'Vattenfall Eldistribution grid fee 2026: fixed and transfer fees for flats and houses, 16 to 25 A, per the regulator Ei, the rise since 2025 and price per kWh.',
    h1: 'Vattenfall Eldistribution’s grid fee in 2026',
    intro: 'Vattenfall Eldistribution owns local grids in SE1, SE2 and SE3, with the same price in all its areas.',
    resume: (h) => {
      const v = V(h);
      return `A house with a 16 A fuse using 5,000 kWh a year pays ${h.kr(v.v16.t.totalKrPerAr * v.mo)} a year in grid fees to Vattenfall Eldistribution in ${h.P.year}, VAT included, according to the Energy Markets Inspectorate (Ei). That is ${h.pct(v.okning)} more than in 2025. The fee is a fixed part of ${h.kr(v.v16.t.fastKrPerAr * v.mo)} a year, authority charges included, and a transfer fee of ${h.ore(v.v16.t.rorligOre * v.mo)} per kWh with VAT. The regulator lists two areas, Lokalnät Syd and Lokalnät Norr, with identical prices. On Svenska kraftnät’s map Vattenfall Eldistribution owns local grids in SE1, SE2 and SE3, including the Uppsala grid area. Among grid areas with a price for a 16 A house, Vattenfall ranks ${h.num(v.v16.pl.plats)} of ${h.num(v.v16.pl.av)}, where 1 is cheapest. At the Statistics Sweden average variable price in SE3, the all-in price is ${h.ore(v.p.total)} per kWh.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Does Vattenfall Eldistribution charge the same north and south?', a: 'Yes, in the regulator’s 2026 compilation the fixed and transfer fees are the same in Lokalnät Syd and Lokalnät Norr, in every standard case. The spot price differs between bidding zones, though, so a customer in Norrbotten pays a lower all-in price than one in Uppsala on the same grid fee.' },
        { q: 'Why did Vattenfall Eldistribution raise its fee for 2026?', a: `The regulator’s table shows amounts, not reasons. What it shows is that the annual cost for a 16 A house rose ${h.pct(v.okning)} between 2025 and ${h.P.year}, and that the authority charges included rose to ${h.kr(h.P.nat.myndighetsavgifter_kr['2026'])} before VAT. The company’s own explanations are available from Vattenfall Eldistribution.` },
        { q: 'Is a smaller main fuse worth it with Vattenfall?', a: `The fixed fee rises with the fuse: for a house it is ${h.kr(v.rader[1].t.fastKrPerAr * v.mo)} a year with a 16 A fuse and ${h.kr(v.rader[2].t.fastKrPerAr * v.mo)} with 20 A, VAT included. If your peak load allows a smaller fuse, the subscription drops. Ask an electrician first, since an undersized fuse can trip.` },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = v.rader.map((x) => [NAMN.en[x.f], h.kr(x.t.fastKrPerAr * v.mo), h.ore(x.t.rorligOre * v.mo), h.kr(x.t.totalKrPerAr * v.mo), `${h.num(x.pl.plats)} of ${h.num(x.pl.av)}`, h.num(x.pkt)]);
      return `<h2>Every standard case at Vattenfall Eldistribution</h2>
${h.table(['Case', 'Fixed per year', 'Transfer per kWh', 'Total per year', 'Rank', 'Connections'], rows, `Energy Markets Inspectorate ${h.P.year}, incl. VAT, connections for Lokalnät Syd and Norr combined. Rank: 1 = cheapest among grid areas with a price for the case.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The transfer fee per kWh is the same whatever the fuse, while the fixed part rises steeply with fuse size. For an electrically heated 20 A house it is therefore the subscription that makes Vattenfall’s grid dear compared with many others, and anyone who can manage on a smaller fuse saves most there.</p>
<h2>Two areas, one price</h2>
<p>Vattenfall Eldistribution reports its local grids in two areas, but the regulator’s figures show the same prices in both. That sets it apart from E.ON Energidistribution, for example, which prices its areas differently. For you it means the grid fee does not change if you move between two of Vattenfall’s local grids, while the energy price may change if you move to another bidding zone.</p>
<h2>From grid fee to all-in price</h2>
<p>The grid fee is only part of the bill. At Statistics Sweden’s latest average variable price in SE3, ${h.ore(v.spot)} before VAT, energy tax of ${h.ore(h.P.skatt.energiskatt_ore)} and VAT, the house’s variable all-in price is ${h.ore(v.p.total)} per kWh. Add the fixed grid fee of ${h.kr((v.v16.t.fastKrPerAr * v.mo) / 12)} a month and you have most of the bill. Use the ${h.a('elrakning', 'electricity bill calculator')} or the page for ${h.a('elpris-uppsala', 'Uppsala')}.</p>`;
    },
  },
});
