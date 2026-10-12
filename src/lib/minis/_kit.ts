/** Petits outils communs aux mini-simulateurs (fichier ignoré par le registre : préfixe « _ »). */
import { formatMoney, formatPercent, formatNumber } from '../format';
import { ZONER } from '../engine/scb';
export type L = 'sv' | 'en';
export const T = <A>(l: L, sv: A, en: A) => (l === 'en' ? en : sv);
export const kr = (x: number, l: L, d = 0) => formatMoney(x, d, l);
export const pct = (x: number, l: L, d = 1) => formatPercent(x, d, l);
export const num = (x: number, l: L, d = 0) => formatNumber(x, d, l);
export const ore = (x: number, l: L, d = 1) => `${formatNumber(x, d, l)} öre/kWh`;
/** Options d'elområde pour un champ `options` : valeur = index 0..3. */
export const zonOptions = () => ZONER.map((z, i) => ({ value: String(i), label: z }));
