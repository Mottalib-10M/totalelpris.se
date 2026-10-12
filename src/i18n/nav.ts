import { route, type Locale } from './routes';
import { PAGES, pageById, GROUPS } from '../lib/guides';
import type { Group } from '../lib/guide-types';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const CORE: Record<Locale, Record<string, string>> = {
  sv: { home: 'Start', method: 'Metod och källor', about: 'Om oss', widget: 'Bädda in kalkylatorn', contact: 'Kontakt', editorial: 'Redaktionell policy', privacy: 'Integritetspolicy', terms: 'Villkor och utgivare', cookies: 'Cookies' },
  en: { home: 'Home', method: 'Method and sources', about: 'About', widget: 'Embed the calculator', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies' },
};
export const GROUP_LABEL: Record<Locale, Record<Group, string>> = {
  sv: { pris: 'Elpris', omrade: 'Elområden', stad: 'Städer', nat: 'Elnät', apparat: 'Apparater', guide: 'Guider' },
  en: { pris: 'Prices', omrade: 'Bidding zones', stad: 'Cities', nat: 'Grid', apparat: 'Appliances', guide: 'Guides' },
};
export const label = (id: string, lang: Locale) => CORE[lang][id] ?? pageById(id)?.[lang].nav ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
/** Dans un groupe : les outils d'abord, puis les guides par ordre. */
export const inGroup = (g: Group, lang: Locale) => PAGES.filter((p) => p.group === g).sort((a, b) => Number(!!b.tool) - Number(!!a.tool) || a.order - b.order).map((p) => link(p.id, lang));
export function navCategories(lang: Locale): NavCategory[] {
  return (GROUPS as Group[]).map((g) => ({ label: GROUP_LABEL[lang][g], links: inGroup(g, lang) })).filter((c) => c.links.length);
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang), { label: lang === 'sv' ? 'Webbplatsen' : 'Site', links: ['home', 'method', 'about', 'contact', 'editorial', 'widget', 'terms', 'privacy', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (_lang: Locale): NavLink[] => [];
