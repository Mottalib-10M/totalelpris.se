import { defineGuide } from '../../lib/guide-types';
import type { Helpers } from '../../lib/guide-types';

/** Frys : neuf environ 250 kWh/an, dix ans 400 à 500 kWh/an (Energimyndigheten) ; coût annuel, exemple Linköping (SE3). */
const V = (h: Helpers) => {
  const { M, P } = h;
  const e = M.hittaEnhet('Tekniska verken Linköping')!;
  const t = M.natTariff(e, 'L16')!;
  const spot = M.varde('rorligt', 'SE3', '1')!;
  const p = M.totalpris({ spot, natOverforing: t.rorligOre, energiskatt: P.skatt.energiskatt_ore, momsSats: P.skatt.moms });
  const ar = (kwh: number) => M.kostnadKr(kwh, p.total);
  const ny = P.apparater.frys.min_kwh, gammal = P.apparater.frys.max_kwh;
  return { p, ar, ny, gammal, mellan: 400, standby: P.forbrukning.standby_andel };
};

export default defineGuide({
  id: 'kostnad-frys',
  group: 'apparat',
  order: 50,
  tool: 'apparat',
  toolProps: { apparat: 'frys', nat: 'Tekniska verken Linköping', zon: 'SE3', fall: 'L16' },
  related: ['elpris-linkoping', 'kostnad-diskmaskin', 'elrakning', 'elpris-se3', 'paslag'],
  sources: ['emSpara', 'scbElpriser', 'eiNat'],
  sv: {
    slug: 'kostnad-frys',
    nav: 'Frys',
    card: 'Vad frysen kostar per år, ny eller tio år gammal.',
    title: 'Frys elförbrukning 2026: vad en frys kostar i el per år',
    description: 'Frys och el 2026: en ny frys drar cirka 250 kWh per år, en tio år gammal 400 till 500 kWh, enligt Energimyndigheten. Räkna ut vad din frys kostar per år.',
    h1: 'Frysens elförbrukning: vad den kostar per år',
    intro: 'Frysen går dygnet runt, året om. Därför är det årsförbrukningen som räknas, inte en enskild timme.',
    resume: (h) => {
      const v = V(h);
      return `En ny frys drar cirka ${h.num(v.ny)} kWh per år, medan en som är tio år gammal drar cirka 400 till ${h.num(v.gammal)} kWh, enligt Energimyndigheten. Eftersom frysen går dygnet runt är det årsförbrukningen som avgör kostnaden. I en lägenhet i Linköping med Tekniska verkens elnät och SCB:s snittpris för rörligt avtal i SE3 kostar elen ${h.ore(v.p.total)} per kWh med skatt och moms. Den nya frysen kostar då omkring ${h.kr(v.ar(v.ny))} om året och den tio år gamla mellan ${h.kr(v.ar(v.mellan))} och ${h.kr(v.ar(v.gammal))}. Skillnaden är alltså ett par hundra kronor om året bara för att frysen har några år på nacken. För en kyl-frys-kombination eller en frysbox gäller andra värden; den årliga förbrukningen står på energimärkningen. Skriv in din frys värde i kalkylatorn så får du kostnaden per år och per månad med ditt elnät.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Lönar det sig att byta ut en gammal frys?', a: `Elen talar för det: skillnaden mellan en ny frys på ${h.num(v.ny)} kWh och en tio år gammal på ${h.num(v.gammal)} kWh är ${h.num(v.gammal - v.ny)} kWh om året, vilket med priset ${h.ore(v.p.total)} blir ${h.kr(v.ar(v.gammal - v.ny))} om året. Om bytet lönar sig beror på vad den nya frysen kostar och hur länge den gamla håller.` },
        { q: 'Spelar det någon roll när frysen går?', a: 'Nästan inte. Frysen går när termostaten slår till, dygnet runt, och du kan inte flytta förbrukningen till billiga kvartar som med disk eller laddning. Därför är det årsförbrukningen och priset per kWh i snitt som räknas. Med kvartsprisavtal blir frysens kostnad ungefär dygnets genomsnittliga pris gånger förbrukningen.' },
        { q: 'Hur ser jag hur mycket min frys drar?', a: 'Den årliga förbrukningen i kWh står på energimärkningen och i bruksanvisningen. Har du inte kvar dem kan du mäta med en energimätare i eluttaget under några dygn och räkna upp till ett år. Energimyndighetens värden, cirka 250 kWh för en ny och 400 till 500 kWh för en tio år gammal, ger en fingervisning.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [v.ny, 300, v.mellan, v.gammal].map((k) => [`${h.num(k)} kWh`, h.kr(v.ar(k)), h.kr(v.ar(k) / 12)]);
      return `<h2>Årskostnad efter förbrukning</h2>
${h.table(['Förbrukning per år', 'Kostnad per år', 'Per månad'], rows, `Totalpris ${h.ore(v.p.total)} inkl. moms: SCB rörligt SE3 lägenhet, Tekniska verken i Linköping Nät, energiskatt. Ny frys cirka 250 kWh, tio år gammal 400 till 500 kWh enligt Energimyndigheten.`, ['l', 'r', 'r'])}
<p>Frysen är en liten men jämn post. Den syns knappt på en enskild månadsfaktura, men över tio år blir skillnaden mellan en snål och en törstig frys flera tusen kronor. Energimyndigheten pekar också på att ungefär ${h.pct(v.standby, 0)} av ett hushålls elanvändning går till standby; frysen är inte standby, men den hör till samma grupp av apparater som drar el hela tiden.</p>
<h2>Det som påverkar förbrukningen</h2>
<ul>
<li><strong>Ålder och energiklass</strong>: det är den skillnad Energimyndighetens siffror visar, från cirka 250 till 400–500 kWh per år.</li>
<li><strong>Placering</strong>: en frys i ett varmt utrymme måste arbeta mer än en i ett svalt; tillverkarens anvisningar om omgivningstemperatur står i bruksanvisningen.</li>
<li><strong>Is och tätningar</strong>: en frys med mycket is eller en dålig dörrtätning arbetar mer. Frosta av enligt tillverkarens råd.</li>
</ul>
<h2>Frysen i elräkningen</h2>
<p>Lägger du ihop frys, kyl och andra apparater som alltid är på får du en grundförbrukning som du betalar för oavsett avtal och tidpunkt. Den är bra att känna till när du jämför ${h.a('paslag', 'påslag och avgifter')} mellan elhandlare, eftersom påslaget tas ut på varje kWh. Se ${h.a('elrakning', 'elräkningen')} för hela månadens kostnad och ${h.a('elpris-linkoping', 'elpris i Linköping')} för stadens nät.</p>`;
    },
  },
  en: {
    slug: 'freezer-running-cost',
    nav: 'Freezer',
    card: 'What a freezer costs per year, new or ten years old.',
    title: 'Freezer Electricity Cost 2026: What It Costs You per Year',
    description: 'Freezer running cost in Sweden, 2026: a new freezer uses about 250 kWh a year, a ten-year-old one 400 to 500 kWh, per the Energy Agency. Your yearly cost.',
    h1: 'Freezer electricity use: what it costs per year',
    intro: 'A freezer runs day and night, all year. So it is the yearly consumption that counts, not a single hour.',
    resume: (h) => {
      const v = V(h);
      return `A new freezer uses about ${h.num(v.ny)} kWh a year, while one that is ten years old uses about 400 to ${h.num(v.gammal)} kWh, according to the Swedish Energy Agency. Because a freezer runs around the clock, its yearly consumption decides the cost. In a flat in Linköping on Tekniska verken’s grid, at the Statistics Sweden average variable price for SE3, power costs ${h.ore(v.p.total)} per kWh with tax and VAT. The new freezer then costs about ${h.kr(v.ar(v.ny))} a year and the ten-year-old one between ${h.kr(v.ar(v.mellan))} and ${h.kr(v.ar(v.gammal))}. That is a couple of hundred kronor a year just because the freezer has some years behind it. A fridge-freezer or a chest freezer has different values; the yearly consumption is on the energy label. Enter your freezer’s figure in the calculator to get the cost per year and per month on your grid.`;
    },
    faqs: (h) => {
      const v = V(h);
      return [
        { q: 'Is it worth replacing an old freezer?', a: `The electricity argues for it: a new freezer at ${h.num(v.ny)} kWh against a ten-year-old one at ${h.num(v.gammal)} kWh is ${h.num(v.gammal - v.ny)} kWh a year, which at ${h.ore(v.p.total)} is ${h.kr(v.ar(v.gammal - v.ny))} a year. Whether replacing pays depends on the new freezer’s price and how long the old one lasts.` },
        { q: 'Does it matter when the freezer runs?', a: 'Hardly. The freezer runs whenever its thermostat switches on, day and night, and you cannot shift it into cheap quarters as you can with dishes or charging. So yearly consumption and the average price per kWh are what count. On a quarter-hour contract its cost is roughly the day’s average price times its use.' },
        { q: 'How do I find out how much my freezer uses?', a: 'The yearly consumption in kWh is on the energy label and in the manual. Without them, you can measure with a plug-in energy meter for a few days and scale up to a year. The Swedish Energy Agency’s figures, about 250 kWh for a new freezer and 400 to 500 kWh for a ten-year-old one, give a rough guide.' },
      ];
    },
    body: (h) => {
      const v = V(h);
      const rows = [v.ny, 300, v.mellan, v.gammal].map((k) => [`${h.num(k)} kWh`, h.kr(v.ar(k)), h.kr(v.ar(k) / 12)]);
      return `<h2>Yearly cost by consumption</h2>
${h.table(['Use per year', 'Cost per year', 'Per month'], rows, `All-in price ${h.ore(v.p.total)} incl. VAT: Statistics Sweden variable SE3 flat, Tekniska verken i Linköping Nät, energy tax. New freezer about 250 kWh, ten years old 400 to 500 kWh per the Swedish Energy Agency.`, ['l', 'r', 'r'])}
<p>The freezer is a small but steady item. It barely shows on a single monthly bill, but over ten years the gap between a frugal and a thirsty freezer runs to several thousand kronor. The Swedish Energy Agency also notes that about ${h.pct(v.standby, 0)} of a household’s electricity goes to standby; a freezer is not standby, but it belongs to the same group of appliances that draw power all the time.</p>
<h2>What affects consumption</h2>
<ul>
<li><strong>Age and energy class</strong>: the gap the agency’s figures show, from about 250 to 400–500 kWh a year.</li>
<li><strong>Placement</strong>: a freezer in a warm space works harder than one in a cool space; the maker’s ambient-temperature guidance is in the manual.</li>
<li><strong>Ice and seals</strong>: a freezer with heavy ice or a poor door seal works harder. Defrost as the maker advises.</li>
</ul>
<h2>The freezer on the bill</h2>
<p>Add the freezer, fridge and other always-on appliances together and you get a base load you pay for whatever the contract or time. It is useful to know when comparing ${h.a('paslag', 'mark-ups and fees')} between retailers, since the mark-up applies to every kWh. See ${h.a('elrakning', 'the electricity bill')} for the whole month and ${h.a('elpris-linkoping', 'electricity price in Linköping')} for the city’s grid.</p>`;
    },
  },
});
