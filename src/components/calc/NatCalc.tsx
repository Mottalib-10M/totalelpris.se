/**
 * Comparateur des tarifs de réseau : pour une zone de réseau (relevé Ei au 1er janvier 2026) et un cas
 * type, coût annuel TTC, prix variable, place dans le classement national, médiane, et variation
 * depuis 2025. Le tableau des zones les moins et les plus chères est replié sous le résultat.
 */
import SelectField from '../ui/SelectField';
import NumberField from '../ui/NumberField';
import { Frame, ResultPanel, useParams, T, kr, ore, nr, pct, type L } from './kit';
import { natOptions } from './elpris-kit';
import { ENHETER, FALL, FALL_KWH, natTariff, natKostnad, rangordna, placering, type Fall } from '../../lib/engine/nat';
import { inklMoms } from '../../lib/engine/pris';
import { P } from '../../lib/engine/params';

const FALLNAMN: Record<Fall, [string, string]> = { L16: ['Lägenhet 16 A, 2 000 kWh/år', 'Flat 16 A, 2,000 kWh/yr'], V16: ['Villa 16 A, 5 000 kWh/år', 'House 16 A, 5,000 kWh/yr'], V20a: ['Villa 20 A, 10 000 kWh/år', 'House 20 A, 10,000 kWh/yr'], V20: ['Villa 20 A, 20 000 kWh/år', 'House 20 A, 20,000 kWh/yr'], V25: ['Villa 25 A, 20 000 kWh/år', 'House 25 A, 20,000 kWh/yr'], V25b: ['Villa 25 A, 30 000 kWh/år', 'House 25 A, 30,000 kWh/yr'] };
interface Props { lang: L; methodHref?: string; nat: number; fall?: number }

export default function NatCalc({ lang, methodHref, nat, fall = 1 }: Props) {
  const [v, set] = useParams({ nat, fall, kwh: 0 });
  const f = FALL[v.fall] ?? 'V16';
  const e = ENHETER[v.nat] ?? ENHETER[0];
  const t = natTariff(e, f);
  const t25 = natTariff(e, f, 2025);
  const kwh = v.kwh || FALL_KWH[f];
  const mo = 1 + P.skatt.moms;
  const ar = t ? inklMoms(natKostnad(t, kwh), P.skatt.moms) : 0;
  const pl = t ? placering(e, f) : null;
  const r = rangordna(f);
  const rows = t ? [
    { label: T(lang, 'Fast avgift och myndighetsavgifter per år', 'Fixed fee and authority charges per year'), value: kr(t.fastKrPerAr * mo, lang) },
    { label: T(lang, 'Överföringsavgift (snitt för typfallet)', 'Transfer fee (average for the case)'), value: ore(t.rorligOre * mo, lang) },
    { label: T(lang, `Nätkostnad för ${nr(kwh, lang)} kWh per år`, `Grid cost for ${nr(kwh, lang)} kWh a year`), value: kr(ar, lang), strong: true },
    { label: T(lang, 'Per månad', 'Per month'), value: kr(ar / 12, lang) },
    { label: T(lang, `Plats bland ${pl!.av} nätområden (1 = billigast)`, `Rank among ${pl!.av} grid areas (1 = cheapest)`), value: String(pl!.plats) },
    { label: T(lang, 'Medianen i Sverige, typfallet', 'Swedish median, standard case'), value: kr(pl!.median * mo, lang) },
    ...(t25 ? [{ label: T(lang, 'Ändring sedan 2025, typfallet', 'Change since 2025, standard case'), value: pct(t.totalKrPerAr / t25.totalKrPerAr - 1, lang, 1) }] : []),
  ] : [{ label: T(lang, 'Ei redovisar inget pris för detta typfall', 'Ei lists no price for this standard case'), value: '–' }];
  return (
    <Frame
      form={<>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <SelectField id="nat-enhet" label={T(lang, 'Nätföretag och nätområde', 'Grid company and area')} value={String(v.nat)} onChange={(x) => set('nat')(Number(x))} options={natOptions()} />
          <SelectField id="nat-fall" label={T(lang, 'Typfall enligt Ei', 'Ei standard case')} value={String(v.fall)} onChange={(x) => set('fall')(Number(x))} options={FALL.map((x, i) => ({ value: String(i), label: T(lang, FALLNAMN[x][0], FALLNAMN[x][1]) }))} />
        </div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <NumberField id="nat-kwh" label={T(lang, 'Din förbrukning per år', 'Your consumption per year')} value={kwh} onChange={set('kwh')} unit="kWh" max={200000} lang={lang} help={T(lang, 'Förifyllt med typfallets förbrukning.', 'Pre-filled with the standard case.')} />
        </div>
        <details className="rounded-lg border border-navy-200 p-4">
          <summary className="cursor-pointer font-medium text-navy-900">{T(lang, `De 10 billigaste och 10 dyraste nätområdena, ${FALLNAMN[f][0]}`, `The 10 cheapest and 10 most expensive grid areas, ${FALLNAMN[f][1]}`)}</summary>
          <table className="mt-3 w-full text-sm"><thead><tr><th scope="col" className="py-1 text-left">#</th><th scope="col" className="py-1 text-left">{T(lang, 'Nätområde', 'Grid area')}</th><th scope="col" className="py-1 text-right">{T(lang, 'kr/år inkl. moms', 'SEK/yr incl. VAT')}</th></tr></thead>
            <tbody>{[...r.slice(0, 10).map((x, i) => [i + 1, x] as const), ...r.slice(-10).map((x, i) => [r.length - 9 + i, x] as const)].map(([n, x]) => <tr key={x.e.id} className={x.e.id === e.id ? 'font-semibold' : ''}><td className="tabular-nums py-1">{n}</td><td className="py-1">{x.e.namn}</td><td className="tabular-nums py-1 text-right">{kr(x.t.totalKrPerAr * mo, lang)}</td></tr>)}</tbody></table>
        </details>
      </>}
      result={<ResultPanel lang={lang} head={T(lang, `Nätavgift per år, ${e.namn}`, `Grid fee per year, ${e.namn}`)} value={t ? kr(ar, lang) : '–'} sub={T(lang, 'inkl. moms, utan energiskatt', 'incl. VAT, before energy tax')} rows={rows}
        hyp={T(lang, `Ei:s sammanställning av nätföretagens avgifter för hushåll per 1 januari ${P.year}, priser exkl. moms som vi lagt moms på. Effektavgifter ingår bara om de finns i Ei:s typfall. Nätföretaget kan ändra priset under året.`, `Ei’s compilation of grid companies’ household charges on 1 January ${P.year}, VAT added to its ex-VAT prices. Power charges count only where they are in Ei’s standard case. The grid company may change prices during the year.`)} methodHref={methodHref} copyText={t ? `${e.namn}: ${kr(ar, lang)}` : ''} />}
    />
  );
}
