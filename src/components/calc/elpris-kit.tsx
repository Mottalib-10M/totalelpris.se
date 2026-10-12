/**
 * Briques communes aux calculateurs de prix : choix du réseau local (relevé Ei), du logement (cas type
 * Ei), de la zone et de la fiscalité, puis calcul du prix final par le moteur (lib/engine/pris.ts).
 * Aucun prix spot n'est téléchargé : la valeur par défaut est la moyenne SCB du contrat « rörligt »
 * du dernier mois publié (påslag compris), et l'utilisateur la remplace par son propre prix.
 */
import { useMemo } from 'react';
import SelectField from '../ui/SelectField';
import NumberField from '../ui/NumberField';
import Toggle from '../ui/Toggle';
import { ENHETER, FALL, FALL_KWH, natTariff, type Fall } from '../../lib/engine/nat';
import { totalpris, inklMoms } from '../../lib/engine/pris';
import { varde, SENASTE_MANAD, ZONER, manadDelar, type Zon } from '../../lib/engine/scb';
import { P } from '../../lib/engine/params';
import { T, type L } from './kit';

export const KAT: Record<Fall, '1' | '2' | '3'> = { L16: '1', V16: '2', V20a: '3', V20: '3', V25: '3', V25b: '3' };
const MANADER = { sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
export const manadNamn = (m: string, l: L) => { const { ar, man } = manadDelar(m); return `${MANADER[l][man - 1]} ${ar}`; };

/** Prix de défaut : moyenne SCB du contrat rörligt du dernier mois, zone et logement donnés (öre/kWh hors moms). */
export const spotDefault = (zon: number, fall: Fall) => varde('rorligt', ZONER[zon] as Zon, KAT[fall]) ?? 80;

export interface Val { nat: number; fall: number; zon: number; spot: number; paslag: number; skatt: number }

export function useBerakning(v: Val) {
  return useMemo(() => {
    const fall = FALL[v.fall] ?? 'L16';
    const enhet = ENHETER[v.nat] ?? ENHETER[0];
    const tariff = natTariff(enhet, fall);
    const energiskatt = v.skatt ? P.skatt.energiskatt_sankt_ore : P.skatt.energiskatt_ore;
    const delar = totalpris({ spot: v.spot, paslag: v.paslag, natOverforing: tariff?.rorligOre ?? 0, energiskatt, momsSats: P.skatt.moms });
    const natFastInkl = tariff ? inklMoms(tariff.fastKrPerAr, P.skatt.moms) : 0;
    return { fall, enhet, tariff, energiskatt, delar, natFastInkl, kwhAr: FALL_KWH[fall] };
  }, [v.nat, v.fall, v.zon, v.spot, v.paslag, v.skatt]);
}

/** Options du réseau : toutes les zones Ei qui ont au moins un tarif 2026, par nom. */
export const natOptions = () => ENHETER.filter((e) => Object.values(e.cas).some((c) => c && c['2026']?.total)).sort((a, b) => a.namn.localeCompare(b.namn, 'sv')).map((e) => ({ value: String(e.id), label: e.namn }));
export const fallOptions = (l: L) => FALL.map((f, i) => ({ value: String(i), label: T(l, { L16: 'Lägenhet, 16 A', V16: 'Villa, 16 A', V20a: 'Villa, 20 A', V20: 'Villa, 20 A', V25: 'Villa, 25 A', V25b: 'Villa, 25 A' }[f], { L16: 'Flat, 16 A fuse', V16: 'House, 16 A fuse', V20a: 'House, 20 A fuse', V20: 'House, 20 A fuse', V25: 'House, 25 A fuse', V25b: 'House, 25 A fuse' }[f]) }));
export const zonOptions = () => ZONER.map((z, i) => ({ value: String(i), label: z }));

interface FieldsProps { lang: L; v: Val; set: (k: keyof Val) => (x: number) => void; idp: string; spotLabel?: string; showZon?: boolean; extra?: boolean }
/** Les champs communs, dans l'ordre : prix spot, zone, réseau, logement ; påslag et energiskatt ensuite. */
export function GrundFalt({ lang, v, set, idp, spotLabel, showZon = true, extra = true }: FieldsProps) {
  const fall = FALL[v.fall] ?? 'L16';
  const def = spotDefault(v.zon, fall);
  const sv = lang === 'sv';
  return (
    <>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <NumberField id={`${idp}-spot`} label={spotLabel ?? T(lang, 'Ditt spotpris, öre/kWh exkl. moms', 'Your spot price, öre/kWh excl. VAT')} value={v.spot} onChange={set('spot')} unit="öre" min={-500} max={2000} decimals={1} lang={lang}
          help={sv ? `Förifyllt: SCB-snitt för rörligt avtal i ${ZONER[v.zon]}, ${manadNamn(SENASTE_MANAD, lang)} (${String(def).replace('.', ',')} öre, påslag ingår). Skriv in dagens pris från din elhandlare.` : `Pre-filled: Statistics Sweden average for a variable contract in ${ZONER[v.zon]}, ${manadNamn(SENASTE_MANAD, lang)} (${def} öre, retailer mark-up included). Type today’s price from your retailer.`} />
        {showZon && <SelectField id={`${idp}-zon`} label={T(lang, 'Elområde', 'Bidding zone')} value={String(v.zon)} onChange={(x) => set('zon')(Number(x))} options={zonOptions()} />}
      </div>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <SelectField id={`${idp}-nat`} label={T(lang, 'Ditt elnät (nätområde enligt Ei)', 'Your grid area (as listed by Ei)')} value={String(v.nat)} onChange={(x) => set('nat')(Number(x))} options={natOptions()} />
        <SelectField id={`${idp}-fall`} label={T(lang, 'Bostad och säkring', 'Home and main fuse')} value={String(v.fall)} onChange={(x) => set('fall')(Number(x))} options={fallOptions(lang).filter((_, i) => ['L16', 'V16', 'V20', 'V25'].includes(FALL[i]))} />
      </div>
      {extra && <ExtraFalt lang={lang} v={v} set={set} idp={idp} />}
    </>
  );
}

/** Påslag et energiskatt réduite : visibles sur le calculateur principal, repliés ailleurs. */
export function ExtraFalt({ lang, v, set, idp }: FieldsProps) {
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <NumberField id={`${idp}-paslag`} label={T(lang, 'Påslag, öre/kWh exkl. moms', 'Retailer mark-up, öre/kWh excl. VAT')} value={v.paslag} onChange={set('paslag')} unit="öre" max={200} decimals={1} lang={lang} help={T(lang, 'Står i ditt avtal. Lämna 0 om priset ovan redan är ditt elhandelspris.', 'Shown in your contract. Leave 0 if the price above already is your retail price.')} />
        <Toggle id={`${idp}-skatt`} label={T(lang, 'Sänkt energiskatt (vissa norrlandskommuner)', 'Reduced energy tax (some northern municipalities)')} value={String(v.skatt)} onChange={(x) => set('skatt')(Number(x))} options={[{ value: '0', label: T(lang, 'Nej', 'No') }, { value: '1', label: T(lang, 'Ja', 'Yes') }]} />
      </div>
  );
}
