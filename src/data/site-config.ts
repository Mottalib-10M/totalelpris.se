/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://se-elpris.example";
export const SITE_NAMES: Record<string, string> = {"sv": "Elpriskollen", "en": "Elpriskollen"};
export const LANG_TAGS: Record<string, string> = {"sv": "sv-SE", "en": "en-SE"};
export const OG_LOCALES: Record<string, string> = {"sv": "sv_SE", "en": "en_GB"};
/** Une locale par langue (RECETTE §4) : « 1 259 kr » en suédois, « SEK 1,259 » en anglais. */
export const LOCALE_BY_LANG: Record<string, string> = { sv: 'sv-SE', en: 'en-GB' };
export const LOCALE_TAG = 'sv-SE';
export const CURRENCY = 'SEK';
export const YEAR = 2026;
/** Année de création du site, signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-10-12';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"sv": "Utgivare av Elpriskollen · totalpris på el, nätavgifter och elkostnad per apparat i Sverige", "en": "Publisher of Elpriskollen · the all-in price of electricity, grid fees and appliance running costs in Sweden"};
export const AUTHOR_DESC: Record<string, string> = {"sv": "Radif Partners ger ut Elpriskollen, som räknar om spotpriset till det pris ett svenskt hushåll faktiskt betalar per kilowattimme: energiskatt enligt Skatteverket, moms och det lokala elnätsföretagets överföringsavgift, med varje tariff angiven med källa och datum.", "en": "Radif Partners publishes Elpriskollen, which turns the Nordic spot price into what a Swedish household actually pays per kilowatt-hour: energy tax as set by the Swedish Tax Agency, VAT and the local grid company’s transfer fee, each tariff shown with its source and date."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"sv": ["Elpriset i elområde SE1, SE2, SE3 och SE4", "Energiskatt och moms på el", "Elnätsavgifter och effektavgifter hos svenska nätföretag", "Rörligt, fast och timprisavtal", "Elkostnad för apparater och laddning av elbil"], "en": ["Electricity prices in Swedish bidding zones SE1 to SE4", "Energy tax and VAT on electricity in Sweden", "Grid fees and power tariffs of Swedish network companies", "Variable, fixed and hourly electricity contracts", "Running costs of appliances and electric-car charging"]};
export const CONTACT_EMAIL = "kontakt@se-elpris.example";
export const THEME_COLOR = '#006AA7';
export const LOGO_SYMBOL = 'eclair';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime : 'none' pour tous les sites (RECETTE §15.6, décision de l'éditeur du 2026-10-06) :
 *  aucun bandeau, aucun cookie, Clarity chargé en mode sans cookie (consentv2 denied).
 *  'opt-in' / 'notice' ne servent plus qu'aux sites anciens qui les portent encore. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
export const GA4_ID = '';
/** Projet Microsoft Clarity (compte amradif), chargé sans cookie. Vide = aucune mesure. */
export const CLARITY_ID = '';
export const INDEXNOW_KEY = '7f3c2a9e5b1d4c8e9a6f0b2d3e4c5a61';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE, À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',  // éditeur de tous les sites du portefeuille (RECETTE §8)
  legalForm: '',
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "TVA",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
