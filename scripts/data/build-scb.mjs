/**
 * Télécharge les statistiques officielles de SCB (Statistiska centralbyrån, licence CC0) utilisées par le site :
 *  - EN0301A/SSDManadElhandelpris : elhandelspris par mois, avtalstyp × elområde × kundkategori (öre/kWh exkl. elskatt, moms, nät)
 *  - EN0301A/SSDHalvarElHus : totalpris för hushåll par semestre et tranche de consommation (handel, nät, elskatt, moms)
 *  - EN0301A/SSDArElnatspris : elnätspriser au 1er janvier, par kundkategori
 * Usage : node scripts/data/build-scb.mjs  → écrit src/data/scb-elpriser.json. Rejouable (RECETTE §4, §22).
 */
import { writeFileSync } from 'node:fs';
const BASE = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/EN/EN0301/EN0301A/';
async function q(table, query) {
  const r = await fetch(BASE + table, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, response: { format: 'json' } }) });
  if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
  return r.json();
}
const all = (code, values) => ({ code, selection: { filter: 'item', values } });
const meta = async (t) => (await fetch(BASE + t)).json();

const m1 = await meta('SSDManadElhandelpris');
const tid1 = m1.variables.find((v) => v.code === 'Tid').values.filter((x) => x >= '2022M01');
const handel = await q('SSDManadElhandelpris', [all('Avtalstyp', ['anvisat', 'rorligt', 'avtal1ar', 'avtal3ar']), all('Elomrade', ['SE1', 'SE2', 'SE3', 'SE4']), all('Kundkategori', ['1', '2', '3']), all('Tid', tid1)]);
const m2 = await meta('SSDHalvarElHus');
const tid2 = m2.variables.find((v) => v.code === 'Tid').values.filter((x) => x >= '2021H1');
const hus = await q('SSDHalvarElHus', [all('Kategorikwh', ['DB', 'DC', 'DD', 'DE']), all('Tid', tid2)]);
const m3 = await meta('SSDArElnatspris');
const tid3 = m3.variables.find((v) => v.code === 'Tid').values.filter((x) => x >= '2020');
const nat = await q('SSDArElnatspris', [all('Kundkategori', ['1', '2', '3']), all('Viktat', ['viktat']), all('Tid', tid3)]);

const out = {
  source: 'SCB, Statistiska centralbyrån: Elpriser och elavtal (EN0301A), API v1, licens CC0',
  retrieved_at: new Date().toISOString().slice(0, 10),
  // [avtalstyp, elområde, kundkategori, månad] → öre/kWh
  handel: handel.data.map((d) => [...d.key, Number(d.values[0])]).filter((r) => Number.isFinite(r[4])),
  // [kategori, halvår] → [handel, nät, elskatt, nät+elskatt, moms, total] öre/kWh
  hus: hus.data.map((d) => [...d.key, d.values.map(Number)]),
  // [kundkategori, viktat, år] → öre/kWh
  nat: nat.data.map((d) => [...d.key, Number(d.values[0])]),
  hus_columns: hus.columns.filter((c) => c.type === 'c').map((c) => c.text),
};
writeFileSync(new URL('../../src/data/scb-elpriser.json', import.meta.url), JSON.stringify(out));
console.log('handel', out.handel.length, 'hus', out.hus.length, 'nat', out.nat.length, out.hus_columns);
