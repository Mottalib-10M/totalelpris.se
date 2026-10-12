/**
 * Calculateur principal : spot saisi (ou liste de prix collée) → prix final par kWh, TTC, avec
 * l'energiskatt 2026, la moms et le tarif variable du réseau local (relevé Ei), puis la facture du mois.
 * Modes : « idag » et « imorgon » (même calcul, textes différents), « rakning » (facture mise en avant).
 * Premier rendu = valeurs par défaut du build (RECETTE §17.5) ; le lien partagé s'applique ensuite.
 */
import { useState, useMemo } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Kurva from './Kurva';
import { Frame, ResultPanel, useParams, T, kr, pct, ore, type L } from './kit';
import { GrundFalt, useBerakning, spotDefault } from './elpris-kit';
import { FALL, FALL_KWH } from '../../lib/engine/nat';
import { manadskostnad, totalpris } from '../../lib/engine/pris';
import { lasSerie, tillOre, statistik, billigasteFonster, klockslag } from '../../lib/engine/kvart';
import { P } from '../../lib/engine/params';

interface Props { lang: L; methodHref?: string; mode?: 'idag' | 'imorgon' | 'rakning'; nat: number; fall?: number; zon?: number; skatt?: number }

export default function PrisCalc({ lang, methodHref, mode = 'idag', nat, fall = 0, zon = 2, skatt = 0 }: Props) {
  const [v, set] = useParams({ nat, fall, zon, spot: 0, paslag: 0, skatt, kwh: 0 });
  const f = FALL[v.fall] ?? 'L16';
  // Tant que l'utilisateur n'a rien saisi (0), le spot suit la moyenne SCB de la zone et la consommation suit le cas Ei.
  const spot = v.spot !== 0 ? v.spot : spotDefault(v.zon, f);
  const kwh = v.kwh !== 0 ? v.kwh : Math.round(FALL_KWH[f] / 12);
  const b = useBerakning({ ...v, spot });
  const [text, setText] = useState('');
  const [kurs, setKurs] = useState(0);
  const [langd, setLangd] = useState(60);
  const serie = useMemo(() => (text.trim() ? lasSerie(text) : null), [text]);
  const slots = useMemo(() => {
    if (!serie || !serie.priser.length) return null;
    if (serie.enhet === 'eur-mwh' && !kurs) return { fel: 'kurs' as const };
    const ores = tillOre(serie, kurs);
    const finals = ores.map((s) => totalpris({ spot: s, paslag: v.paslag, natOverforing: b.tariff?.rorligOre ?? 0, energiskatt: b.energiskatt, momsSats: P.skatt.moms }).total);
    return { fel: null, ores, finals, st: statistik(finals), win: billigasteFonster(finals, serie.minuter, langd), minuter: serie.minuter };
  }, [serie, kurs, langd, v.paslag, b]);

  const d = b.delar;
  const m = manadskostnad({ kwh, prisTotalOre: d.total, natFastKrPerAr: b.natFastInkl });
  const sv = lang === 'sv';
  const head = mode === 'rakning' ? T(lang, 'Din elräkning per månad, inkl. moms', 'Your monthly electricity bill, incl. VAT') : mode === 'imorgon' ? T(lang, 'Totalpris per kWh för morgondagens pris', 'All-in price per kWh for tomorrow’s price') : T(lang, 'Ditt totalpris per kWh, inkl. moms', 'Your all-in price per kWh, incl. VAT');
  const value = mode === 'rakning' ? kr(m.total, lang) : ore(d.total, lang);
  const sub = mode === 'rakning' ? T(lang, `${ore(m.snittOre, lang)} i snitt med fasta avgifter`, `${ore(m.snittOre, lang)} on average including fixed fees`) : T(lang, `Spotpriset är ${pct(d.total ? (d.spot * (1 + P.skatt.moms)) / d.total : 0, lang, 0)} av det du betalar per kWh`, `The spot price is ${pct(d.total ? (d.spot * (1 + P.skatt.moms)) / d.total : 0, lang, 0)} of what you pay per kWh`);
  const mo = 1 + P.skatt.moms;
  const rows = [
    { label: T(lang, 'Spotpris (elhandel)', 'Spot price (retail energy)'), value: ore(d.spot * mo, lang) },
    { label: T(lang, 'Påslag', 'Mark-up'), value: ore(d.paslag * mo, lang) },
    { label: T(lang, 'Överföringsavgift, elnät', 'Grid transfer fee'), value: b.tariff ? ore(d.natOverforing * mo, lang) : T(lang, 'saknas hos Ei', 'not in Ei data') },
    { label: T(lang, 'Energiskatt', 'Energy tax'), value: ore(d.energiskatt * mo, lang) },
    { label: T(lang, 'varav moms 25 %', 'of which VAT 25%'), value: ore(d.moms, lang), note: true },
    { label: T(lang, 'Totalt rörligt pris', 'Total variable price'), value: ore(d.total, lang), strong: true },
    { label: T(lang, `Fast nätavgift per månad (${b.fall.startsWith('L') ? 'lägenhet' : 'villa'})`, `Fixed grid fee per month`), value: b.tariff ? kr(m.fast, lang) : '–' },
    { label: T(lang, `Elräkning för ${kwh} kWh i månaden`, `Bill for ${kwh} kWh a month`), value: kr(m.total, lang), strong: mode === 'rakning' },
  ];
  const segs = [
    { label: T(lang, 'Spot + påslag', 'Spot + mark-up'), value: Math.max(0, (d.spot + d.paslag) * mo), color: '#006AA7' },
    { label: T(lang, 'Elnät', 'Grid'), value: Math.max(0, d.natOverforing * mo), color: '#0f766e' },
    { label: T(lang, 'Energiskatt', 'Energy tax'), value: d.energiskatt * mo, color: '#b45309' },
  ];
  const hyp = T(lang,
    `Energiskatt ${String(b.energiskatt).replace('.', ',')} öre/kWh exkl. moms (${P.year}), moms ${P.skatt.moms * 100} % på allt. Nätpriset är Ei:s uppgift för ${b.enhet.namn} per 1 januari ${P.year}, typfall ${b.fall}; har nätföretaget effektavgift ingår den inte. Elhandlarens månadsavgift ingår inte.`,
    `Energy tax ${b.energiskatt} öre/kWh excl. VAT (${P.year}), 25% VAT on everything. The grid price is Ei’s figure for ${b.enhet.namn} on 1 January ${P.year}, standard case ${b.fall}; any power (kW) charge is not included. The retailer’s monthly fee is not included.`);
  return (
    <Frame
      form={<>
        <GrundFalt lang={lang} v={{ ...v, spot }} set={(k) => (x) => set(k)(k === 'spot' && x === 0 ? 0.01 : x)} idp="pris" />
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <NumberField id="pris-kwh" label={T(lang, 'Förbrukning per månad', 'Consumption per month')} value={kwh} onChange={set('kwh')} unit="kWh" max={20000} lang={lang} help={T(lang, 'Står på fakturan. Förifyllt: Ei:s typfall delat med 12.', 'Shown on your bill. Pre-filled: Ei’s standard case divided by 12.')} />
        </div>
        <details className="rounded-lg border border-navy-200 p-4">
          <summary className="cursor-pointer font-medium text-navy-900">{mode === 'imorgon' ? T(lang, 'Klistra in morgondagens 96 kvartspriser', 'Paste tomorrow’s 96 quarter-hour prices') : T(lang, 'Klistra in dagens 96 kvartspriser', 'Paste today’s 96 quarter-hour prices')}</summary>
          <p className="mt-2 text-sm text-navy-700">{T(lang, 'Kopiera listan från din elhandlares app eller från ENTSO-E:s transparensplattform (ett pris per rad, öre, kr eller €/MWh). Vi laddar inte ner några priser själva.', 'Copy the list from your retailer’s app or from the ENTSO-E transparency platform (one price per line, öre, kronor or €/MWh). We do not download any prices ourselves.')}</p>
          <label htmlFor="pris-lista" className="mt-3 block text-sm font-medium text-navy-700">{T(lang, 'Priser, ett per rad', 'Prices, one per line')}</label>
          <textarea id="pris-lista" rows={5} value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-navy-300 p-3 font-mono text-sm text-navy-900" placeholder={'00:00 42,1\n00:15 40,8\n…'} />
          <div className="mt-3 grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <SelectField id="pris-langd" label={T(lang, 'Hur länge ska apparaten gå?', 'How long will the appliance run?')} value={String(langd)} onChange={(x) => setLangd(Number(x))} options={[60, 120, 180, 240, 360].map((x) => ({ value: String(x), label: T(lang, `${x / 60} timmar`, `${x / 60} hours`).replace(/^1 timmar/, '1 timme').replace(/^1 hours/, '1 hour') }))} />
            <NumberField id="pris-kurs" label={T(lang, 'Kronor per euro (bara för €/MWh)', 'Kronor per euro (only for €/MWh)')} value={kurs} onChange={setKurs} unit="kr" max={100} decimals={2} lang={lang} />
          </div>
        </details>
      </>}
      result={<ResultPanel lang={lang} head={head} value={value} sub={sub} rows={rows} bar={{ segments: segs, total: segs.reduce((s, x) => s + x.value, 0), aria: T(lang, 'Fördelning av priset per kWh', 'Split of the price per kWh') }} hyp={hyp} methodHref={methodHref} copyText={`${head}: ${value}`}>
        {slots && slots.fel === 'kurs' && <p className="mt-3 text-sm text-amber-800">{T(lang, 'Listan är i €/MWh: ange växelkursen för att räkna om.', 'The list is in €/MWh: enter the exchange rate to convert it.')}</p>}
        {slots && slots.fel === null && (
          <div className="mt-4 border-t border-accent-200 pt-3 text-sm text-navy-800">
            <p className="font-semibold">{T(lang, `${slots.finals.length} priser inlästa`, `${slots.finals.length} prices read`)}{serie && serie.avvisade ? T(lang, ` (${serie.avvisade} rader utan tal hoppades över)`, ` (${serie.avvisade} lines without a number skipped)`) : ''}</p>
            <p>{T(lang, 'Lägst', 'Lowest')} {ore(slots.st.min, lang)} {T(lang, 'kl.', 'at')} {klockslag(slots.st.minIdx, slots.minuter)} · {T(lang, 'högst', 'highest')} {ore(slots.st.max, lang)} {T(lang, 'kl.', 'at')} {klockslag(slots.st.maxIdx, slots.minuter)} · {T(lang, 'snitt', 'average')} {ore(slots.st.snitt, lang)}</p>
            {slots.win.start >= 0 && <p>{T(lang, 'Billigast att starta', 'Cheapest start')} {klockslag(slots.win.start, slots.minuter)}: {ore(slots.win.snitt, lang)} {T(lang, 'i snitt', 'on average')}</p>}
          </div>
        )}
      </ResultPanel>}
      after={slots && slots.fel === null ? <Kurva priser={slots.finals} minuter={slots.minuter} markStart={slots.win.start} markLen={slots.win.platser} lang={lang} aria={sv ? 'Totalpris per tidsperiod' : 'All-in price per time slot'} /> : null}
    />
  );
}
