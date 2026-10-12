/**
 * Recharge d'une voiture électrique à la maison : énergie prise au réseau (pertes comprises), durée,
 * coût au prix final et coût par mil (10 km) ; avec une liste de prix collée, départ le moins cher pour
 * la durée de charge calculée.
 */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import Kurva from './Kurva';
import { Frame, ResultPanel, useParams, T, kr, ore, nr, type L } from './kit';
import { GrundFalt, ExtraFalt, useBerakning, spotDefault } from './elpris-kit';
import { FALL } from '../../lib/engine/nat';
import { kostnadKr, laddning, totalpris } from '../../lib/engine/pris';
import { lasSerie, tillOre, billigasteFonster, klockslag } from '../../lib/engine/kvart';
import { P } from '../../lib/engine/params';

interface Props { lang: L; methodHref?: string; nat: number; fall?: number; zon?: number; skatt?: number }

export default function ElbilCalc({ lang, methodHref, nat, fall = 1, zon = 2, skatt = 0 }: Props) {
  const E = P.elbil;
  const [v, set] = useParams({ nat, fall, zon, spot: 0, paslag: 0, skatt, bat: E.batteri_kwh, fran: E.fran_pct, till: E.till_pct, eff: E.laddeffekt_kw, forl: E.forlust_pct, forbr: E.forbrukning_kwh_mil });
  const f = FALL[v.fall] ?? 'L16';
  const spot = v.spot !== 0 ? v.spot : spotDefault(v.zon, f);
  const b = useBerakning({ ...v, spot });
  const l = laddning({ batteriKwh: v.bat, franPct: v.fran, tillPct: v.till, laddeffektKw: v.eff, forlustPct: v.forl });
  const kostnad = kostnadKr(l.franNatet, b.delar.total);
  const mil = v.forbr > 0 ? l.iBatteriet / v.forbr : 0;
  const perMil = mil > 0 ? kostnad / mil : 0;
  const [text, setText] = useState('');
  const plan = useMemo(() => {
    if (!text.trim()) return null;
    const s = lasSerie(text);
    if (!s.priser.length || s.enhet === 'eur-mwh') return null;
    const finals = tillOre(s).map((x) => totalpris({ spot: x, paslag: v.paslag, natOverforing: b.tariff?.rorligOre ?? 0, energiskatt: b.energiskatt, momsSats: P.skatt.moms }).total);
    return { finals, minuter: s.minuter, win: billigasteFonster(finals, s.minuter, Math.max(15, l.timmar * 60)) };
  }, [text, l.timmar, v.paslag, b]);
  const tid = `${Math.floor(l.timmar)} h ${Math.round((l.timmar % 1) * 60)} min`;
  const rows = [
    { label: T(lang, 'Energi in i batteriet', 'Energy into the battery'), value: `${nr(l.iBatteriet, lang, 1)} kWh` },
    { label: T(lang, 'Energi från elnätet (med förluster)', 'Energy from the grid (with losses)'), value: `${nr(l.franNatet, lang, 1)} kWh` },
    { label: T(lang, 'Laddtid', 'Charging time'), value: tid },
    { label: T(lang, 'Totalpris per kWh', 'All-in price per kWh'), value: ore(b.delar.total, lang) },
    { label: T(lang, 'Räckvidd som laddas', 'Range added'), value: `${nr(mil, lang, 1)} ${T(lang, 'mil', 'mil (10 km)')}` },
    { label: T(lang, 'Kostnad per mil', 'Cost per mil (10 km)'), value: kr(perMil, lang, 2), strong: true },
  ];
  if (plan && plan.win.start >= 0) rows.push({ label: T(lang, `Billigast att börja kl. ${klockslag(plan.win.start, plan.minuter)}`, `Cheapest start at ${klockslag(plan.win.start, plan.minuter)}`), value: kr(kostnadKr(l.franNatet, plan.win.snitt), lang) });
  return (
    <Frame
      form={<>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <NumberField id="ev-bat" label={T(lang, 'Batteriets storlek', 'Battery size')} value={v.bat} onChange={set('bat')} unit="kWh" max={250} lang={lang} />
          <NumberField id="ev-eff" label={T(lang, 'Laddeffekt hemma', 'Home charging power')} value={v.eff} onChange={set('eff')} unit="kW" max={50} decimals={1} lang={lang} help={T(lang, '3,7 kW = 16 A enfas, 11 kW = 16 A trefas.', '3.7 kW = 16 A single phase, 11 kW = 16 A three phase.')} />
        </div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <NumberField id="ev-fran" label={T(lang, 'Laddning från', 'Charge from')} value={v.fran} onChange={set('fran')} unit="%" max={100} lang={lang} />
          <NumberField id="ev-till" label={T(lang, 'Laddning till', 'Charge to')} value={v.till} onChange={set('till')} unit="%" max={100} lang={lang} />
        </div>
        <GrundFalt lang={lang} v={{ ...v, spot }} set={(k) => (x) => set(k)(k === 'spot' && x === 0 ? 0.01 : x)} idp="ev" extra={false} />
        <details className="rounded-lg border border-navy-200 p-4">
          <summary className="cursor-pointer font-medium text-navy-900">{T(lang, 'Påslag, förluster och billigaste laddtid', 'Mark-up, losses and cheapest charging time')}</summary>
          <div className="mt-3"><ExtraFalt lang={lang} v={{ ...v, spot }} set={set} idp="ev" /></div>
          <div className="mt-3 grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <NumberField id="ev-forl" label={T(lang, 'Laddförluster', 'Charging losses')} value={v.forl} onChange={set('forl')} unit="%" max={50} lang={lang} />
            <NumberField id="ev-forbr" label={T(lang, 'Bilens förbrukning', 'Car consumption')} value={v.forbr} onChange={set('forbr')} unit="kWh/mil" max={10} decimals={2} lang={lang} />
          </div>
          <label htmlFor="ev-lista" className="mt-3 block text-sm font-medium text-navy-700">{T(lang, 'Klistra in nattens priser (öre eller kr, ett per rad)', 'Paste tonight’s prices (öre or kronor, one per line)')}</label>
          <textarea id="ev-lista" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-navy-300 p-3 font-mono text-sm text-navy-900" />
        </details>
      </>}
      result={<ResultPanel lang={lang} head={T(lang, 'Kostnad för laddningen', 'Cost of this charge')} value={kr(kostnad, lang)} sub={T(lang, `${kr(perMil, lang, 2)} per mil, ${tid} laddning`, `${kr(perMil, lang, 2)} per 10 km, ${tid} of charging`)} rows={rows}
        hyp={T(lang, `Standardvärden är exempel som du ändrar: ${E.batteri_kwh} kWh batteri, ${E.forlust_pct} % förluster, ${String(E.forbrukning_kwh_mil).replace('.', ',')} kWh per mil. Laddning med konstant effekt; i verkligheten sjunker effekten de sista procenten.`, `Defaults are examples for you to change: ${E.batteri_kwh} kWh battery, ${E.forlust_pct}% losses, ${E.forbrukning_kwh_mil} kWh per 10 km. Constant-power charging; in reality power tapers over the last few per cent.`)} methodHref={methodHref} copyText={kr(kostnad, lang)} />}
      after={plan ? <Kurva priser={plan.finals} minuter={plan.minuter} markStart={plan.win.start} markLen={plan.win.platser} lang={lang} aria={T(lang, 'Totalpris per tidsperiod', 'All-in price per time slot')} /> : null}
    />
  );
}
