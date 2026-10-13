import type { Locale } from './routes';
const sv = {
  updatedOn: 'Uppdaterad', editorialPolicy: 'Redaktionell policy', contactLabel: 'Kontakt', reviewedBy: 'Granskad av',
  skipToContent: 'Hoppa till innehållet', mainNav: 'Huvudmeny', breadcrumbLabel: 'Brödsmulor', breadcrumbHome: 'Start', menuOpen: 'Öppna menyn',
  faqTitle: 'Vanliga frågor', relatedCalculators: 'Relaterade sidor och kalkylatorer', sourcesTitle: 'Källor', writtenBy: 'Skriven av',
  asOf: 'Belopp och regler', lastUpdated: 'kontrollerade', footerValidated: 'Källor: Skatteverket (energiskatt), SCB (elpriser och elavtal), Energimarknadsinspektionen, elnätsföretagens prislistor', footerBrowser: 'Räknas helt i din webbläsare · inga uppgifter skickas · gratis',
  footerDisclaimer: 'Fristående webbplats som ges ut av Radif Partners, utan koppling till något elhandelsbolag, elnätsföretag, Nord Pool eller någon myndighet. Siffrorna är uppskattningar utifrån publicerade skattesatser och prislistor och de priser du själv anger; din faktura från elhandlaren och nätföretaget gäller. Inga avtal säljs, inga kontakter förmedlas.', footerPopular: '', notFound: 'Sidan finns inte.',
  readMore: 'Läs mer',
};
const en: typeof sv = {
  updatedOn: 'Updated', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main menu', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Frequently asked questions', relatedCalculators: 'Related pages and calculators', sourcesTitle: 'Sources', writtenBy: 'Written by',
  asOf: 'Amounts and rules', lastUpdated: 'checked', footerValidated: 'Sources: Swedish Tax Agency (energy tax), Statistics Sweden (electricity prices and contracts), Swedish Energy Markets Inspectorate, network companies’ price lists', footerBrowser: 'Calculated entirely in your browser · no data sent · free',
  footerDisclaimer: 'Independent website published by Radif Partners, with no link to any electricity retailer, grid company, Nord Pool or public authority. Figures are estimates only, built from published tax rates and price lists and the prices you enter yourself; your bills from the retailer and the grid company are what count. No contracts sold, no referrals.', footerPopular: '', notFound: 'This page does not exist.',
  readMore: 'Read more',
};
export function t(lang: Locale) { return lang === 'en' ? en : sv; }
