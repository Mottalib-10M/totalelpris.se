/**
 * Coût d'un appareil (lave-linge, sèche-linge, sauna…) au prix final : énergie par utilisation ×
 * prix TTC du kWh, par utilisation et par an ; avec une liste de prix collée, heure de départ la moins
 * chère. L'énergie par défaut vient de params-2026.json (valeur sourcée ou exemple annoncé comme tel).
 */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import Kurva from './Kurva';
import { Frame, ResultPanel, useParams, T, kr, ore, nr, type L } from './kit';
import { GrundFalt, ExtraFalt, useBerakning, spotDefault } from './elpris-kit';
import { FALL } from '../../lib/engine/nat';
import { kostnadKr, totalpris } from '../../lib/engine/pris';
import { lasSerie, tillOre, billigasteFonster, statistik, klockslag } from '../../lib/engine/kvart';
import { P } from '../../lib/engine/params';

type Key = keyof typeof P.apparater;
interface Props { lang: L; methodHref?: string; apparat: string; nat: number; fall?: number; zon?: number; skatt?: number }

export default function ApparatCalc({ lang, methodHref, apparat, nat, fall = 1, zon = 2, skatt = 0 }: Props) {
  const a = P.apparater[apparat as Key];
  const [v, set] = useParams({ nat, fall, zon, spot: 0, paslag: 0, skatt, kwh: a.kwh, ggr: a.ggr_vecka, min: a.minuter, kw: (a as { effekt_kw?: number }).effekt_kw ?? 0 });
  const typ = a.typ as 'gang' | 'effekt' | 'ar';
  // Énergie d'une utilisation : saisie directe, ou puissance × durée (sauna) ; « ar » = consommation annuelle.
  const kwhGang = typ === 'effekt' ? (v.kw * v.min) / 60 : v.kwh;
  const f = FALL[v.fall] ?? 'L16';
  const spot = v.spot !== 0 ? v.spot : spotDefault(v.zon, f);
  const b = useBerakning({ ...v, spot });
  const [text, setText] = useState('');
  const serie = useMemo(() => (text.trim() ? lasSerie(text) : null), [text]);
  const plan = useMemo(() => {
    if (!serie || !serie.priser.length || serie.enhet === 'eur-mwh') return null;
    const finals = tillOre(serie).map((s) => totalpris({ spot: s, paslag: v.paslag, natOverforing: b.tariff?.rorligOre ?? 0, energiskatt: b.energiskatt, momsSats: P.skatt.moms }).total);
    const win = billigasteFonster(finals, serie.minuter, Math.max(15, typ === 'ar' ? 60 : v.min));
    const st = statistik(finals);
    return { finals, win, st, minuter: serie.minuter };
  }, [serie, v.min, v.paslag, b]);
  const per = kostnadKr(kwhGang, b.delar.total);
  const perAr = typ === 'ar' ? per : per * v.ggr * 52;
  const namn = T(lang, a.namn_sv, a.namn_en);
  const rows = [
    { label: T(lang, 'Totalpris per kWh', 'All-in price per kWh'), value: ore(b.delar.total, lang) },
    { label: typ === 'ar' ? T(lang, 'Förbrukning per år', 'Consumption per year') : T(lang, 'Energi per gång', 'Energy per use'), value: `${nr(kwhGang, lang, typ === 'ar' ? 0 : 2)} kWh` },
    typ === 'ar' ? { label: T(lang, 'Kostnad per månad', 'Cost per month'), value: kr(perAr / 12, lang) } : { label: T(lang, 'Kostnad per vecka', 'Cost per week'), value: kr(per * v.ggr, lang, 0) },
    { label: T(lang, 'Kostnad per år', 'Cost per year'), value: kr(perAr, lang), strong: true },
  ];
  if (plan && plan.win.start >= 0 && typ !== 'ar') {
    rows.push({ label: T(lang, `Billigast start kl. ${klockslag(plan.win.start, plan.minuter)}`, `Cheapest start ${klockslag(plan.win.start, plan.minuter)}`), value: kr(kostnadKr(kwhGang, plan.win.snitt), lang, 2) });
    rows.push({ label: T(lang, `Dyrast: kl. ${klockslag(plan.st.maxIdx, plan.minuter)}`, `Most expensive: ${klockslag(plan.st.maxIdx, plan.minuter)}`), value: kr(kostnadKr(kwhGang, plan.st.max), lang, 2) });
  }
  return (
    <Frame
      form={<>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {typ === 'effekt'
            ? <NumberField id="app-kw" label={T(lang, `${namn}: effekt`, `${namn}: power`)} value={v.kw} onChange={set('kw')} unit="kW" max={50} decimals={1} lang={lang} help={T(lang, a.hjalp_sv, a.hjalp_en)} />
            : <NumberField id="app-kwh" label={typ === 'ar' ? T(lang, `${namn}: kWh per år`, `${namn}: kWh per year`) : T(lang, `${namn}: kWh per gång`, `${namn}: kWh per use`)} value={v.kwh} onChange={set('kwh')} unit="kWh" max={typ === 'ar' ? 5000 : 200} decimals={typ === 'ar' ? 0 : 2} lang={lang} help={T(lang, a.hjalp_sv, a.hjalp_en)} />}
          {typ === 'effekt'
            ? <NumberField id="app-min" label={T(lang, 'Minuter påslagen', 'Minutes switched on')} value={v.min} onChange={set('min')} unit="min" max={1440} lang={lang} />
            : typ === 'gang' ? <NumberField id="app-ggr" label={T(lang, 'Gånger per vecka', 'Uses per week')} value={v.ggr} onChange={set('ggr')} max={100} decimals={1} lang={lang} /> : null}
        </div>
        {typ === 'effekt' && <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2"><NumberField id="app-ggr" label={T(lang, 'Gånger per vecka', 'Uses per week')} value={v.ggr} onChange={set('ggr')} max={100} decimals={1} lang={lang} /></div>}
        <GrundFalt lang={lang} v={{ ...v, spot }} set={(k) => (x) => set(k)(k === 'spot' && x === 0 ? 0.01 : x)} idp="app" extra={false} />
        <details className="rounded-lg border border-navy-200 p-4">
          <summary className="cursor-pointer font-medium text-navy-900">{T(lang, 'Påslag, energiskatt och billigaste starttid', 'Mark-up, energy tax and cheapest start time')}</summary>
          <div className="mt-3"><ExtraFalt lang={lang} v={{ ...v, spot }} set={set} idp="app" /></div>
          <label htmlFor="app-lista" className="mt-3 block text-sm font-medium text-navy-700">{T(lang, 'Priser i öre eller kr, ett per rad (24 timpriser eller 96 kvartspriser)', 'Prices in öre or kronor, one per line (24 hourly or 96 quarter-hour prices)')}</label>
          <textarea id="app-lista" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-navy-300 p-3 font-mono text-sm text-navy-900" />
          {typ === 'gang' && <div className="mt-3 grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <NumberField id="app-prog" label={T(lang, 'Programmets längd', 'Programme length')} value={v.min} onChange={set('min')} unit="min" max={1440} lang={lang} />
          </div>}
        </details>
      </>}
      result={<ResultPanel lang={lang} head={typ === 'ar' ? T(lang, `${namn}: kostnad per år`, `${namn}: cost per year`) : T(lang, `${namn}: kostnad per gång`, `${namn}: cost per use`)} value={kr(typ === 'ar' ? perAr : per, lang, typ === 'ar' ? 0 : 2)} sub={typ === 'ar' ? T(lang, `${kr(perAr / 12, lang)} i månaden`, `${kr(perAr / 12, lang)} a month`) : T(lang, `${kr(perAr, lang)} per år vid ${nr(v.ggr, lang, 1)} gånger i veckan`, `${kr(perAr, lang)} a year at ${nr(v.ggr, lang, 1)} uses a week`)} rows={rows}
        hyp={T(lang, `${a.kalla_sv} Priset per kWh räknas som på elpriskalkylen: ditt spotpris, påslag, Ei:s överföringsavgift för ${b.enhet.namn}, energiskatt och moms.`, `${a.kalla_en} The price per kWh is worked out as in the main calculator: your spot price, mark-up, Ei’s transfer fee for ${b.enhet.namn}, energy tax and VAT.`)} methodHref={methodHref} copyText={`${namn}: ${kr(per, lang, 2)}`} />}
      after={plan ? <Kurva priser={plan.finals} minuter={plan.minuter} markStart={plan.win.start} markLen={plan.win.platser} lang={lang} aria={T(lang, 'Totalpris per tidsperiod', 'All-in price per time slot')} /> : null}
    />
  );
}
