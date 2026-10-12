/**
 * Historique officiel des prix de l'électricité facturés aux ménages (SCB, CC0) : série mensuelle par
 * zone, type de logement et type de contrat, moyenne annuelle et coût de l'énergie pour un volume saisi.
 * Mode « avtal » : comparaison des contrats (rörligt, fast 1 an, fast 3 ans, anvisat) sur 12 mois.
 */
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { Frame, ResultPanel, useParams, T, kr, ore, type L } from './kit';
import { manadNamn } from './elpris-kit';
import { serie, arssnitt, jamforAvtal, SENASTE_MANAD, ZONER, AVTAL, type Avtal, type Zon, type Kategori } from '../../lib/engine/scb';
import { inklMoms } from '../../lib/engine/pris';
import { P } from '../../lib/engine/params';

const AVTAL_NAMN: Record<Avtal, [string, string]> = { rorligt: ['Rörligt månadspris', 'Variable monthly price'], avtal1ar: ['Fast pris 1 år', 'Fixed price, 1 year'], avtal3ar: ['Fast pris 3 år', 'Fixed price, 3 years'], anvisat: ['Anvisat avtal (inget valt)', 'Default contract (none chosen)'] };
const KAT_NAMN: Array<[Kategori, string, string]> = [['1', 'Lägenhet', 'Flat'], ['2', 'Villa utan elvärme', 'House without electric heating'], ['3', 'Villa med elvärme', 'House with electric heating']];

interface Props { lang: L; methodHref?: string; mode?: 'historik' | 'avtal'; zon?: number }

export default function HistorikCalc({ lang, methodHref, mode = 'historik', zon = 2 }: Props) {
  const [v, set] = useParams({ zon, kat: 1, avtal: 0, kwh: mode === 'avtal' ? 1000 : 400 });
  const z = ZONER[v.zon] as Zon, k = KAT_NAMN[v.kat]?.[0] ?? '2', a = AVTAL[v.avtal] ?? 'rorligt';
  const s = serie(a, z, k);
  const last = s[s.length - 1];
  const ar = Number(SENASTE_MANAD.slice(0, 4));
  const years = [ar - 4, ar - 3, ar - 2, ar - 1, ar].map((y) => ({ y, s: arssnitt(a, z, k, y) }));
  const jam = jamforAvtal(z, k, v.kwh);
  const billigast = [...jam].filter((x) => x.manader).sort((x, y) => x.kr - y.kr)[0];
  const mo = 1 + P.skatt.moms;
  const max = Math.max(...s.slice(-48).map(([, x]) => x), 1);
  const fields = (
    <>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <SelectField id="hist-zon" label={T(lang, 'Elområde', 'Bidding zone')} value={String(v.zon)} onChange={(x) => set('zon')(Number(x))} options={ZONER.map((x, i) => ({ value: String(i), label: x }))} />
        <SelectField id="hist-kat" label={T(lang, 'Bostad', 'Home')} value={String(v.kat)} onChange={(x) => set('kat')(Number(x))} options={KAT_NAMN.map(([, sv, en], i) => ({ value: String(i), label: T(lang, sv, en) }))} />
      </div>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {mode === 'historik' && <SelectField id="hist-avtal" label={T(lang, 'Avtalstyp', 'Contract type')} value={String(v.avtal)} onChange={(x) => set('avtal')(Number(x))} options={AVTAL.map((x, i) => ({ value: String(i), label: T(lang, AVTAL_NAMN[x][0], AVTAL_NAMN[x][1]) }))} />}
        <NumberField id="hist-kwh" label={T(lang, 'Förbrukning per månad', 'Consumption per month')} value={v.kwh} onChange={set('kwh')} unit="kWh" max={20000} lang={lang} />
      </div>
    </>
  );
  if (mode === 'avtal') {
    const rows = jam.map((x) => ({ label: `${T(lang, AVTAL_NAMN[x.avtal][0], AVTAL_NAMN[x.avtal][1])} (${ore(x.snittOre * mo, lang)})`, value: x.manader ? kr(x.kr * mo, lang) : '–', strong: x === billigast }));
    return <Frame form={fields} result={<ResultPanel lang={lang} head={T(lang, `Billigast de senaste ${billigast?.manader ?? 12} månaderna i ${z}`, `Cheapest over the last ${billigast?.manader ?? 12} months in ${z}`)} value={billigast ? T(lang, AVTAL_NAMN[billigast.avtal][0], AVTAL_NAMN[billigast.avtal][1]) : '–'} sub={billigast ? T(lang, `${kr(billigast.kr * mo, lang)} för elenergin, inkl. moms`, `${kr(billigast.kr * mo, lang)} for the energy, incl. VAT`) : ''} rows={rows}
      hyp={T(lang, `SCB:s elhandelspriser per månad, ${manadNamn(SENASTE_MANAD, lang)} senast, omräknade med moms ${P.skatt.moms * 100} %. Bara elhandeln: nätavgift och energiskatt är lika för alla avtal. Fastpriset är snittet för avtal som tecknades varje månad, inte priset på ett avtal du redan har.`, `Statistics Sweden monthly retail prices up to ${manadNamn(SENASTE_MANAD, lang)}, with 25% VAT added. Retail energy only: grid fees and energy tax are the same whatever the contract. The fixed price is the average for contracts signed each month, not the price of a contract you already hold.`)} methodHref={methodHref} copyText={billigast ? AVTAL_NAMN[billigast.avtal][0] : ''} />} />;
  }
  const rows = years.map(({ y, s: x }) => ({ label: T(lang, `Snitt ${y}${x && x.manader < 12 ? ` (${x.manader} mån)` : ''}`, `Average ${y}${x && x.manader < 12 ? ` (${x.manader} months)` : ''}`), value: x ? ore(x.snitt * mo, lang) : '–' }));
  rows.push({ label: T(lang, `${v.kwh} kWh i ${last ? manadNamn(last[0], lang) : ''}`, `${v.kwh} kWh in ${last ? manadNamn(last[0], lang) : ''}`), value: last ? kr((last[1] * v.kwh * mo) / 100, lang) : '–', strong: true });
  return (
    <Frame form={fields}
      result={<ResultPanel lang={lang} head={T(lang, `${AVTAL_NAMN[a][0]}, ${z}, ${last ? manadNamn(last[0], lang) : ''}`, `${AVTAL_NAMN[a][1]}, ${z}, ${last ? manadNamn(last[0], lang) : ''}`)} value={last ? ore(inklMoms(last[1], P.skatt.moms), lang) : '–'} sub={T(lang, 'Elhandelspris inkl. moms, utan nät och energiskatt', 'Retail energy price incl. VAT, without grid and energy tax')} rows={rows}
        hyp={T(lang, 'Källa: SCB, Elpriser och elavtal (EN0301A), licens CC0. Priserna är snitt av vad elhandlarna fakturerat hushållen, påslag ingår.', 'Source: Statistics Sweden, Electricity prices and contracts (EN0301A), CC0 licence. The prices are averages of what retailers billed households, mark-up included.')} methodHref={methodHref} copyText={last ? `${z} ${last[0]}: ${last[1]}` : ''} />}
      after={<figure className="mt-4"><svg viewBox="0 0 640 160" role="img" aria-label={T(lang, 'Elhandelspris per månad, de senaste fyra åren', 'Retail price per month, last four years')} className="h-auto w-full">
        {s.slice(-48).map(([m, x], i, arr) => <rect key={m} x={i * (640 / arr.length)} y={150 - (x / max) * 140} width={640 / arr.length - 2} height={(x / max) * 140} fill="#006AA7"><title>{`${m}: ${x}`}</title></rect>)}
      </svg><figcaption className="mt-1 text-xs text-navy-700">{T(lang, `Öre/kWh exkl. moms per månad, ${s.slice(-48)[0]?.[0] ?? ''} till ${last?.[0] ?? ''}. Högsta stapel: ${ore(max, lang)}.`, `Öre/kWh excl. VAT per month, ${s.slice(-48)[0]?.[0] ?? ''} to ${last?.[0] ?? ''}. Tallest bar: ${ore(max, lang)}.`)}</figcaption></figure>}
    />
  );
}
