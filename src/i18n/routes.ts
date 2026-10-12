import { makeRouter, type RouteDef } from './routes-core';
import { PAGES } from '../lib/guides';
export const LOCALES = ['sv', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'sv';
const R = (id: string, sv: string, en: string, noindex = false): RouteDef<Locale> => ({ id, paths: { sv: `/sv/${sv}/`, en: `/en/${en}/` }, ...(noindex ? { noindex } : {}) });
/** Pages du cœur. Les guides et les pages outils viennent de `src/content/` (lib/guides.ts). */
const CORE: RouteDef<Locale>[] = [
  { id: 'home', paths: { sv: '/sv/', en: '/en/' } },
  R('method', 'metodologi', 'method'),
  R('about', 'om-oss', 'about'),
  R('widget', 'widget', 'widget', true),
  R('contact', 'kontakt', 'contact', true),
  R('editorial', 'redaktionell-policy', 'editorial-policy', true),
  R('privacy', 'integritetspolicy', 'privacy', true),
  R('terms', 'villkor', 'legal-notice', true),
  R('cookies', 'cookies', 'cookies', true),
];
export const ROUTES: RouteDef<Locale>[] = [
  CORE[0],
  ...PAGES.map((p) => R(p.id, p.sv.slug, p.en.slug)),
  ...CORE.slice(1),
];
export const { NOINDEX_PATHS, route, altPaths } = makeRouter(LOCALES, ROUTES);
