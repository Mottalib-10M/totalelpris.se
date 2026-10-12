/** Diagnostic (pas un contrôle) : liste d'un coup toutes les longueurs hors règle des pages choisies.
 *  PAGE_FILES=id1,id2 npx vitest run tests/lint.test.ts */
import { it } from 'vitest';
import { readdirSync } from 'node:fs';
import { helpers } from '../src/lib/helpers';
import type { PageDef } from '../src/lib/guide-types';
const only = process.env.PAGE_FILES?.split(',');
const words = (s: string) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
it('lint', async () => {
  const out: string[] = [];
  for (const d of ['guides', 'outils']) for (const f of readdirSync(new URL(`../src/content/${d}/`, import.meta.url))) {
    const p = (await import(`../src/content/${d}/${f}`)).default as PageDef;
    if (only && !only.includes(p.id)) continue;
    for (const l of ['sv', 'en'] as const) {
      const H = helpers(l), x = p[l];
      const r = words(x.resume(H)); if (r < 125) out.push(`${p.id}/${l} resume ${r}`);
      for (const q of x.faqs(H)) { const n = words(q.a); if (n < 42 || n > 88) out.push(`${p.id}/${l} faq ${n} : ${q.q}`); }
      const tot = words(x.body(H)) + r + x.faqs(H).reduce((s, q) => s + words(q.q) + words(q.a), 0);
      if (tot < (p.tool ? 470 : 1150)) out.push(`${p.id}/${l} total ${tot}`);
      if (x.title.length < 50 || x.title.length > 60) out.push(`${p.id}/${l} title ${x.title.length}`);
      if (x.description.length < 150 || x.description.length > 160) out.push(`${p.id}/${l} description ${x.description.length}`);
    }
  }
  process.stdout.write('\nLINT\n' + (out.join('\n') || 'ok') + '\n');
});
