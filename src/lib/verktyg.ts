/** Réglages par défaut d'un outil (`toolProps` d'une page) → props numériques des composants. */
import { hittaEnhet, FALL, ENHETER, type Fall } from './engine/nat';
import { ZONER, type Zon } from './engine/scb';

/** Zone de réseau par défaut du site : la première zone Ellevio Mellansverige si elle existe. */
export const STANDARD_NAT = hittaEnhet('Ellevio', 'Mellansverige')?.id ?? ENHETER[0].id;

export function verktygProps(tp: Record<string, string | number> = {}) {
  const e = typeof tp.nat === 'string' ? hittaEnhet(...(String(tp.nat).split('|') as [string, string?])) : undefined;
  if (typeof tp.nat === 'string' && !e) throw new Error(`toolProps.nat inconnu dans le relevé Ei : ${tp.nat}`);
  const fallIdx = typeof tp.fall === 'string' ? FALL.indexOf(tp.fall as Fall) : -1;
  const zonIdx = typeof tp.zon === 'string' ? ZONER.indexOf(tp.zon as Zon) : 2;
  return {
    nat: e?.id ?? STANDARD_NAT,
    fall: fallIdx >= 0 ? fallIdx : 0,
    zon: zonIdx >= 0 ? zonIdx : 2,
    skatt: tp.skatt ? 1 : 0,
    apparat: String(tp.apparat ?? 'tvattmaskin'),
    mode: String(tp.mode ?? 'idag'),
  };
}
