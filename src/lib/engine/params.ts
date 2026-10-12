/**
 * Paramètres 2026 du site, lus une seule fois depuis `data/params-2026.json` (RECETTE §4). Les sources
 * propres à une famille de pages peuvent vivre dans `data/sources/<famille>.json` (même format que
 * `sources` du fichier principal) : elles sont fusionnées ici, une clé ne peut exister qu'une fois.
 */
import raw from '../../data/params-2026.json';

export interface Source { url: string; label: { sv: string; en: string } }
const extra = import.meta.glob<{ default: Record<string, Source> }>('../../data/sources/*.json', { eager: true });
const sources: Record<string, Source> = { ...raw.sources };
for (const [f, m] of Object.entries(extra)) for (const [k, s] of Object.entries(m.default)) {
  if (sources[k]) throw new Error(`Source « ${k} » définie deux fois (${f})`);
  sources[k] = s;
}
export const P = { ...raw, sources };
export type Params = typeof P;
export type SourceKey = string;
export const YEAR_PARAMS = raw.year;
