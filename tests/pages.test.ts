/**
 * Contrôle des fichiers de `src/content/` (un guide = un fichier) avant même le build.
 * Une seule fiche : PAGE_FILES=vab-tak npx vitest run tests/pages.test.ts
 */
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { P } from '../src/lib/engine/params';
import * as M from '../src/lib/engine/index';
import { MINIS } from '../src/lib/mini-specs';
import { helpers } from '../src/lib/helpers';
import type { PageDef, Helpers, Lang } from '../src/lib/guide-types';

const dirs = ['guides', 'outils'];
const only = process.env.PAGE_FILES?.split(',').map((s) => s.trim().replace(/\.ts$/, ''));
const all: PageDef[] = [];
for (const d of dirs) {
  for (const f of readdirSync(new URL(`../src/content/${d}/`, import.meta.url))) {
    if (!f.endsWith('.ts')) continue;
    const mod = await import(`../src/content/${d}/${f}`);
    all.push(mod.default as PageDef);
  }
}
const CORE = ['home', 'method', 'about', 'widget', 'contact', 'editorial', 'privacy', 'terms', 'cookies'];
import plan from './plan.json';
const PLAN = [...plan.outils.map((x) => x[0] as string), ...plan.guides.map((x) => x[0] as string)];
const ids = new Set([...CORE, ...all.map((p) => p.id), ...PLAN]);
const pages = only ? all.filter((p) => only.includes(p.id)) : all;
/** Les ébauches réservées (titre vide) ne comptent pas dans les contrôles d'unicité. */
const written = all.filter((p) => p.sv.title !== '');
const words = (s: string) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

/** Helpers factices : enregistrent les liens internes et les sources citées. */
function spy(lang: Lang) {
  const links: string[] = [], srcs: string[] = [];
  const h: Helpers = {
    lang, P, M,
    a: (id, text) => { links.push(id); return `<a href="#${id}">${text}</a>`; },
    kr: (n) => `${n} kr`, num: (n) => String(n), ore: (n) => `${n} öre/kWh`, pct: (x) => `${x * 100} %`, date: (d) => d,
    table: (hd, rows) => `<table>${hd.join('')}${rows.flat().join('')}</table>`,
    src: (k, t) => { srcs.push(k); return t ?? P.sources[k].label[lang]; },
  };
  return { h, links, srcs };
}

describe('registre des pages', () => {
  it.skipIf(!process.env.PLAN_COMPLET)('plan complet : chaque page prévue existe, avec ses slugs', () => {
    for (const [id, , sv, en] of plan.outils) { const p = all.find((x) => x.id === id); expect(p, id).toBeTruthy(); expect(p!.sv.slug).toBe(sv); expect(p!.en.slug).toBe(en); }
    for (const [id, , , sv, en] of plan.guides) { const p = all.find((x) => x.id === id); expect(p, id as string).toBeTruthy(); expect(p!.sv.slug).toBe(sv); expect(p!.en.slug).toBe(en); }
  });
  it('identifiants et slugs uniques, sans année ni nombre de trois chiffres', () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    for (const l of ['sv', 'en'] as const) {
      const slugs = all.map((p) => p[l].slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) { expect(s, `${s} ressemble à une page de service`).not.toMatch(/faq|questions|about|method|metod|widget|kontakt|contact|villkor|integritet|privacy|cookie|legal|terms|sources|kallor|om-oss|glossar|ordlista|updates|nyheter|redaktionel/); expect(s).toMatch(/^[a-z0-9-]+$/); expect(s).not.toMatch(/20[2-3]\d|\d{3}|^\d/); }
    }
  });
  it('aucune question de FAQ partagée entre deux pages', () => {
    const seen = new Map<string, string>();
    for (const p of written) for (const l of ['sv', 'en'] as const) for (const f of p[l].faqs(spy(l).h)) {
      const k = f.q.toLowerCase().replace(/[\s?¿!.]+$/, '');
      expect(seen.get(k), `« ${f.q} » déjà sur ${seen.get(k)}`).toBeUndefined();
      seen.set(k, p.id);
    }
  });
  it('titres et descriptions uniques', () => {
    const t = written.flatMap((p) => [p.sv.title, p.en.title]); expect(new Set(t).size).toBe(t.length);
    const d = written.flatMap((p) => [p.sv.description, p.en.description]); expect(new Set(d).size).toBe(d.length);
  });
});

for (const p of pages) {
  describe(p.id, () => {
    it('mini-simulateur ou outil, liens et sources existants', () => {
      if (!p.tool) { expect(p.mini, 'mini manquant').toBeTruthy(); expect(MINIS[p.mini!], `src/lib/minis/${p.mini}.ts absent`).toBeTruthy(); }
      if (p.miniHref) expect(ids.has(p.miniHref)).toBe(true);
      expect(p.related.length).toBeGreaterThanOrEqual(3);
      for (const r of p.related) expect(ids.has(r), `related inconnu : ${r}`).toBe(true);
      expect(p.sources.length).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(P.sources[s], `source inconnue : ${s}`).toBeTruthy();
    });
    for (const l of ['sv', 'en'] as const) {
      it(`${l} : titre 50-60, description 150-160, sans tiret cadratin`, () => {
        const x = p[l];
        expect(x.title.length, x.title).toBeGreaterThanOrEqual(50); expect(x.title.length, x.title).toBeLessThanOrEqual(60);
        expect(x.description.length, x.description).toBeGreaterThanOrEqual(150); expect(x.description.length, x.description).toBeLessThanOrEqual(160);
        expect(x.title).toMatch(/2026/); expect(x.description).toMatch(/2026/);
        for (const s of [x.title, x.description, x.h1, x.intro, x.resume(spy(l).h)]) expect(s).not.toMatch(/—/);
      });
      it(`${l} : bloc citable ≥ 120 mots, FAQ 4 à 8 questions de 40 à 90 mots`, () => {
        const x = p[l];
        const res = x.resume(spy(l).h); const faqs = x.faqs(spy(l).h);
        expect(words(res)).toBeGreaterThanOrEqual(120);
        expect(faqs.length).toBeGreaterThanOrEqual(p.tool ? 3 : 4); expect(faqs.length).toBeLessThanOrEqual(8);
        for (const f of faqs) { const n = words(f.a); expect(n, `${n} mots : ${f.q}`).toBeGreaterThanOrEqual(40); expect(n, `${n} mots : ${f.q}`).toBeLessThanOrEqual(90); }
      });
      it(`${l} : corps, liens internes valides, aucun tiret cadratin`, () => {
        const { h, links, srcs } = spy(l);
        const body = p[l].body(h);
        for (const id of links) expect(ids.has(id), `lien vers une page inconnue : ${id}`).toBe(true);
        for (const s of srcs) expect(P.sources[s as keyof typeof P.sources]).toBeTruthy();
        expect(body).not.toMatch(/—|&mdash;/);
        for (const m of body.matchAll(/<!--mini:([A-Za-z0-9_]+)-->/g)) expect(MINIS[m[1]], `mini ${m[1]} absent`).toBeTruthy();
        const total = words(body) + words(p[l].resume(h)) + p[l].faqs(h).reduce((s, f) => s + words(f.q) + words(f.a), 0);
        expect(total, 'longueur').toBeGreaterThanOrEqual(p.tool ? 450 : 1100);
      });
    }
  });
}

/** Chiffres des extraits : chaque nombre du titre ou de la description doit se retrouver dans le texte
 *  rendu avec les vrais paramètres. Si un paramètre change, le test oblige à réécrire l'extrait. */
const digits = (s: string) => s.replace(/(\d)[\s\u00a0\u202f,.](?=\d{3}\b)/g, '$1');
for (const p of pages) {
  describe(`${p.id} : chiffres des extraits`, () => {
    for (const l of ['sv', 'en'] as const) {
      it(`${l} : nombres du titre et de la description présents dans la page`, () => {
        const H = helpers(l);
        const x = p[l];
        const texte = digits([x.resume(H), x.body(H), ...x.faqs(H).map((f) => `${f.q} ${f.a}`), x.h1, x.intro].join(' ').replace(/<[^>]+>/g, ' '));
        for (const n of digits(`${x.title} ${x.description}`).match(/\d+(?:[.,]\d+)?/g) ?? []) {
          if (/^20[2-3]\d$/.test(n) || Number(n.replace(',', '.')) < 13) continue;
          expect(texte.includes(n) || texte.includes(n.replace('.', ',')) || texte.includes(n.replace(',', '.')), `« ${n} » (titre/description) absent du texte de ${p.id}/${l}`).toBe(true);
        }
      });
    }
  });
}

describe('mini-simulateurs', () => {
  for (const [k, f] of Object.entries(MINIS)) {
    it(`${k} : résultat calculé dans les deux langues, sans NaN`, () => {
      for (const l of ['sv', 'en'] as const) {
        const s = f(l);
        const v = Object.fromEntries(s.inputs.map((i) => [i.id, i.def]));
        const o = s.run(v);
        expect(o.head[1]).not.toMatch(/NaN|undefined|Infinity/);
        for (const [, x] of o.rows) expect(x).not.toMatch(/NaN|undefined|Infinity/);
        // bornes : champ vidé (0) et valeur maximale
        for (const edge of [0, 1]) {
          const w = Object.fromEntries(s.inputs.map((i) => [i.id, i.options ? Number(i.options[edge ? i.options.length - 1 : 0].value) : edge ? (i.max ?? i.def * 10) : 0]));
          const e = s.run(w);
          expect(e.head[1], `${k} borne ${edge}`).not.toMatch(/NaN|undefined|Infinity/);
          for (const [, x] of e.rows) expect(x, `${k} borne ${edge}`).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    });
  }
});
